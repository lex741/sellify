import { Outlet, useParams, Link } from "react-router-dom";

export default function StorefrontLayout() {
    const { slug } = useParams();

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                <Link to={`/store/${slug}`} style={{ fontWeight: 800, textDecoration: "none" }}>
                    Вітрина
                </Link>
                <Link to={`/store/${slug}/cart`}>Кошик</Link>
            </div>

            <Outlet />
            <div style={{ marginTop: 30, fontSize: 12, opacity: 0.7 }}>
                © 2025 Sellify. Всі права захищено
            </div>
        </div>
    );
}
