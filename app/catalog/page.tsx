"use client";
import { useState, useEffect } from "react";
import CatalogItem from "./components/CatalogItem";
import SearchInput from "./components/SearchInput";
import { useCatalogStore } from "@/lib/catalog-store";
import AddSideSheet from "./components/AddSideSheet";
import EditSideSheet from "./components/EditSideSheet";
import { useTranslations } from "next-intl";

const CatalogPage = () => {
  const t = useTranslations("Catalogs");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const catalog_items = useCatalogStore((state) => state.items) || [];
  const searchTerm = useCatalogStore((state) => state.searchTerm);
  const setCurrentItemId = useCatalogStore((state) => state.setCurrentItemId);
  const fetchItems = useCatalogStore((state) => state.fetchItems);
  const loading = useCatalogStore((state) => state.loading);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = Array.isArray(catalog_items) ? catalog_items.filter((item) => {
    if (!searchTerm) return true; // Show all items when no search term
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = item.name?.toLowerCase().includes(searchLower);
    const descMatch = item.description?.toLowerCase().includes(searchLower);
    return nameMatch || descMatch;
  }) : [];

  const handleClick = (id: string) => {
    setCurrentItemId(id);
    setEditOpen(true);
  }

  const handleAddItem = () => {
    setAddOpen(true);
  }

  return (
    <div className="py-5 px-10 flex-1">
      <h1 className="text-4xl font-bold mb-3">{t("title")}</h1>
      <div className="flex justify-between border-b border-gray-300 pb-4 mb-6">
        <SearchInput placeholder={t("placeholder")} />
        <button className="cursor-pointer bg-[#1a1a1a] hover:bg-[#333333] transition-colors text-white rounded px-4 py-2" onClick={handleAddItem}>{t("item.add_item")}</button>
      </div>
      {loading && (
        <div className="text-gray-400 text-center mt-20">
          {t("loading_products")}
        </div>
      )}
      {!loading && catalog_items.length === 0 && (
        <div className="text-gray-400 text-center mt-20">
          {t("no_items")}
        </div>
      )}
      {catalog_items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div className="flex" key={item.product_id} onClick={() => item.product_id && handleClick(item.product_id)}>
                <CatalogItem item={item} />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400 py-10">
              {t("no_items_found")} "{searchTerm}"
            </div>
          )}
        </div>)
      }

      <AddSideSheet isOpen={addOpen} onClose={() => setAddOpen(false)} />
      <EditSideSheet isOpen={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  )
}

export default CatalogPage;