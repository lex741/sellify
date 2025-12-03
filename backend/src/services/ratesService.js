import { prisma } from "../lib/prisma.js";

let cache = {
    updatedAt: null,
    // best rates: "USD" -> number (UAH за 1 USD)
    bestRatesToUah: new Map(),
    // для дебагу/демо
    lastComparison: null, // { fetchedAt, USD:{nbu, privat, best, source}, EUR:{...} }
};

function upper(ccy) {
    return String(ccy || "").trim().toUpperCase();
}

function toNum(x) {
    const n = Number(String(x).replace(",", "."));
    return Number.isFinite(n) ? n : null;
}

async function fetchNbu() {
    const url = process.env.NBU_RATES_URL;
    if (!url) throw new Error("NBU_RATES_URL is not set");

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`NBU HTTP ${res.status}`);

    const payload = await res.json(); // очікуємо масив
    const out = {}; // USD/EUR -> rateToUah

    if (Array.isArray(payload)) {
        for (const r of payload) {
            const ccy = upper(r.cc);
            const rate = toNum(r.rate);
            if (!ccy || !rate) continue;
            if (ccy === "USD" || ccy === "EUR") out[ccy] = rate;
        }
    }

    return out; // напр: {USD: 42.26, EUR: 45.12}
}

async function fetchPrivat() {
    const url = process.env.PRIVAT_RATES_URL;
    if (!url) throw new Error("PRIVAT_RATES_URL is not set");

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`PRIVAT HTTP ${res.status}`);

    const payload = await res.json(); // масив [{ccy, base_ccy, buy, sale}, ...]
    const out = {}; // USD/EUR -> rateToUah

    if (Array.isArray(payload)) {
        for (const r of payload) {
            const ccy = upper(r.ccy);
            const base = upper(r.base_ccy);
            if (base !== "UAH") continue;
            if (ccy !== "USD" && ccy !== "EUR") continue;

            // беремо "sale" як базовий курс (UAH за 1 USD/EUR), але все одно далі мінімізуємо між НБУ/Приват
            const sale = toNum(r.sale);
            const buy = toNum(r.buy);

            // якщо sale нема — fallback на buy
            const rate = sale ?? buy;
            if (rate) out[ccy] = rate;
        }
    }

    return out; // напр: {USD: 42.80, EUR: 46.10}
}

function chooseBest({ nbu, privat }) {
    const currencies = ["USD", "EUR"];
    const best = {};
    const comparison = {};

    for (const c of currencies) {
        const n = nbu?.[c] ?? null;
        const p = privat?.[c] ?? null;

        let chosen = null;
        let source = null;

        if (n != null && p != null) {
            chosen = Math.min(n, p); // ВИГІДНІШИЙ = МЕНШИЙ
            source = chosen === n ? "NBU" : "PRIVAT";
        } else if (n != null) {
            chosen = n;
            source = "NBU";
        } else if (p != null) {
            chosen = p;
            source = "PRIVAT";
        }

        if (chosen != null && chosen > 0) {
            best[c] = chosen;
        }

        comparison[c] = { nbu: n, privat: p, best: chosen, source };
    }

    return { best, comparison };
}

export const RatesService = {
    async initFromDb() {
        // беремо останні збережені курси (те, що ми використовували як best)
        const rows = await prisma.exchangeRate.findMany({
            where: { isDeleted: false },
            orderBy: { fetchedAt: "desc" },
            take: 50,
            select: { quoteCcy: true, rateToUah: true, fetchedAt: true },
        });

        const map = new Map();
        let newest = null;

        for (const r of rows) {
            const ccy = r.quoteCcy;
            if ((ccy === "USD" || ccy === "EUR") && !map.has(ccy)) {
                map.set(ccy, Number(r.rateToUah));
            }
            if (!newest || r.fetchedAt > newest) newest = r.fetchedAt;
            if (map.size >= 2) break;
        }

        cache.bestRatesToUah = map;
        cache.updatedAt = newest;
    },

    async fetchRatesGracefully() {
        const now = new Date();

        // паралельно тягнемо обидва джерела, але кожне може впасти окремо
        let nbu = null;
        let privat = null;
        let nbuErr = null;
        let privatErr = null;

        await Promise.all([
            fetchNbu()
                .then((r) => (nbu = r))
                .catch((e) => (nbuErr = e)),
            fetchPrivat()
                .then((r) => (privat = r))
                .catch((e) => (privatErr = e)),
        ]);

        const { best, comparison } = chooseBest({ nbu, privat });
        cache.lastComparison = { fetchedAt: now, ...comparison };

        // якщо обидва джерела померли і best порожній → graceful fallback на кеш
        const gotAnything = Object.keys(best).length > 0;

        if (!gotAnything) {
            return {
                ok: false,
                updatedAt: cache.updatedAt,
                ratesToUah: Object.fromEntries(cache.bestRatesToUah),
                error: `Both sources failed. NBU: ${nbuErr?.message || "ok"}; PRIVAT: ${privatErr?.message || "ok"}`,
            };
        }

        // записуємо в БД те, що реально використовуємо (best)
        const data = [];
        for (const [ccy, rate] of Object.entries(best)) {
            data.push({ quoteCcy: ccy, rateToUah: String(rate), fetchedAt: now });
        }
        if (data.length) await prisma.exchangeRate.createMany({ data });

        // оновлюємо кеш
        const newMap = new Map(cache.bestRatesToUah);
        for (const [ccy, rate] of Object.entries(best)) newMap.set(ccy, rate);
        cache.bestRatesToUah = newMap;
        cache.updatedAt = now;

        console.log("[rates] compare", cache.lastComparison);
        console.log("[rates] best", Object.fromEntries(newMap));

        return {
            ok: true,
            updatedAt: now,
            ratesToUah: Object.fromEntries(newMap),
            compare: cache.lastComparison,
        };
    },

    getRateToUah(ccy) {
        const C = upper(ccy);
        if (C === "UAH") return 1;
        return cache.bestRatesToUah.get(C) ?? null;
    },

    convertToUah(amount, ccy) {
        const n = Number(amount);
        if (!Number.isFinite(n)) return null;

        const rate = this.getRateToUah(ccy);
        if (!rate) return null;

        return Number((n * rate).toFixed(2));
    },

    getDebug() {
        return {
            updatedAt: cache.updatedAt,
            bestRatesToUah: Object.fromEntries(cache.bestRatesToUah),
            lastComparison: cache.lastComparison,
        };
    },
};
