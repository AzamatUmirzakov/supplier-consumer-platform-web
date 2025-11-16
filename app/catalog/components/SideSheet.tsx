"use client";
import { useCatalogStore } from "@/lib/catalog-store";
import { useEffect, useState } from "react";

type SideSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  widthClass?: string; // e.g., 'max-w-[380px]'
  mode: 'add' | 'edit';
};

export default function SideSheet(props: SideSheetProps) {
  const currentItemId = useCatalogStore((state) => state.currentItemId);
  const items = useCatalogStore((state) => state.items);
  const currentItem = items.find((item: any) => item.product_id === currentItemId);
  const updateItem = useCatalogStore((state) => state.updateItem);
  const addItem = useCatalogStore((state) => state.addItem);
  const { isOpen, onClose, widthClass, mode } = props;

  const [editData, setEditData] = useState({
    name: "",
    description: "",
    retail_price: 0,
    stock_quantity: 0,
    threshold: 0,
    bulk_price: 0,
    minimum_order: 0,
    unit: "",
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles((prev) => [...prev, ...files]);

      // Create preview URLs
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (mode === 'edit' && currentItem) {
      setEditData({
        name: currentItem.name,
        description: currentItem.description,
        retail_price: currentItem.retail_price,
        stock_quantity: currentItem.stock_quantity,
        threshold: currentItem.threshold,
        bulk_price: currentItem.bulk_price,
        minimum_order: currentItem.minimum_order,
        unit: currentItem.unit,
      });
      // Set existing images as previews
      setImagePreviews(currentItem.picture_url || []);
      setImageFiles([]); // Clear file input when editing
    } else if (mode === 'add') {
      // Reset form for adding new item
      setEditData({
        name: "",
        description: "",
        retail_price: 0,
        stock_quantity: 0,
        threshold: 0,
        bulk_price: 0,
        minimum_order: 0,
        unit: "",
      });
      setImagePreviews([]);
      setImageFiles([]);
    }
  }, [currentItem, currentItemId, mode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSave = async () => {
    try {
      if (mode === 'edit' && currentItem && currentItem.product_id) {
        await updateItem({
          item: {
            product_id: currentItem.product_id,
            name: editData.name,
            description: editData.description,
            retail_price: editData.retail_price,
            stock_quantity: editData.stock_quantity,
            threshold: editData.threshold,
            bulk_price: editData.bulk_price,
            minimum_order: editData.minimum_order,
            unit: editData.unit,
          },
          pictures: imageFiles,
        });
      } else if (mode === 'add') {
        await addItem({
          item: {
            name: editData.name,
            description: editData.description,
            retail_price: editData.retail_price,
            stock_quantity: editData.stock_quantity,
            threshold: editData.threshold,
            bulk_price: editData.bulk_price,
            minimum_order: editData.minimum_order,
            unit: editData.unit,
          },
          pictures: imageFiles,
        });
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save item:', error);
      // You might want to show an error message to the user here
      alert(`Failed to save: ${error.message}`);
    }
  }
  const handleDelete = async () => {
    try {
      if (currentItem?.product_id) {
        await useCatalogStore.getState().deleteItem(currentItem.product_id);
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to delete item:', error);
      alert(`Failed to delete: ${error.message}`);
    }
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
          <h2 className="text-xl font-semibold">{mode === 'add' ? 'Add Item' : 'Edit Item'}</h2>
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
              <input
                type="text"
                value={editData.name}
                placeholder="Name"
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="text-lg font-semibold bg-[#0a0a0a] text-white rounded px-2 py-1 flex-1 min-w-0"
              />
            </div>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full p-2 h-40 bg-[#0a0a0a] rounded text-white border border-black/20 focus:border-white transition-colors"
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-gray-400">Retail Price</label>
                <input
                  type="number"
                  className="bg-[#0a0a0a] px-2 py-1 rounded text-white border border-black/20 focus:border-white transition-colors"
                  value={editData.retail_price}
                  onChange={(e) => setEditData({ ...editData, retail_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-gray-400">Bulk Price</label>
                <input
                  type="number"
                  className="bg-[#0a0a0a] px-2 py-1 rounded text-white border border-black/20 focus:border-white transition-colors"
                  value={editData.bulk_price}
                  onChange={(e) => setEditData({ ...editData, bulk_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-gray-400">Stock Quantity</label>
                <input
                  type="number"
                  className="bg-[#0a0a0a] px-2 py-1 rounded text-white border border-black/20 focus:border-white transition-colors"
                  value={editData.stock_quantity}
                  onChange={(e) => setEditData({ ...editData, stock_quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-gray-400">Threshold</label>
                <input
                  type="number"
                  className="bg-[#0a0a0a] px-2 py-1 rounded text-white border border-black/20 focus:border-white transition-colors"
                  value={editData.threshold}
                  onChange={(e) => setEditData({ ...editData, threshold: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-gray-400">Minimum Order</label>
                <input
                  type="number"
                  className="bg-[#0a0a0a] px-2 py-1 rounded text-white border border-black/20 focus:border-white transition-colors"
                  value={editData.minimum_order}
                  onChange={(e) => setEditData({ ...editData, minimum_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-gray-400">Unit</label>
                <input
                  type="text"
                  className="bg-[#0a0a0a] px-2 py-1 rounded text-white border border-black/20 focus:border-white transition-colors"
                  value={editData.unit}
                  onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-gray-400">Images</label>
              <div className="flex gap-2 flex-wrap">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative w-20 h-20 rounded bg-[#0a0a0a] overflow-hidden border border-black/20">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="cursor-pointer absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs rounded-bl hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded bg-[#0a0a0a] border border-black/20 hover:border-white transition-colors cursor-pointer flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button
                className="w-full cursor-pointer py-2 rounded bg-[#0a0a0a] text-white font-semibold border border-black hover:border-white transition-colors"
                onClick={handleSave}
              >
                Save
              </button>
              {
                mode === 'edit' && (
                  <button
                    className="w-full cursor-pointer py-2 rounded bg-[red] mt-2 text-white font-semibold border border-black hover:border-white transition-colors"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                )
              }
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}