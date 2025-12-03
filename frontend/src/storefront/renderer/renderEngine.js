export function applyThemeCssVars(themeJson) {
    const colors = themeJson?.theme?.colors || {};
    const fonts = themeJson?.theme?.fonts || {};

    const root = document.documentElement;

    if (colors.primary) root.style.setProperty("--primary", colors.primary);
    if (colors.bg) root.style.setProperty("--bg", colors.bg);
    if (colors.text) root.style.setProperty("--text", colors.text);

    if (fonts.body) root.style.setProperty("--font-body", fonts.body);
    if (fonts.heading) root.style.setProperty("--font-heading", fonts.heading);
}

export function getBlocks(themeJson) {
    return Array.isArray(themeJson?.layout) ? themeJson.layout : [];
}
