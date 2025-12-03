import { Link, useParams } from "react-router-dom";

export default function ProductGridBlock({ products }) {
    const { slug } = useParams();

    return (
        <div style={{ marginTop: 16 }}>
            <h2 style={{ margin: "12px 0" }}>Каталог</h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 12
            }}>
                {products.map((p) => (
                    <Link
                        key={p.id}
                        to={`/store/${slug}/product/${p.id}`}
                        style={{
                            textDecoration: "none",
                            color: "inherit",
                            border: "1px solid #eee",
                            borderRadius: 14,
                            padding: 12
                        }}
                    >
                        <div style={{ height: 130, background: "#f2f2f2", borderRadius: 12, overflow: "hidden" }}>
                            {p.imageUrl ? (
                                <img
                                    alt={p.name}
                                    src={`http://localhost:3000${p.imageUrl}`}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : null}
                        </div>
                        <div style={{ marginTop: 10, fontWeight: 700 }}>{p.name}</div>
                        <div style={{ marginTop: 6 }}>
                            <span style={{ fontWeight: 800 }}>{p.price_uah ?? "—"} грн</span>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                            {p.original_price?.amount} {p.original_price?.currency}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
