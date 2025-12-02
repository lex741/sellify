import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { z } from "zod";

const router = Router();

router.get("/products", async (req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            where: { storeId: req.storeId, isDeleted: false },
            orderBy: { createdAt: "desc" },
        });
        res.json({ storeId: req.storeId, products });
    } catch (e) {
        next(e);
    }
});

const createProductSchema = z.object({
    name: z.string().min(2).max(80),
    description: z.string().max(1000).optional(),
    priceAmount: z.string(), // простіше: як рядок "1999.00"
    priceCurrency: z.enum(["UAH", "USD", "EUR"]).default("UAH"),
    stockQty: z.number().int().min(0).default(0),
    imageUrl: z.string().url().optional(),
});

router.post("/products", async (req, res, next) => {
    try {
        const data = createProductSchema.parse(req.body);

        // storeId завжди беремо з tenant middleware, а не з body
        const product = await prisma.product.create({
            data: {
                storeId: req.storeId,
                name: data.name,
                description: data.description,
                priceAmount: data.priceAmount,
                priceCurrency: data.priceCurrency,
                stockQty: data.stockQty,
                imageUrl: data.imageUrl,
                isActive: true,
                isDeleted: false,
            },
        });

        res.status(201).json({ product });
    } catch (e) {
        if (e?.name === "ZodError") return next(new HttpError(400, "Validation error", e.errors));
        next(e);
    }
});

const updateProductSchema = z.object({
    name: z.string().min(2).max(80).optional(),
    description: z.string().max(1000).optional(),
    priceAmount: z.string().optional(),
    priceCurrency: z.enum(["UAH", "USD", "EUR"]).optional(),
    stockQty: z.number().int().min(0).optional(),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().optional(),
});

// ВАЖЛИВО: update по id у Prisma йде тільки по унікальному ключу.
// Щоб не було витоків між магазинами — робимо updateMany з where { id, storeId }
router.patch("/products/:id", async (req, res, next) => {
    try {
        const data = updateProductSchema.parse(req.body);
        const id = req.params.id;

        const result = await prisma.product.updateMany({
            where: { id, storeId: req.storeId, isDeleted: false },
            data,
        });

        if (result.count === 0) throw new HttpError(404, "Product not found");

        const product = await prisma.product.findFirst({
            where: { id, storeId: req.storeId },
        });

        res.json({ product });
    } catch (e) {
        if (e?.name === "ZodError") return next(new HttpError(400, "Validation error", e.errors));
        next(e);
    }
});

// soft delete: теж через updateMany + storeId
router.delete("/products/:id", async (req, res, next) => {
    try {
        const id = req.params.id;

        const result = await prisma.product.updateMany({
            where: { id, storeId: req.storeId, isDeleted: false },
            data: { isDeleted: true, isActive: false },
        });

        if (result.count === 0) throw new HttpError(404, "Product not found");

        res.status(204).send();
    } catch (e) {
        next(e);
    }
});

export default router;
