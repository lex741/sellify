import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { t } from "../i18n/t.js";
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
        { type: "banner", props: { title: "Ласкаво просимо", subtitle: "Найкращі пропозиції" } },
        { type: "productGrid", props: { title: t("constructor.productsBlock"), columns: 3 } },
        { type: "footer", props: { text: t("constructor.footerDefault") } },
    ],
    content: {
        headline: "Мій магазин",
        subtitle: "Live preview",
        footerText: t("constructor.footerDefault"),
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
                            <img alt="logo" src={config.content.logoUrl || store?.logoUrl} className="logoImg" />
                        ) : (
                            <div className="logoPlaceholder">{t("constructor.logoPlaceholder")}</div>
                        )}
                    </div>

                    <div>
                        <div className="storeName">{store?.name || "Магазин"}</div>
                        <div className="storeDesc">{store?.description || ""}</div>
                    </div>
                </div>

                {config.layout.map((block, idx) => {
                    if (block.type === "banner") {
                        return (
                            <div key={idx} className="card">
                                <h2 className="h">{block.props?.title || config.content.headline || "Заголовок"}</h2>
                                <p className="p">{block.props?.subtitle || config.content.subtitle || "Підзаголовок"}</p>
                                <button className="btn">{t("constructor.previewBtn")}</button>
                            </div>
                        );
                    }

                    if (block.type === "productGrid") {
                        const cols = Number(block.props?.columns || 3);
                        return (
                            <div key={idx} className="card">
                                <div className="gridTitle">{block.props?.title || t("constructor.productsBlock")}</div>
                                <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                                    {Array.from({ length: cols * 2 }).map((_, i) => (
                                        <div key={i} className="productCard">
                                            <div className="productImg" />
                                            <div className="productName">
                                                {t("constructor.product")} {i + 1}
                                            </div>
                                            <div className="productPrice">{t("constructor.price")}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    }

                    if (block.type === "footer") {
                        return (
                            <div key={idx} className="footer">
                                {block.props?.text || config.content.footerText || t("constructor.footerDefault")}
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
                setErr(e2.message || "Невідома помилка");
            }
        })();
    }, [token]);

    function setColor(key, value) {
        setDraft((prev) => ({
            ...prev,
            theme: { ...prev.theme, colors: { ...prev.theme.colors, [key]: value } },
        }));
    }

    function setBannerTitle(value) {
        setDraft((prev) => ({
            ...prev,
            layout: prev.layout.map((b) =>
                b.type === "banner" ? { ...b, props: { ...(b.props || {}), title: value } } : b
            ),
        }));
    }

    function setBannerSubtitle(value) {
        setDraft((prev) => ({
            ...prev,
            layout: prev.layout.map((b) =>
                b.type === "banner" ? { ...b, props: { ...(b.props || {}), subtitle: value } } : b
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

            await api("/stores/me", {
                method: "PUT",
                token,
                body: { name: storeName, description: storeDesc || null, logoUrl: storeLogo ? storeLogo : null },
            });

            await api("/stores/me/theme", { method: "PUT", token, body: draft });

            setMsg(t("common.saved"));
        } catch (e2) {
            setErr(e2.message || "Невідома помилка");
        } finally {
            setSaving(false);
        }
    }

    if (!draft) return <div>{t("common.loading")}</div>;

    const banner = draft.layout.find((b) => b.type === "banner")?.props || {};
    const grid = draft.layout.find((b) => b.type === "productGrid")?.props || {};
    const cols = grid.columns || 3;

    return (
        <div className="constructorGrid">
            <div className="leftPanel">
                <h2>{t("constructor.title")}</h2>

                <div className="section">
                    <div className="sectionTitle">{t("constructor.storeInfo")}</div>

                    <label className="lbl">
                        {t("constructor.name")}
                        <input className="inp" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                    </label>

                    <label className="lbl">
                        {t("constructor.description")}
                        <textarea className="inp" rows={3} value={storeDesc} onChange={(e) => setStoreDesc(e.target.value)} />
                    </label>

                    <label className="lbl">
                        {t("constructor.logoUrl")}
                        <input className="inp" value={storeLogo} onChange={(e) => setStoreLogo(e.target.value)} />
                    </label>
                </div>

                <div className="section">
                    <div className="sectionTitle">{t("constructor.themeColors")}</div>

                    <div className="row">
                        <div>{t("constructor.background")}</div>
                        <input type="color" value={draft.theme.colors.background} onChange={(e) => setColor("background", e.target.value)} />
                    </div>

                    <div className="row">
                        <div>{t("constructor.text")}</div>
                        <input type="color" value={draft.theme.colors.text} onChange={(e) => setColor("text", e.target.value)} />
                    </div>

                    <div className="row">
                        <div>{t("constructor.accent")}</div>
                        <input type="color" value={draft.theme.colors.accent} onChange={(e) => setColor("accent", e.target.value)} />
                    </div>

                    <div className="row">
                        <div>{t("constructor.surface")}</div>
                        <input type="color" value={draft.theme.colors.surface} onChange={(e) => setColor("surface", e.target.value)} />
                    </div>
                </div>

                <div className="section">
                    <div className="sectionTitle">{t("constructor.layout")}</div>

                    <label className="lbl">
                        {t("constructor.bannerTitle")}
                        <input className="inp" value={banner.title || ""} onChange={(e) => setBannerTitle(e.target.value)} />
                    </label>

                    <label className="lbl">
                        {t("constructor.bannerSubtitle")}
                        <input className="inp" value={banner.subtitle || ""} onChange={(e) => setBannerSubtitle(e.target.value)} />
                    </label>

                    <label className="lbl">
                        {t("constructor.gridColumns")}
                        <input className="inp" type="number" min={2} max={4} value={cols} onChange={(e) => setGridColumns(e.target.value)} />
                    </label>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button onClick={onSave} disabled={saving}>
                        {saving ? t("common.saving") : t("common.save")}
                    </button>

                    {msg && <span style={{ color: "green" }}>{msg}</span>}
                    {err && (
                        <span style={{ color: "crimson" }}>
              {t("common.errorPrefix")} {err}
            </span>
                    )}
                </div>
            </div>

            <div className="rightPanel">
                <div className="previewTitle">{t("constructor.preview")}</div>
                <StorePreview config={draft} store={{ ...store, name: storeName, description: storeDesc, logoUrl: storeLogo }} />
            </div>
        </div>
    );
}
