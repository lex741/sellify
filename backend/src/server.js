import "dotenv/config";
import { createApp } from "./app.js";
import { shutdownDb } from "./lib/prisma.js";

const app = createApp();
const port = Number(process.env.PORT || 3000);

const server = app.listen(port, () => {
    console.log(`API running on http://localhost:${port}/api`);
});

async function shutdown() {
    console.log("Shutting down...");
    server.close(async () => {
        await shutdownDb();
        process.exit(0);
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
