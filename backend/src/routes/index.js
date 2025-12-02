import { Router } from "express";
import authRoutes from "./auth.routes.js";

import storePublicRoutes from "./store.public.routes.js";
import merchantRoutes from "./merchant/index.js";
import productsRoutes from "./products.routes.js";

import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { tenantFromSlug, tenantFromToken } from "../middleware/tenant.js";
import storesRoutes from "./stores.routes.js";

const router = Router();

router.use("/auth", authRoutes);

// Public storefront
router.use("/store/:slug", tenantFromSlug, storePublicRoutes);
router.use(
    "/products",
    requireAuth,
    requireRole("MERCHANT", "ADMIN"),
    tenantFromToken,
    productsRoutes
);
// Merchant area
router.use("/merchant", requireAuth, requireRole("MERCHANT", "ADMIN"), tenantFromToken, merchantRoutes);
router.use("/stores", requireAuth, requireRole("MERCHANT", "ADMIN"), tenantFromToken, storesRoutes);
export default router;
