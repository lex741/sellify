import { prisma } from "../lib/prisma.js";
import { HttpError } from "./errorHandler.js";

/**
 * Для мерчанта: storeId з токена або з БД по ownerUserId
 * Вихід: req.storeId
 */
export async function tenantFromToken(req, res, next) {
    try {
        const role = req.user?.role;
        if (!role) return next(new HttpError(401, "Unauthorized"));

        // Admin можемо пропускати без storeId (або вимагати окремо — як хочеш)
        if (role === "ADMIN") {
            req.storeId = req.user.storeId ?? null;
            return next();
        }

        if (role !== "MERCHANT") {
            return next(new HttpError(403, "Only merchant can access this area"));
        }

        // 1) пробуємо з токена
        if (req.user.storeId) {
            req.storeId = req.user.storeId;
            return next();
        }

        // 2) якщо в токені storeId нема — дістаємо магазин по ownerUserId
        const store = await prisma.store.findFirst({
            where: { ownerUserId: req.user.sub, isDeleted: false, isActive: true },
            select: { id: true },
        });

        if (!store) return next(new HttpError(403, "Merchant store not found"));

        req.storeId = store.id;
        return next();
    } catch (e) {
        return next(e);
    }
}

/**
 * Для публічної вітрини: storeId по slug з URL
 * Вихід: req.storeId, req.storePublic (метадані магазину)
 */
export async function tenantFromSlug(req, res, next) {
    try {
        const slug = req.params.slug;
        if (!slug) return next(new HttpError(400, "Missing store slug"));

        const store = await prisma.store.findUnique({
            where: { slug },
            select: { id: true, slug: true, name: true, description: true, isActive: true, isDeleted: true },
        });

        if (!store || store.isDeleted || !store.isActive) {
            return next(new HttpError(404, "Store not found"));
        }

        req.storeId = store.id;
        req.storePublic = { slug: store.slug, name: store.name, description: store.description };
        return next();
    } catch (e) {
        return next(e);
    }
}
