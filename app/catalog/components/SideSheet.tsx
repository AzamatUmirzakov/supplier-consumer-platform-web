"use client";
import { useCatalogStore } from "@/lib/catalog-store";
import { useEffect, useState } from "react";

type SideSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  widthClass?: string; // e.g., 'max-w-[380px]'
};

export default function SideSheet(props: SideSheetProps) {
  const currentItemId = useCatalogStore((state) => state.currentItemId);
  const currentItem = useCatalogStore((state) => state.items.find(item => item.id === currentItemId));
  const updateItem = useCatalogStore((state) => state.updateItem);
  const { isOpen, onClose, onSave, widthClass } = props;

  const [editData, setEditData] = useState({
    name: "",
    description: "",
    price: 0,
  });

  useEffect(() => {
    if (currentItem) {
      setEditData({
        name: currentItem.name,
        description: currentItem.description,
        price: currentItem.price,
      });
    }
  }, [currentItem]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSave = () => {
    if (currentItem) {
      updateItem({
        ...currentItem,
        name: editData.name,
        description: editData.description,
        price: editData.price,
      });
    }
    onClose();
    onSave?.();
  }

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className={`text-white absolute right-0 top-0 h-dvh w-full ${widthClass ? widthClass : "max-w-[380px]"} bg-[#1a1a1a] text-black shadow-xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit item</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded px-3 py-1 bg-[#0a0a0a] cursor-pointer border border-black hover:border-white transition-colors"
          >
            Close
          </button>
        </div>
        <div className="p-4 overflow-auto h-[calc(100dvh-56px)]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={currentItem?.preview} alt={editData.name} className="w-10 h-10 object-cover rounded" />
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="text-lg font-semibold bg-[#0a0a0a] text-white rounded px-2 py-1 flex-1 min-w-0"
              />
            </div>
            <div>
              <span className="inline-block text-sm px-3 py-1 rounded-full bg-[#2a2a2a] text-white">{currentItem?.category}</span>
            </div>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full p-2 h-40 bg-[#0a0a0a] rounded text-white border border-black/20 focus:border-white transition-colors"
            />
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">Price:</span>
              <input
                type="number"
                className="w-20 bg-[#0a0a0a] px-2 py-1 rounded text-white border border-black/20 focus:border-white transition-colors"
                value={editData.price}
                onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="pt-8">
              <button
                className="w-full cursor-pointer py-2 rounded bg-[#0a0a0a] text-white font-semibold border border-black hover:border-white transition-colors"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}