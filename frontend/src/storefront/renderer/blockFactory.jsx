import BannerBlock from "../blocks/BannerBlock.jsx";
import ProductGridBlock from "../blocks/ProductGridBlock.jsx";
import FooterBlock from "../blocks/FooterBlock.jsx";

export function renderBlock(block, { products }) {
    if (!block?.type) return null;

    switch (block.type) {
        case "banner":
            return <BannerBlock data={block} />;

        case "productGrid":
            return <ProductGridBlock products={products} />;

        case "footer":
            return <FooterBlock data={block} />;

        default:
            return null;
    }
}
