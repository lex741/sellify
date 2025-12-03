import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
const ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN ?? "http://localhost:3000";

export default function ProductPage() {
    const { slug, productId } = useParams();
    const [p, setP] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        (async () => {
            setErr(null);
            try {
                const res = await fetch(`${API}/store/${slug}/products/${productId}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
                setP(data.product);
            } catch (e) {
                setErr(e.message);
            }
        })();
    }, [slug, productId]);

    if (err) return <div style={{ color: "crimson" }}>Помилка: {err}</div>;
    if (!p) return <div>Завантаження...</div>;

    return (
        <div>
            <Link to={`/store/${slug}`}>← Назад</Link>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 12 }}>
                <div style={{ background: "#f2f2f2", borderRadius: 16, overflow: "hidden", minHeight: 260 }}>
                    {p.imageUrl ? (
                        <img alt={p.name} src={`${ORIGIN}${p.imageUrl}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : null}
                </div>

                <div>
                    <h1 style={{ marginTop: 0 }}>{p.name}</h1>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>{p.price_uah ?? "—"} грн</div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                        {p.original_price?.amount} {p.original_price?.currency}
                    </div>

                    <p style={{ marginTop: 14 }}>{p.description || ""}</p>

                    <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
                        <Link to={`/store/${slug}/cart`} style={{ padding: "10px 14px", borderRadius: 12, background: "var(--primary, #111)", color: "#fff", textDecoration: "none" }}>
                            До кошика
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
