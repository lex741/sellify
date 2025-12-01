import jwt from "jsonwebtoken";
import { HttpError } from "./errorHandler.js";

export function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
        return next(new HttpError(401, "Missing or invalid Authorization header"));
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // { sub, role, storeId? }
        return next();
    } catch {
        return next(new HttpError(401, "Invalid token"));
    }
}
