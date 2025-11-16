import { CatalogItem as CatalogItemType } from "@/lib/catalog-store";
import { useTranslations } from "next-intl";

type CatalogItemProps = {
  item: CatalogItemType;
};

const CatalogItem = ({ item }: CatalogItemProps) => {
  const t = useTranslations("Catalogs");
  return (
    <div className="rounded-lg bg-[#1a1a1a] border border-[#333333] mb-4 flex flex-col w-fit cursor-pointer flex-1">
      {item.picture_url && item.picture_url.length > 0 ? (
        <img src={item.picture_url[0]} alt={item.name} className="w-full h-48 object-cover rounded-t-lg" />
      ) : (
        <div className="w-full h-48 bg-[#0a0a0a] rounded-t-lg flex items-center justify-center text-gray-500">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <div className="flex-1 p-4">
        <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
        <p className="text-gray-300 mb-3 text-sm line-clamp-2">{item.description}</p>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">{t("item.retail_price")}:</span>
            <span className="font-semibold">{item.retail_price} ₸</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">{t("item.bulk_price")}:</span>
            <span className="font-semibold">{item.bulk_price} ₸</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">{t("item.quantity")}:</span>
            <span className={item.stock_quantity <= item.threshold ? "text-red-400" : "text-green-400"}>
              {item.stock_quantity} {item.unit}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">{t("item.minimum_order")}:</span>
            <span>{item.minimum_order} {item.unit}</span>
          </div>
        </div>
      </div>
    </div>
  )
};

export default CatalogItem;