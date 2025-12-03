import { HttpError } from "./errorHandler.js";

export function validateBody(schema) {
    return (req, _res, next) => {
        if (!schema) return next(new HttpError(500, "Validation schema is missing"));
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) return next(new HttpError(400, "Validation error", parsed.error.errors));
        req.body = parsed.data;
        next();
    };
}
