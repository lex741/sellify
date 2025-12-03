import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

function getStoreId(req) {
    return req.storeId ?? req.tenant?.storeId ?? null;
}

function isPlainObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
}

// М’яка валідація + підтримка 3 форматів: draft | {themeJson:draft} | {themeConfig:draft}
function extractAndValidateTheme(body) {
    const cfg = body?.themeJson ?? body?.themeConfig ?? body;

    if (!isPlainObject(cfg)) throw new HttpError(400, "Validation error: theme body must be an object");
    if (!isPlainObject(cfg.theme)) throw new HttpError(400, "Validation error: theme.theme is required");
    if (!isPlainObject(cfg.theme.colors)) throw new HttpError(400, "Validation error: theme.colors is required");

    const colors = cfg.theme.colors;
    const required = ["background", "text", "accent", "surface"];
    for (const k of required) {
        if (typeof colors[k] !== "string" || colors[k].length < 3) {
            throw new HttpError(400, `Validation error: theme.colors.${k} must be a string`);
        }
    }

    // fonts optional
    if (cfg.theme.fonts !== undefined && !isPlainObject(cfg.theme.fonts)) {
        throw new HttpError(400, "Validation error: theme.fonts must be an object");
    }

    // layout optional, але якщо є — має бути масив
    if (cfg.layout !== undefined) {
        if (!Array.isArray(cfg.layout)) throw new HttpError(400, "Validation error: layout must be an array");
        for (const b of cfg.layout) {
            if (!isPlainObject(b)) throw new HttpError(400, "Validation error: layout item must be an object");
            if (!["banner", "productGrid", "footer"].includes(b.type)) {
                throw new HttpError(400, "Validation error: invalid block type in layout");
            }
            if (b.props !== undefined && !isPlainObject(b.props)) {
                // props може бути будь-що, але хоча б не масив/примітив — щоб не ламати рендер
                throw new HttpError(400, "Validation error: block props must be an object");
            }
        }
    } else {
        cfg.layout = []; // щоб Prisma завжди зберігав однаково
    }

    // content optional
    if (cfg.content !== undefined && !isPlainObject(cfg.content)) {
        throw new HttpError(400, "Validation error: content must be an object");
    }

    return cfg;
}

router.get("/me", async (req, res, next) => {
    try {
        const storeId = getStoreId(req);
        if (!storeId) throw new HttpError(401, "No store in token");

        const store = await prisma.store.findFirst({
            where: { id: storeId, isDeleted: false },
            select: {
                id: true,
                slug: true,
                name: true,
                description: true,
                logoUrl: true,
                themeJson: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!store) throw new HttpError(404, "Store not found");

        return res.json({
            store: {
                ...store,
                themeConfig: store.themeJson, // для фронта
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
        const storeId = getStoreId(req);
        if (!storeId) throw new HttpError(401, "No store in token");

        const data = storeUpdateSchema.parse(req.body);

        const upd = await prisma.store.updateMany({
            where: { id: storeId, isDeleted: false },
            data,
        });
        if (upd.count === 0) throw new HttpError(404, "Store not found");

        const store = await prisma.store.findFirst({
            where: { id: storeId, isDeleted: false },
            select: { id: true, slug: true, name: true, description: true, logoUrl: true },
        });

        res.json({ store });
    } catch (e) {
        if (e?.name === "ZodError") return next(new HttpError(400, "Validation error", e.errors));
        next(e);
    }
});

router.put("/me/theme", async (req, res, next) => {
    try {
        const storeId = getStoreId(req);
        if (!storeId) throw new HttpError(401, "No store in token");

        const cfg = extractAndValidateTheme(req.body);

        const upd = await prisma.store.updateMany({
            where: { id: storeId, isDeleted: false },
            data: { themeJson: cfg },
        });
        if (upd.count === 0) throw new HttpError(404, "Store not found");

        res.json({ ok: true });
    } catch (e) {
        next(e);
    }
});

export default router;
