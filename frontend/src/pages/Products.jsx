import { useEffect, useMemo, useState } from "react";
import { api, apiForm } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { t } from "../i18n/t.js";

const BACKEND_ORIGIN = "http://localhost:3000"; // для показу фото /uploads/...

export default function Products() {
    const { token } = useAuth();

    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1, q: "" });

    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);

    // форма
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [priceAmount, setPriceAmount] = useState("0.00");
    const [currency, setCurrency] = useState("UAH");
    const [stock, setStock] = useState("0");
    const [imageFile, setImageFile] = useState(null);

    const isEditing = useMemo(() => Boolean(editingId), [editingId]);

    async function load(page = 1, query = q) {
        setLoading(true);
        setErr(null);
        try {
            const data = await api(`/products?page=${page}&limit=${meta.limit}&q=${encodeURIComponent(query)}`, { token });
            setItems(data.items);
            setMeta(data.meta);
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load(1, "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function resetForm() {
        setEditingId(null);
        setName("");
        setDescription("");
        setPriceAmount("0.00");
        setCurrency("UAH");
        setStock("0");
        setImageFile(null);
    }

    function startCreate() {
        resetForm();
        setPriceAmount("100.00");
        setStock("0");
    }

    function startEdit(p) {
        setEditingId(p.id);
        setName(p.name || "");
        setDescription(p.description || "");
        setPriceAmount(String(p.priceAmount ?? "0.00"));
        setCurrency(p.currency || "UAH");
        setStock(String(p.stock ?? 0));
        setImageFile(null);
    }

    async function onSubmit(e) {
        e.preventDefault();
        setErr(null);

        // мін-валидації на фронті
        if (!name.trim()) return setErr("Назва не може бути порожньою");
        if (Number(priceAmount) <= 0) return setErr("Ціна має бути > 0");
        if (Number(stock) < 0) return setErr("Залишок не може бути від’ємним");
        if (imageFile) {
            const okType = imageFile.type === "image/png" || imageFile.type === "image/jpeg";
            if (!okType) return setErr("Файл має бути JPG або PNG");
            if (imageFile.size > 5 * 1024 * 1024) return setErr("Файл має бути ≤ 5MB");
        }

        const fd = new FormData();
        fd.append("name", name.trim());
        fd.append("description", description ? description : "");
        fd.append("priceAmount", String(priceAmount));
        fd.append("currency", currency);
        fd.append("stock", String(stock));
        if (imageFile) fd.append("image", imageFile);

        try {
            if (!isEditing) {
                await apiForm("/products", { method: "POST", token, formData: fd });
            } else {
                await apiForm(`/products/${editingId}`, { method: "PUT", token, formData: fd });
            }
            await load(meta.page, q);
            resetForm();
        } catch (e2) {
            setErr(e2.message);
        }
    }

    async function onDelete(id) {
        setErr(null);
        try {
            await api(`/products/${id}`, { method: "DELETE", token });
            await load(meta.page, q);
            if (editingId === id) resetForm();
        } catch (e2) {
            setErr(e2.message);
        }
    }

    function onSearch() {
        load(1, q);
    }

    return (
        <div>
            <h2>{t("products.title")}</h2>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t("products.searchPlaceholder")}
                    style={{ width: 320 }}
                />
                <button onClick={onSearch} disabled={loading}>{loading ? t("common.loading") : "OK"}</button>
                <button onClick={startCreate}>{t("products.add")}</button>
            </div>

            {err && <div style={{ color: "crimson", marginBottom: 10 }}>{t("common.errorPrefix")} {err}</div>}

            {/* форма */}
            <form onSubmit={onSubmit} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 10, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>
                    {isEditing ? `${t("products.edit")} #${editingId}` : t("products.add")}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <label>
                        {t("products.name")}
                        <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
                    </label>

                    <label>
                        {t("products.price")}
                        <input value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)} style={{ width: "100%" }} />
                    </label>

                    <label>
                        {t("products.currency")}
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: "100%" }}>
                            <option value="UAH">UAH</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </label>

                    <label>
                        {t("products.stock")}
                        <input value={stock} onChange={(e) => setStock(e.target.value)} style={{ width: "100%" }} />
                    </label>

                    <label style={{ gridColumn: "1 / -1" }}>
                        {t("products.description")}
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: "100%" }} />
                    </label>

                    <label style={{ gridColumn: "1 / -1" }}>
                        {t("products.image")}
                        <input type="file" accept="image/png,image/jpeg" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                    </label>
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                    <button type="submit">{t("products.save")}</button>
                    <button type="button" onClick={resetForm}>{t("products.cancel")}</button>
                </div>
            </form>

            {/* таблиця */}
            <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
                <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                    <th>{t("products.image")}</th>
                    <th>{t("products.name")}</th>
                    <th>{t("products.price")}</th>
                    <th>{t("products.currency")}</th>
                    <th>{t("products.stock")}</th>
                    <th>{t("products.actions")}</th>
                </tr>
                </thead>
                <tbody>
                {items.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ width: 90 }}>
                            {p.imageUrl ? (
                                <img
                                    alt="img"
                                    src={`${BACKEND_ORIGIN}${p.imageUrl}`}
                                    style={{ width: 70, height: 50, objectFit: "cover", borderRadius: 8 }}
                                />
                            ) : (
                                <div style={{ width: 70, height: 50, background: "#f1f1f1", borderRadius: 8 }} />
                            )}
                        </td>
                        <td>{p.name}</td>
                        <td>{String(p.priceAmount)}</td>
                        <td>{p.currency}</td>
                        <td>{p.stock}</td>
                        <td style={{ display: "flex", gap: 8 }}>
                            <button type="button" onClick={() => startEdit(p)}>{t("products.edit")}</button>
                            <button type="button" onClick={() => onDelete(p.id)}>{t("products.delete")}</button>
                        </td>
                    </tr>
                ))}
                {items.length === 0 && (
                    <tr>
                        <td colSpan={6}>{t("common.loading")}</td>
                    </tr>
                )}
                </tbody>
            </table>

            {/* пагінація */}
            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
                <button disabled={meta.page <= 1 || loading} onClick={() => load(meta.page - 1, q)}>
                    {t("products.prev")}
                </button>
                <div>
                    {meta.page} / {meta.totalPages} (усього: {meta.total})
                </div>
                <button disabled={meta.page >= meta.totalPages || loading} onClick={() => load(meta.page + 1, q)}>
                    {t("products.next")}
                </button>
            </div>
        </div>
    );
}
