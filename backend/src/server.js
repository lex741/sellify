import "dotenv/config";
import { createApp } from "./app.js";
import { shutdownDb } from "./lib/prisma.js";
import { startRatesJob, stopRatesJob } from "./jobs/ratesJob.js";

const app = createApp();
const port = Number(process.env.PORT || 3000);

const server = app.listen(port, () => {
    console.log(`API running on http://localhost:${port}/api`);
});
startRatesJob().catch((e) => console.error("RatesJob failed to start:", e));

async function shutdown() {
    console.log("Shutting down...");
    server.close(async () => {
        stopRatesJob();
        await shutdownDb();
        process.exit(0);
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
