import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;

const pool = new Pool({
    connectionString: process.env.DB_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export async function shutdownDb() {
    await prisma.$disconnect();
    await pool.end();
}
