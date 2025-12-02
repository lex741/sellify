import { t } from "../i18n/t.js";

export default function Dashboard() {
    return (
        <div>
            <h2>{t("pages.dashboardTitle")}</h2>
            <div>Тут буде статистика, останні замовлення та швидкі дії.</div>
        </div>
    );
}
