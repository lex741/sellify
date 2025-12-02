import { uk } from "./uk.js";

export function t(path) {
    const parts = path.split(".");
    let cur = uk;
    for (const p of parts) cur = cur?.[p];
    return cur ?? path;
}
