import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import { RatesService } from "../services/ratesService.js";

const router = Router();

// middleware: знайти storeId по slug
router.use("/:slug", async (req, res, next) => {
    try {
        const slug = String(req.params.slug || "").trim();
        if (!slug) throw new HttpError(400, "Slug обовʼязковий");

        const store = await prisma.store.findFirst({
            where: { slug, isDeleted: false, isActive: true },
            select: { id: true },
        });

        if (!store) throw new HttpError(404, "Магазин не знайдено");
        req.storeId = store.id;
        next();
    } catch (e) {
        next(e);
    }
});

// GET /store/:slug/products?q=&page=&limit=
router.get("/:slug/products", async (req, res, next) => {
    try {
        const q = String(req.query.q || "").trim();
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
        const skip = (page - 1) * limit;

        const where = {
            storeId: req.storeId,
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
                    priceAmount: true,
                    priceCurrency: true,
                    stockQty: true,
                    imageUrl: true,
                },
            }),
        ]);

        const items = rows.map((p) => {
            const original_price = { amount: String(p.priceAmount), currency: p.priceCurrency };
            const price_uah = RatesService.convertToUah(p.priceAmount, p.priceCurrency);

            return {
                id: p.id,
                name: p.name,
                description: p.description,
                imageUrl: p.imageUrl,
                stock: p.stockQty,

                original_price,
                price_uah, // розрахунок на бекенді
            };
        });

        return res.json({
            items,
            meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), q },
        });
    } catch (e) {
        next(e);
    }
});

export default router;
