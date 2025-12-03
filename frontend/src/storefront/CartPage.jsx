import { Link, useParams } from "react-router-dom";

export default function CartPage() {
    const { slug } = useParams();
    return (
        <div>
            <h2>Кошик</h2>
            <div style={{ opacity: 0.8 }}>Мінімальна версія. На етапі 8–9 додамо реальні позиції, кількість і суму.</div>
            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                <Link to={`/store/${slug}`}>← До каталогу</Link>
                <Link to={`/store/${slug}/checkout`}>Оформити замовлення</Link>
            </div>
        </div>
    );
}
