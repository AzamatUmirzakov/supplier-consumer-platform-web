"use client";
import { useState, useEffect } from "react";
import CatalogItem from "./components/CatalogItem";
import SearchInput from "./components/SearchInput";
import { useCatalogStore } from "@/lib/catalog-store";
import SideSheet from "./components/SideSheet";

const CatalogPage = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'add' | 'edit'>('edit');
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
    setMode('edit');
    setOpen(true);
    setCurrentItemId(id);
  }

  const handleAddItem = () => {
    setMode('add');
    setCurrentItemId(null);
    setOpen(true);
  }

  return (
    <div className="py-5 px-10 flex-1">
      <h1 className="text-4xl font-bold mb-3">Catalog</h1>
      <div className="flex justify-between border-b border-gray-300 pb-4 mb-6">
        <SearchInput />
        <button className="cursor-pointer bg-[#1a1a1a] hover:bg-[#333333] transition-colors text-white rounded px-4 py-2" onClick={handleAddItem}>Add Item</button>
      </div>
      {loading && (
        <div className="text-gray-400 text-center mt-20">
          Loading products...
        </div>
      )}
      {!loading && catalog_items.length === 0 && (
        <div className="text-gray-400 text-center mt-20">
          No items in the catalog. Please add items to see them here.
        </div>
      )}
      {catalog_items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div className="flex" key={item.product_id} onClick={() => handleClick(item.product_id)}>
                <CatalogItem item={item} />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400 py-10">
              No items found matching "{searchTerm}"
            </div>
          )}
        </div>)
      }

      <SideSheet isOpen={open} onClose={() => setOpen(false)} mode={mode} />
    </div>
  )
}

export default CatalogPage;