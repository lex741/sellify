import { HttpError } from "./errorHandler.js";

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user?.role) return next(new HttpError(401, "Unauthorized"));
        if (!roles.includes(req.user.role)) return next(new HttpError(403, "Forbidden"));
        return next();
    };
}
