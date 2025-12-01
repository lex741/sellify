import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import apiRouter from "./routes/index.js";
import { errorHandler, notFoundApi } from "./middleware/errorHandler.js";

export function createApp() {
    const app = express();

    app.use(helmet());
    app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

    app.use(express.json({ limit: "1mb" }));
    app.use(morgan("dev"));

    app.get("/api/health", (req, res) => res.json({ ok: true }));

    app.use("/api", apiRouter);

    app.use("/api", notFoundApi); // тільки для /api
    app.use(errorHandler);

    return app;
}
