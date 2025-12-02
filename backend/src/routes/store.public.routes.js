import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// GET /api/store/:slug (метадані магазину)
router.get("/", (req, res) => {
    res.json({ store: req.storePublic });
});

// GET /api/store/:slug/products
router.get("/products", async (req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                storeId: req.storeId,
                isDeleted: false,
                isActive: true,
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                description: true,
                priceAmount: true,
                priceCurrency: true,
                imageUrl: true,
                ratingAvg: true,
                ratingCount: true,
            },
        });

        res.json({ store: req.storePublic, products });
    } catch (e) {
        next(e);
    }
});

export default router;
