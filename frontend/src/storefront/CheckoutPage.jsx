import { Link, useParams } from "react-router-dom";

export default function CheckoutPage() {
    const { slug } = useParams();
    return (
        <div>
            <h2>Оформлення замовлення</h2>
            <div style={{ opacity: 0.8 }}>Мінімальна форма. Реальне створення замовлення — на наступних етапах.</div>
            <div style={{ marginTop: 14 }}>
                <Link to={`/store/${slug}/cart`}>← Назад у кошик</Link>
            </div>
        </div>
    );
}
