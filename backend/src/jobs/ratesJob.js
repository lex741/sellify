import { RatesService } from "../services/ratesService.js";

let timer = null;

export async function startRatesJob() {
    // 1) спробуємо підняти кеш із БД
    await RatesService.initFromDb();

    // 2) одразу пробуємо оновити з API
    await RatesService.fetchRatesGracefully();

    // 3) кожну годину
    timer = setInterval(async () => {
        const r = await RatesService.fetchRatesGracefully();
        if (r.ok) console.log("[rates] updated", r.updatedAt);
        else console.log("[rates] failed, using cached", r.updatedAt, r.error);
    }, 60 * 60 * 1000);
}

export function stopRatesJob() {
    if (timer) clearInterval(timer);
    timer = null;
}
