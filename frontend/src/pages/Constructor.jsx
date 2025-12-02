import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import "./constructor.css";

const defaultThemeConfig = {
    theme: {
        colors: {
            background: "#0b1220",
            text: "#e5e7eb",
            accent: "#22c55e",
            surface: "#111827",
        },
        fonts: { base: "system-ui", heading: "system-ui" },
    },
    layout: [
        { type: "banner", props: { title: "Welcome", subtitle: "Best deals" } },
        { type: "productGrid", props: { title: "Products", columns: 3 } },
        { type: "footer", props: { text: "© 2025 Sellify" } },
    ],
    content: {
        headline: "My Store",
        subtitle: "Live preview",
        footerText: "© 2025 Sellify",
        logoUrl: null,
        links: [],
    },
};

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function StorePreview({ config, store }) {
    const vars = useMemo(() => {
        const c = config.theme.colors;
        const f = config.theme.fonts || {};
        return {
            "--bg": c.background,
            "--text": c.text,
            "--accent": c.accent,
            "--surface": c.surface,
            "--font-base": f.base || "system-ui",
            "--font-heading": f.heading || "system-ui",
        };
    }, [config]);

    return (
        <div className="previewRoot" style={vars}>
            <div className="previewFrame">
                <div className="previewHeader">
                    <div className="logoBox">
                        {(config.content.logoUrl || store?.logoUrl) ? (
                            <img
                                alt="logo"
                                src={config.content.logoUrl || store?.logoUrl}
                                className="logoImg"
                            />
                        ) : (
                            <div className="logoPlaceholder">LOGO</div>
                        )}
                    </div>
                    <div>
                        <div className="storeName">{store?.name || "Store"}</div>
                        <div className="storeDesc">{store?.description || ""}</div>
                    </div>
                </div>

                {config.layout.map((block, idx) => {
                    if (block.type === "banner") {
                        return (
                            <div key={idx} className="card">
                                <h2 className="h">{block.props?.title || config.content.headline || "Headline"}</h2>
                                <p className="p">{block.props?.subtitle || config.content.subtitle || "Subtitle"}</p>
                                <button className="btn">Shop now</button>
                            </div>
                        );
                    }

                    if (block.type === "productGrid") {
                        const cols = Number(block.props?.columns || 3);
                        return (
                            <div key={idx} className="card">
                                <div className="gridTitle">{block.props?.title || "Products"}</div>
                                <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                                    {Array.from({ length: cols * 2 }).map((_, i) => (
                                        <div key={i} className="productCard">
                                            <div className="productImg" />
                                            <div className="productName">Product {i + 1}</div>
                                            <div className="productPrice">199 ₴</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    }

                    if (block.type === "footer") {
                        return (
                            <div key={idx} className="footer">
                                {block.props?.text || config.content.footerText || "© 2025 Sellify"}
                            </div>
                        );
                    }

                    return null;
                })}
            </div>
        </div>
    );
}

export default function Constructor() {
    const { token } = useAuth();
    const [store, setStore] = useState(null);
    const [draft, setDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const [err, setErr] = useState(null);

    // окремо локальні поля магазину (бо PUT /stores/me)
    const [storeName, setStoreName] = useState("");
    const [storeDesc, setStoreDesc] = useState("");
    const [storeLogo, setStoreLogo] = useState("");

    useEffect(() => {
        (async () => {
            try {
                setErr(null);
                const data = await api("/stores/me", { token });
                const s = data.store;

                setStore(s);
                setStoreName(s.name || "");
                setStoreDesc(s.description || "");
                setStoreLogo(s.logoUrl || "");

                const cfg = s.themeConfig ? s.themeConfig : defaultThemeConfig;
                setDraft(deepClone(cfg));
            } catch (e2) {
                setErr(e2.message);
            }
        })();
    }, [token]);

    function setColor(key, value) {
        setDraft((prev) => ({
            ...prev,
            theme: {
                ...prev.theme,
                colors: { ...prev.theme.colors, [key]: value },
            },
        }));
    }

    function setBannerTitle(value) {
        setDraft((prev) => ({
            ...prev,
            layout: prev.layout.map((b) =>
                b.type === "banner"
                    ? { ...b, props: { ...(b.props || {}), title: value } }
                    : b
            ),
        }));
    }

    function setBannerSubtitle(value) {
        setDraft((prev) => ({
            ...prev,
            layout: prev.layout.map((b) =>
                b.type === "banner"
                    ? { ...b, props: { ...(b.props || {}), subtitle: value } }
                    : b
            ),
        }));
    }

    function setGridColumns(value) {
        const n = Number(value);
        setDraft((prev) => ({
            ...prev,
            layout: prev.layout.map((b) =>
                b.type === "productGrid"
                    ? { ...b, props: { ...(b.props || {}), columns: Math.max(2, Math.min(4, n)) } }
                    : b
            ),
        }));
    }

    async function onSave() {
        try {
            setSaving(true);
            setMsg(null);
            setErr(null);

            // 1) Зберігаємо дані магазину
            await api("/stores/me", {
                method: "PUT",
                token,
                body: {
                    name: storeName,
                    description: storeDesc || null,
                    logoUrl: storeLogo ? storeLogo : null,
                },
            });

            // 2) Зберігаємо конфіг теми (JSON)
            await api("/stores/me/theme", {
                method: "PUT",
                token,
                body: draft,
            });

            setMsg("Saved");
        } catch (e2) {
            setErr(e2.message);
        } finally {
            setSaving(false);
        }
    }

    if (!draft) return <div>Loading...</div>;

    // Значення для controls
    const banner = draft.layout.find((b) => b.type === "banner")?.props || {};
    const grid = draft.layout.find((b) => b.type === "productGrid")?.props || {};
    const cols = grid.columns || 3;

    return (
        <div className="constructorGrid">
            <div className="leftPanel">
                <h2>Settings / Constructor</h2>

                <div className="section">
                    <div className="sectionTitle">Store info</div>

                    <label className="lbl">
                        Name
                        <input className="inp" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                    </label>

                    <label className="lbl">
                        Description
                        <textarea className="inp" rows={3} value={storeDesc} onChange={(e) => setStoreDesc(e.target.value)} />
                    </label>

                    <label className="lbl">
                        Logo URL
                        <input className="inp" value={storeLogo} onChange={(e) => setStoreLogo(e.target.value)} />
                    </label>
                </div>

                <div className="section">
                    <div className="sectionTitle">Theme colors</div>

                    <div className="row">
                        <div>Background</div>
                        <input type="color" value={draft.theme.colors.background} onChange={(e) => setColor("background", e.target.value)} />
                    </div>
                    <div className="row">
                        <div>Text</div>
                        <input type="color" value={draft.theme.colors.text} onChange={(e) => setColor("text", e.target.value)} />
                    </div>
                    <div className="row">
                        <div>Accent</div>
                        <input type="color" value={draft.theme.colors.accent} onChange={(e) => setColor("accent", e.target.value)} />
                    </div>
                    <div className="row">
                        <div>Surface</div>
                        <input type="color" value={draft.theme.colors.surface} onChange={(e) => setColor("surface", e.target.value)} />
                    </div>
                </div>

                <div className="section">
                    <div className="sectionTitle">Layout</div>

                    <label className="lbl">
                        Banner title
                        <input className="inp" value={banner.title || ""} onChange={(e) => setBannerTitle(e.target.value)} />
                    </label>

                    <label className="lbl">
                        Banner subtitle
                        <input className="inp" value={banner.subtitle || ""} onChange={(e) => setBannerSubtitle(e.target.value)} />
                    </label>

                    <label className="lbl">
                        Product grid columns (2..4)
                        <input
                            className="inp"
                            type="number"
                            min={2}
                            max={4}
                            value={cols}
                            onChange={(e) => setGridColumns(e.target.value)}
                        />
                    </label>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button onClick={onSave} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                    </button>
                    {msg && <span style={{ color: "green" }}>{msg}</span>}
                    {err && <span style={{ color: "crimson" }}>{err}</span>}
                </div>
            </div>

            <div className="rightPanel">
                <div className="previewTitle">Preview</div>
                <StorePreview config={draft} store={{ ...store, name: storeName, description: storeDesc, logoUrl: storeLogo }} />
            </div>
        </div>
    );
}
