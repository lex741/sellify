export default function BannerBlock({ data }) {
    const title = data?.title ?? "Ласкаво просимо!";
    const subtitle = data?.subtitle ?? "Оберіть товари з каталогу";
    const ctaText = data?.ctaText ?? null;

    return (
        <div style={{
            borderRadius: 16,
            padding: 18,
            background: "var(--bg, #f6f6f6)",
            color: "var(--text, #111)"
        }}>
            <h1 style={{ margin: 0, fontFamily: "var(--font-heading, system-ui)" }}>{title}</h1>
            <p style={{ marginTop: 8 }}>{subtitle}</p>
            {ctaText && (
                <button style={{
                    marginTop: 10,
                    border: "none",
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: "var(--primary, #111)",
                    color: "white",
                    cursor: "pointer"
                }}>
                    {ctaText}
                </button>
            )}
        </div>
    );
}
