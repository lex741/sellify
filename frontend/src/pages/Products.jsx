import { t } from "../i18n/t.js";

export default function Products() {
    return (
        <div>
            <h2>{t("pages.productsTitle")}</h2>
            <div>Тут буде таблиця товарів, пошук, фільтри та створення/редагування.</div>
        </div>
    );
}
