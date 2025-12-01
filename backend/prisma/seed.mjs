import "dotenv/config";
import pkg from "@prisma/client";
const { PrismaClient, Role, Currency, OrderStatus } = pkg;

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DB_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD are required in backend/.env");
    }

    const adminHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash: adminHash,
            role: Role.ADMIN,
        },
    });

    const merchant = await prisma.user.upsert({
        where: { email: "merchant@sellify.local" },
        update: {},
        create: {
            email: "merchant@sellify.local",
            passwordHash: await bcrypt.hash("merchant12345", 10),
            role: Role.MERCHANT,
        },
    });

    const store = await prisma.store.upsert({
        where: { slug: "demo-store" },
        update: {},
        create: {
            ownerUserId: merchant.id,
            slug: "demo-store",
            name: "Demo Store",
            description: "Test store for course demo",
            themeJson: { colors: { primary: "#111827" } },
            isActive: true,
            isDeleted: false,
        },
    });

    const [p1, p2] = await Promise.all([
        prisma.product.create({
            data: {
                storeId: store.id,
                name: "Silver Ring",
                description: "Demo product",
                priceAmount: "1999.00",
                priceCurrency: Currency.UAH,
                stockQty: 10,
                isActive: true,
                isDeleted: false,
            },
        }),
        prisma.product.create({
            data: {
                storeId: store.id,
                name: "Gold Pendant",
                description: "Demo product",
                priceAmount: "4999.00",
                priceCurrency: Currency.UAH,
                stockQty: 5,
                isActive: true,
                isDeleted: false,
            },
        }),
    ]);

    const customer = await prisma.user.upsert({
        where: { email: "customer@sellify.local" },
        update: {},
        create: {
            email: "customer@sellify.local",
            passwordHash: await bcrypt.hash("customer12345", 10),
            role: Role.CUSTOMER,
        },
    });

    const order = await prisma.order.create({
        data: {
            storeId: store.id,
            customerUserId: customer.id,
            customerName: "Test Customer",
            phone: "+380000000000",
            email: "customer@sellify.local",
            status: OrderStatus.DELIVERED,
            totalUah: "1999.00",
            items: {
                create: [
                    { productId: p1.id, qty: 1, priceUahAtPurchase: "1999.00" },
                ],
            },
        },
    });

    await prisma.review.create({
        data: {
            storeId: store.id,
            productId: p1.id,
            customerUserId: customer.id,
            rating: 5,
            text: "Great!",
            isVerifiedPurchase: true,
        },
    });

    await prisma.systemLog.create({
        data: {
            level: "INFO",
            source: "seed",
            message: "Seed completed",
            metaJson: { adminId: admin.id, storeId: store.id, orderId: order.id },
        },
    });
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
