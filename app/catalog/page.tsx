"use client";
import { useState } from "react";
import CatalogItem from "./components/CatalogItem";
import SearchInput from "./components/SearchInput";
import { useCatalogStore } from "@/lib/catalog-store";
import SideSheet from "./components/SideSheet";

const CatalogPage = () => {
  const [open, setOpen] = useState(false);
  const catalog_items = useCatalogStore((state) => state.items);
  const searchTerm = useCatalogStore((state) => state.searchTerm);
  const setCurrentItemId = useCatalogStore((state) => state.setCurrentItemId);

  const filteredItems = catalog_items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClick = (id: string) => {
    setOpen(true);
    setCurrentItemId(id);
  }

  return (
    <div className="py-5 px-10 flex-1">
      <h1 className="text-4xl font-bold mb-3">Catalog</h1>
      <div className="border-b border-gray-300 pb-4 mb-6">
        <SearchInput />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div className="flex" key={item.id} onClick={() => handleClick(item.id)}>
              <CatalogItem item={item} />
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-400 py-10">
            No items found matching "{searchTerm}"
          </div>
        )}
      </div>

      <SideSheet isOpen={open} onClose={() => setOpen(false)} />
    </div>
  )
}

export default CatalogPage;