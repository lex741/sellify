import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import { RatesService } from "../services/ratesService.js";

const router = Router();

// GET /api/store/:slug  (дані магазину + theme_json)
router.get("/:slug", async (req, res, next) => {
    try {
        const slug = String(req.params.slug || "").trim();

        const store = await prisma.store.findFirst({
            where: { slug, isDeleted: false, isActive: true },
            select: {
                id: true,
                slug: true,
                name: true,
                description: true,
                logoUrl: true,
                themeJson: true,

            },
        });

        if (!store) throw new HttpError(404, "Магазин не знайдено");

        res.json({
            store: {
                id: store.id,
                slug: store.slug,
                name: store.name,
                description: store.description,
                logoUrl: store.logoUrl,
                theme_json: store.themeJson ?? null,
            },
        });
    } catch (e) {
        next(e);
    }
});

// GET /api/store/:slug/products?q=&page=&limit=
router.get("/:slug/products", async (req, res, next) => {
    try {
        const slug = String(req.params.slug || "").trim();
        const q = String(req.query.q || "").trim();
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
        const skip = (page - 1) * limit;

        const store = await prisma.store.findFirst({
            where: { slug, isDeleted: false, isActive: true },
            select: { id: true },
        });
        if (!store) throw new HttpError(404, "Магазин не знайдено");

        const where = {
            storeId: store.id,
            isDeleted: false,
            isActive: true,
            ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
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
                    imageUrl: true,
                    stockQty: true,
                    priceAmount: true,
                    priceCurrency: true,
                },
            }),
        ]);

        const items = rows.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            imageUrl: p.imageUrl,
            stock: p.stockQty,
            original_price: { amount: String(p.priceAmount), currency: p.priceCurrency },
            price_uah: RatesService.convertToUah(p.priceAmount, p.priceCurrency),
        }));

        res.json({
            items,
            meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), q },
        });
    } catch (e) {
        next(e);
    }
});

// GET /api/store/:slug/products/:productId
router.get("/:slug/products/:productId", async (req, res, next) => {
    try {
        const slug = String(req.params.slug || "").trim();
        const productId = String(req.params.productId || "").trim();

        const store = await prisma.store.findFirst({
            where: { slug, isDeleted: false, isActive: true },
            select: { id: true },
        });
        if (!store) throw new HttpError(404, "Магазин не знайдено");

        const p = await prisma.product.findFirst({
            where: { id: productId, storeId: store.id, isDeleted: false, isActive: true },
            select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                stockQty: true,
                priceAmount: true,
                priceCurrency: true,
            },
        });
        if (!p) throw new HttpError(404, "Товар не знайдено");

        res.json({
            product: {
                id: p.id,
                name: p.name,
                description: p.description,
                imageUrl: p.imageUrl,
                stock: p.stockQty,
                original_price: { amount: String(p.priceAmount), currency: p.priceCurrency },
                price_uah: RatesService.convertToUah(p.priceAmount, p.priceCurrency),
            },
        });
    } catch (e) {
        next(e);
    }
});

export default router;
