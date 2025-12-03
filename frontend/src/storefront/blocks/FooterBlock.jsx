export default function FooterBlock({ data }) {
    const text = data?.text ?? "Дякуємо за покупку!";
    return (
        <div style={{ marginTop: 24, opacity: 0.8, fontSize: 14 }}>
            {text}
        </div>
    );
}
