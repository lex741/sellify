export class HttpError extends Error {
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

export function notFoundApi(req, res) {
    res.status(404).json({ error: "Not Found" });
}

export function errorHandler(err, req, res, next) {
    const status = err?.status || 500;

    // мінімальне логування помилок:
    console.error(err);

    res.status(status).json({
        error: err?.message || "Internal Server Error",
        details: err?.details,
    });
}
