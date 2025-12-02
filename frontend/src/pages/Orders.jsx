import { t } from "../i18n/t.js";

export default function Orders() {
    return (
        <div>
            <h2>{t("pages.ordersTitle")}</h2>
            <div>Тут буде таблиця замовлень, статуси, фільтр по статусу та перегляд замовлення.</div>
        </div>
    );
}
