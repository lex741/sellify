import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

// ---- Multer config (jpg/png ≤ 5MB) ----
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads"),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        const safeExt = ext === ".jpg" || ext === ".jpeg" || ext === ".png" ? ext : ".bin";
        cb(null, `${Date.now()}-${crypto.randomUUID()}${safeExt}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const ok = file.mimetype === "image/jpeg" || file.mimetype === "image/png";
        if (!ok) return cb(new HttpError(400, "Файл має бути JPG або PNG"));
        cb(null, true);
    },
});

// ---- Validation ----
const currencyEnum = z.enum(["UAH", "USD", "EUR"]);

const productCreateSchema = z.object({
    name: z.string().trim().min(1, "Назва не може бути порожньою"),
    description: z.string().max(5000).optional().nullable(),
    priceAmount: z.coerce.number().gt(0, "Ціна має бути > 0"),
    currency: currencyEnum,
    stock: z.coerce.number().int().min(0, "Залишок не може бути від’ємним").default(0),
});

const productUpdateSchema = z.object({
    name: z.string().trim().min(1).optional(),
    description: z.string().max(5000).optional().nullable(),
    priceAmount: z.coerce.number().gt(0).optional(),
    currency: currencyEnum.optional(),
    stock: z.coerce.number().int().min(0).optional(),
});

// ---- Helpers ----
function toDecimalString(n) {
    return Number(n).toFixed(2);
}

// мапимо реальний запис БД → DTO для API
function mapProduct(p) {
    if (!p) return null;
    return {
        id: p.id,
        name: p.name,
        description: p.description,
        priceAmount: p.priceAmount,
        currency: p.priceCurrency, // ВАЖЛИВО: з БД priceCurrency → у відповіді currency
        stock: p.stockQty,         // ВАЖЛИВО: з БД stockQty → у відповіді stock
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
    };
}

// 1) POST /products (multipart/form-data)
router.post("/", upload.single("image"), async (req, res, next) => {
    try {
        const payload = productCreateSchema.parse(req.body);
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const created = await prisma.product.create({
            data: {
                storeId: req.storeId,
                name: payload.name,
                description: payload.description ?? null,
                priceAmount: toDecimalString(payload.priceAmount),
                priceCurrency: payload.currency,              // ← ТУТ ВАЖЛИВО
                stockQty: payload.stock ?? 0,                 // ← ТУТ ВАЖЛИВО
                imageUrl,
            },
            select: {
                id: true,
                name: true,
                description: true,
                priceAmount: true,
                priceCurrency: true, // ← Бере справжнє поле
                stockQty: true,      // ← Бере справжнє поле
                imageUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(201).json({ product: mapProduct(created) });
    } catch (e) {
        return next(e);
    }
});

// 2) GET /products (pagination + search)
router.get("/", async (req, res, next) => {
    try {
        const q = String(req.query.q || "").trim();
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
        const skip = (page - 1) * limit;

        const where = {
            storeId: req.storeId,
            isDeleted: false,
            ...(q
                ? { name: { contains: q, mode: "insensitive" } }
                : {}),
        };

        const [total, rows] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    priceAmount: true,
                    priceCurrency: true, // ← тут
                    stockQty: true,      // ← тут
                    imageUrl: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);

        const items = rows.map(mapProduct);
        const totalPages = Math.max(1, Math.ceil(total / limit));

        return res.json({
            items,
            meta: { page, limit, total, totalPages, q },
        });
    } catch (e) {
        return next(e);
    }
});

// 3) PUT /products/:id (multipart/form-data)
router.put("/:id", upload.single("image"), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const payload = productUpdateSchema.parse(req.body);

        const data = {
            ...(payload.name !== undefined ? { name: payload.name } : {}),
            ...(payload.description !== undefined ? { description: payload.description } : {}),
            ...(payload.priceAmount !== undefined ? { priceAmount: toDecimalString(payload.priceAmount) } : {}),
            ...(payload.currency !== undefined ? { priceCurrency: payload.currency } : {}), // ← ТУТ
            ...(payload.stock !== undefined ? { stockQty: payload.stock } : {}),           // ← ТУТ
            ...(req.file ? { imageUrl: `/uploads/${req.file.filename}` } : {}),
        };

        const upd = await prisma.product.updateMany({
            where: { id, storeId: req.storeId, isDeleted: false },
            data,
        });

        if (upd.count === 0) throw new HttpError(404, "Товар не знайдено");

        const p = await prisma.product.findFirst({
            where: { id, storeId: req.storeId, isDeleted: false },
            select: {
                id: true,
                name: true,
                description: true,
                priceAmount: true,
                priceCurrency: true,
                stockQty: true,
                imageUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.json({ product: mapProduct(p) });
    } catch (e) {
        return next(e);
    }
});

// 4) DELETE /products/:id -> soft delete
router.delete("/:id", async (req, res, next) => {
    try {
        const id = String(req.params.id);

        const upd = await prisma.product.updateMany({
            where: { id, storeId: req.storeId, isDeleted: false },
            data: { isDeleted: true },
        });

        if (upd.count === 0) throw new HttpError(404, "Товар не знайдено");

        return res.json({ ok: true });
    } catch (e) {
        return next(e);
    }
});

export default router;
