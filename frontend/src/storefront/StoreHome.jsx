import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getBlocks, applyThemeCssVars } from "./renderer/renderEngine.js";
import { renderBlock } from "./renderer/blockFactory.jsx";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export default function StoreHome() {
    const { slug } = useParams();

    const [store, setStore] = useState(null);
    const [themeJson, setThemeJson] = useState(null);

    const [products, setProducts] = useState([]);
    const [q, setQ] = useState("");
    const [err, setErr] = useState(null);

    async function loadStore() {
        const res = await fetch(`${API}/store/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        return data.store;
    }

    async function loadProducts(query) {
        const qs = query ? `&q=${encodeURIComponent(query)}` : "";
        const res = await fetch(`${API}/store/${slug}/products?page=1&limit=24${qs}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        return data.items;
    }

    useEffect(() => {
        (async () => {
            setErr(null);
            try {
                const s = await loadStore();
                setStore(s);

                const tj = s.theme_json || defaultThemeJson(s);
                setThemeJson(tj);
                applyThemeCssVars(tj);

                const items = await loadProducts("");
                setProducts(items);
            } catch (e) {
                setErr(e.message);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    // пошук: мінімум 3 символи, інакше не шлемо q на бекенд
    useEffect(() => {
        const trimmed = q.trim();
        const canSearch = trimmed.length === 0 || trimmed.length >= 3;

        const t = setTimeout(async () => {
            if (!canSearch) return;
            try {
                setErr(null);
                const items = await loadProducts(trimmed);
                setProducts(items);
            } catch (e) {
                setErr(e.message);
            }
        }, 300);

        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    const blocks = useMemo(() => getBlocks(themeJson), [themeJson]);

    if (err) return <div style={{ color: "crimson" }}>Помилка: {err}</div>;
    if (!store || !themeJson) return <div>Завантаження...</div>;

    return (
        <div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{store.name}</div>
                <div style={{ marginLeft: "auto" }}>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Пошук (мін. 3 символи)"
                        style={{ width: 260 }}
                    />
                </div>
            </div>

            {q.trim().length > 0 && q.trim().length < 3 && (
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
                    Введіть мінімум 3 символи для пошуку
                </div>
            )}

            <div style={{ display: "grid", gap: 14 }}>
                {blocks.map((b, idx) => (
                    <div key={idx}>{renderBlock(b, { products })}</div>
                ))}
            </div>
        </div>
    );
}

function defaultThemeJson(store) {
    return {
        theme: {
            colors: { primary: "#111111", bg: "#f6f6f6", text: "#111111" },
            fonts: { body: "system-ui", heading: "system-ui" },
        },
        layout: [
            { type: "banner", title: store?.name ?? "Магазин", subtitle: store?.description ?? "Каталог товарів" },
            { type: "productGrid" },
            { type: "footer", text: "© 2025 Sellify. Всі права захищено" },
        ],
        content: {},
    };
}
