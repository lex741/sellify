import { Router } from "express";

import authRoutes from "./auth.routes.js";
import publicStoreRoutes from "./publicStore.routes.js";

import merchantRoutes from "./merchant/index.js";
import productsRoutes from "./products.routes.js";
import storesRoutes from "./stores.routes.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { tenantFromToken } from "../middleware/tenant.js";

const router = Router();

// Auth
router.use("/auth", authRoutes);

// Public Storefront
router.use("/store", publicStoreRoutes);

// Merchant area
router.use(
    "/products",
    requireAuth,
    requireRole("MERCHANT", "ADMIN"),
    tenantFromToken,
    productsRoutes
);

router.use(
    "/merchant",
    requireAuth,
    requireRole("MERCHANT", "ADMIN"),
    tenantFromToken,
    merchantRoutes
);

router.use(
    "/stores",
    requireAuth,
    requireRole("MERCHANT", "ADMIN"),
    tenantFromToken,
    storesRoutes
);

export default router;
