import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    storeSlug: z.string().min(3).max(40).regex(/^[a-z0-9-]+$/),
    storeName: z.string().min(2).max(80),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

function signToken({ userId, role, storeId }) {
    return jwt.sign(
        { sub: userId, role, storeId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

router.post("/register-merchant", async (req, res, next) => {
    try {
        const data = registerSchema.parse(req.body);

        const existsUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existsUser) throw new HttpError(409, "Email already registered");

        const existsStore = await prisma.store.findUnique({ where: { slug: data.storeSlug } });
        if (existsStore) throw new HttpError(409, "Store slug already taken");

        const passwordHash = await bcrypt.hash(data.password, 10);

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    role: "MERCHANT",
                },
            });

            const store = await tx.store.create({
                data: {
                    ownerUserId: user.id,
                    slug: data.storeSlug,
                    name: data.storeName,
                    isActive: true,
                    isDeleted: false,
                },
            });

            return { user, store };
        });

        const token = signToken({ userId: result.user.id, role: result.user.role, storeId: result.store.id });

        res.status(201).json({
            token,
            user: { id: result.user.id, email: result.user.email, role: result.user.role },
            store: { id: result.store.id, slug: result.store.slug, name: result.store.name },
        });
    } catch (e) {
        if (e?.name === "ZodError") return next(new HttpError(400, "Validation error", e.errors));
        return next(e);
    }
});

router.post("/login", async (req, res, next) => {
    try {
        const data = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email: data.email } });
        if (!user) throw new HttpError(401, "Invalid credentials");

        const ok = await bcrypt.compare(data.password, user.passwordHash);
        if (!ok) throw new HttpError(401, "Invalid credentials");

        // для мерчанта підтягуємо його storeId (один магазин на старті)
        let storeId = null;
        if (user.role === "MERCHANT") {
            const store = await prisma.store.findFirst({
                where: { ownerUserId: user.id, isDeleted: false },
                select: { id: true },
            });
            storeId = store?.id || null;
        }

        const token = signToken({ userId: user.id, role: user.role, storeId });

        res.json({
            token,
            user: { id: user.id, email: user.email, role: user.role },
            storeId,
        });
    } catch (e) {
        if (e?.name === "ZodError") return next(new HttpError(400, "Validation error", e.errors));
        return next(e);
    }
});

export default router;
