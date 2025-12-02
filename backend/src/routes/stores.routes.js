import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

router.get("/me", async (req, res, next) => {
    try {
        const store = await prisma.store.findFirst({
            where: { id: req.storeId, isDeleted: false },
            select: {
                id: true,
                slug: true,
                name: true,
                description: true,
                logoUrl: true,
                themeJson: true,   // <-- у тебе поле themeJson
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!store) throw new HttpError(404, "Store not found");

        // віддаємо як themeConfig (зручно для фронта), але зберігаємо в БД у themeJson
        return res.json({
            store: {
                ...store,
                themeConfig: store.themeJson,
            },
        });
    } catch (e) {
        return next(e);
    }
});

const storeUpdateSchema = z.object({
    name: z.string().min(2).max(80).optional(),
    description: z.string().max(2000).optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
});

router.put("/me", async (req, res, next) => {
    try {
        const data = storeUpdateSchema.parse(req.body);

        const upd = await prisma.store.updateMany({
            where: { id: req.storeId, isDeleted: false },
            data,
        });
        if (upd.count === 0) throw new HttpError(404, "Store not found");

        const store = await prisma.store.findFirst({
            where: { id: req.storeId, isDeleted: false },
            select: { id: true, slug: true, name: true, description: true, logoUrl: true },
        });

        res.json({ store });
    } catch (e) {
        if (e?.name === "ZodError") return next(new HttpError(400, "Validation error", e.errors));
        next(e);
    }
});


// JSON theme/config
const themeSchema = z.object({
    theme: z.object({
        colors: z.object({
            background: z.string(),
            text: z.string(),
            accent: z.string(),
            surface: z.string(),
        }),
        fonts: z.object({
            base: z.string(),
            heading: z.string(),
        }).optional(),
    }),
    layout: z.array(z.object({
        type: z.enum(["banner", "productGrid", "footer"]),
        props: z.record(z.any()).optional(),
    })).default([]),
    content: z.object({
        logoUrl: z.string().url().optional().nullable(),
        headline: z.string().max(120).optional(),
        subtitle: z.string().max(240).optional(),
        footerText: z.string().max(240).optional(),
        links: z.array(z.object({ label: z.string().max(40), href: z.string().max(200) })).optional(),
    }).default({}),
}).passthrough();

router.put("/me/theme", async (req, res, next) => {
    try {
        const cfg = themeSchema.parse(req.body);

        const upd = await prisma.store.updateMany({
            where: { id: req.storeId, isDeleted: false },
            data: { themeJson: cfg },
        });
        if (upd.count === 0) throw new HttpError(404, "Store not found");

        res.json({ ok: true });
    } catch (e) {
        if (e?.name === "ZodError") return next(new HttpError(400, "Validation error", e.errors));
        next(e);
    }
});

export default router;
