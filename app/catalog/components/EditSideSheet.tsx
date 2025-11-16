"use client";
import { useCatalogStore } from "@/lib/catalog-store";
import { useEffect, useState } from "react";
import { useTranslations } from "use-intl/react";

type EditSideSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  widthClass?: string;
};

export default function EditSideSheet(props: EditSideSheetProps) {
  const t = useTranslations("Catalogs");
  const currentItemId = useCatalogStore((state) => state.currentItemId);
  const items = useCatalogStore((state) => state.items);
  const currentItem = items.find((item: any) => item.product_id === currentItemId);
  const updateItem = useCatalogStore((state) => state.updateItem);
  const deleteItem = useCatalogStore((state) => state.deleteItem);
  const { isOpen, onClose, widthClass } = props;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    retail_price: 0,
    stock_quantity: 0,
    threshold: 0,
    bulk_price: 0,
    minimum_order: 0,
    unit: "",
  });

  // Combined array for both existing URLs (strings) and new files (File objects)
  const [images, setImages] = useState<(string | File)[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [oldImagesToRemove, setOldImagesToRemove] = useState<string[]>([]);

  useEffect(() => {
    if (currentItem) {
      setFormData({
        name: currentItem.name,
        description: currentItem.description,
        retail_price: currentItem.retail_price,
        stock_quantity: currentItem.stock_quantity,
        threshold: currentItem.threshold,
        bulk_price: currentItem.bulk_price,
        minimum_order: currentItem.minimum_order,
        unit: currentItem.unit,
      });
      // Initialize with existing URLs
      const existingUrls = currentItem.picture_url || [];
      setImages(existingUrls);
      setImagePreviews(existingUrls);
    }
  }, [currentItem, currentItemId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Add File objects to the images array
      setImages((prev) => [...prev, ...files]);

      // Generate previews for the new files
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
    if (typeof images[index] === "string") {
      // If it's an existing URL, mark it for removal
      setOldImagesToRemove((prev) => [...prev, images[index] as string]);
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      if (currentItem?.product_id) {
        await updateItem({
          item: {
            product_id: currentItem.product_id,
            name: formData.name,
            description: formData.description,
            retail_price: formData.retail_price,
            stock_quantity: formData.stock_quantity,
            threshold: formData.threshold,
            bulk_price: formData.bulk_price,
            minimum_order: formData.minimum_order,
            unit: formData.unit,
          },
          pictures: images, // Pass the combined array
          picturesToRemove: oldImagesToRemove,
        });
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to update item:', error);
      alert(`Failed to update: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      if (currentItem?.product_id) {
        await deleteItem(currentItem.product_id);
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to delete item:', error);
      alert(`Failed to delete: ${error.message}`);
    }
  };

  if (!currentItem) return null;

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        className={`text-white absolute right-0 top-0 h-dvh w-full ${widthClass ? widthClass : "max-w-[380px]"} bg-[#1a1a1a] shadow-xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("item.edit_item")}</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded px-3 py-1 bg-[#0a0a0a] cursor-pointer border border-black hover:border-white transition-colors"
          >
            {t("item.close_sidebar")}
          </button>
        </div>
        <div className="p-4 overflow-auto h-[calc(100dvh-56px)]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {currentItem.picture_url && currentItem.picture_url.length > 0 && (
                <img src={currentItem.picture_url[0]} alt={formData.name} className="w-16 h-16 object-cover rounded" />
              )}
              <input
                type="text"
                value={formData.name}
                placeholder={t("item.name")}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-lg font-semibold bg-[#0a0a0a] text-white rounded px-2 py-1 flex-1 min-w-0"
              />
            </div>
            <textarea
              value={formData.description}
              placeholder={t("item.description")}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 h-40 bg-[#0a0a0a] rounded text-white border border-black/20 focus:border-white transition-colors"
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-gray-400">{t("item.retail_price")}</label>
                <input
                  type="number"
                  className="bg-[#0a0a0a] px-2 py-1 rounded text-white border border-black/20 focus:border-white transition-colors"
                  value={formData.retail_price}
                  onChange={(e) => setFormData({ ...formData, retail_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-gray-400">{t("item.bulk_price")}</label>
                <input
                  type="number"
                  className="bg-[#0a0a0a] px-2 py-1 rounded text-white border border-black/20 focus:border-white transition-colors"
                  value={formData.bulk_price}
                  onChange={(e) => setFormData({ ...formData, bulk_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-gray-400">{t("item.quantity")}</label>
                <input
                  type="number"
                  className="bg-[#0a0a0a] px-2 py-1 rounded text-white border border-black/20 focus:border-white transition-colors"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-gray-400">{t("item.threshold")}</label>
                <input
                  type="number"
                  className="bg-[#0a0a0a] px-2 py-1 rounded text-white border border-black/20 focus:border-white transition-colors"
                  value={formData.threshold}
                  onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-gray-400">{t("item.minimum_order")}</label>
                <input
                  type="number"
                  className="bg-[#0a0a0a] px-2 py-1 rounded text-white border border-black/20 focus:border-white transition-colors"
                  value={formData.minimum_order}
                  onChange={(e) => setFormData({ ...formData, minimum_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-gray-400">{t("item.unit")}</label>
                <input
                  type="text"
                  className="bg-[#0a0a0a] px-2 py-1 rounded text-white border border-black/20 focus:border-white transition-colors"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-gray-400">{t("item.images")}</label>
              <div className="flex gap-2 flex-wrap">
                {imagePreviews.map((preview, index) => (
                  <div key={`image-${index}`} className="relative w-20 h-20 rounded bg-[#0a0a0a] overflow-hidden border border-black/20">
                    <img src={preview} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
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

            <div className="pt-4 space-y-2">
              <button
                className="w-full cursor-pointer py-2 rounded bg-[#0a0a0a] text-white font-semibold border border-black hover:border-white transition-colors"
                onClick={handleSave}
              >
                {t("item.save")}
              </button>
              <button
                className="w-full cursor-pointer py-2 rounded bg-red-600 text-white font-semibold border border-black hover:border-white transition-colors"
                onClick={handleDelete}
              >
                {t("item.delete")}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
