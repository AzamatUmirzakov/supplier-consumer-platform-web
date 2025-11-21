import { create } from "zustand";
import { API_BASE } from "./constants";
import { useAuthStore } from "./useAuthStore";
import { apiFetch } from "./api-fetch";

export type CatalogItem = {
  product_id?: string,
  name: string,
  description: string,
  picture_url: string[],
  stock_quantity: number,
  retail_price: number,
  threshold: number,
  bulk_price: number,
  minimum_order: number,
  unit: string,
};

type CatalogStore = {
  items: CatalogItem[];
  currentItemId: string | null;
  searchTerm: string;
  loading: boolean;
  error: string | null;
  setCurrentItemId: (id: string | null) => void;
  setSearchTerm: (term: string) => void;
  fetchItems: () => Promise<void>;
  addItem: (item: {
    item: Omit<CatalogItem, 'picture_url'>
    pictures: File[],
  }) => Promise<void>;
  updateItem: (item: {
    item: Omit<CatalogItem, 'picture_url'>,
    pictures: (string | File)[],
    picturesToRemove: string[],
  }) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
};

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  items: [],
  currentItemId: null,
  searchTerm: "",
  loading: false,
  error: null,

  setCurrentItemId: (id) => set({ currentItemId: id }),
  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const company_id = useAuthStore.getState().user?.company_id;
      const response = await apiFetch(`${API_BASE}/products/?company_id=${company_id}`, {
        method: "GET",
        headers: {},
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      const products = Array.isArray(data.products) ? data.products : [];

      set({ items: products, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addItem: async (data) => {
    set({ loading: true, error: null });
    try {
      // upload pictures
      const picture_urls: string[] = [];
      try {
        for (const file of data.pictures) {
          // Step 1: Get the S3 URLs
          const fileExtension = file.name.split(".").pop() || "jpg";
          const uploadUrlResponse = await apiFetch(
            `${API_BASE}/uploads/upload-url?ext=${fileExtension}`,
            {
              method: "GET",
              headers: {},
            }
          );

          if (!uploadUrlResponse.ok) {
            let errorMessage = "Failed to get upload URL";
            try {
              const errorData = await uploadUrlResponse.json();
              errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch (e) {
              errorMessage = `Server error: ${uploadUrlResponse.status} ${uploadUrlResponse.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const uploadUrlData = await uploadUrlResponse.json();
          console.log("Upload URL response:", uploadUrlData);

          // const s3PresignedUrl = uploadUrlData.finalurl;
          const s3PresignedUrl = uploadUrlData.put_url.url;
          if (!s3PresignedUrl) {
            throw new Error("No presigned URL received from server");
          }

          // Step 2: Upload the file to S3
          const { url, fields } = uploadUrlData.put_url;
          const formData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, value as string);
          });
          formData.append("file", file);
          console.log("Uploading file to S3 with fields:", fields);

          const uploadResponse = await fetch(s3PresignedUrl, {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload to S3: ${uploadResponse.status} ${uploadResponse.statusText}`);
          }

          console.log("File uploaded successfully to S3");

          picture_urls.push(uploadUrlData.finalurl);
        }

      } catch (error: any) {
        const errorMessage = error instanceof TypeError
          ? "Failed to connect to server for file upload"
          : error.message;
        set({ error: errorMessage });
        throw error;
      }

      // create product

      const response = await apiFetch(`${API_BASE}/products/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data.item,
          picture_url: picture_urls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to add product: ${response.status}`);
      }

      // Refetch all items to sync with server
      await get().fetchItems();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateItem: async (updated) => {
    set({ loading: true, error: null });
    try {
      console.log(updated);

      // Process images: upload Files to S3, keep existing URLs as-is
      const picture_urls: string[] = [];

      for (const item of updated.pictures) {
        if (typeof item === 'string') {
          // It's an existing URL, add it directly
          picture_urls.push(item);
        } else {
          // It's a File, upload to S3
          const file = item as File;
          const fileExtension = file.name.split(".").pop() || "jpg";

          // Get presigned URL
          const uploadUrlResponse = await apiFetch(
            `${API_BASE}/uploads/upload-url?ext=${fileExtension}`,
            {
              method: "GET",
              headers: {},
            }
          );

          if (!uploadUrlResponse.ok) {
            let errorMessage = "Failed to get upload URL";
            try {
              const errorData = await uploadUrlResponse.json();
              errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch (e) {
              errorMessage = `Server error: ${uploadUrlResponse.status} ${uploadUrlResponse.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const uploadUrlData = await uploadUrlResponse.json();
          const s3PresignedUrl = uploadUrlData.put_url.url;

          if (!s3PresignedUrl) {
            throw new Error("No presigned URL received from server");
          }

          // Upload to S3
          const { url, fields } = uploadUrlData.put_url;
          const formData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, value as string);
          });
          formData.append("file", file);

          const uploadResponse = await fetch(s3PresignedUrl, {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload to S3: ${uploadResponse.status} ${uploadResponse.statusText}`);
          }

          // Add the final URL
          picture_urls.push(uploadUrlData.finalurl);
        }
      }

      // delete removed pictures from server
      for (const url of updated.picturesToRemove) {
        try {
          const deleteResponse = await apiFetch(
            `${API_BASE}/uploads/delete-file?file_url=${encodeURIComponent(url)}`,
            {
              method: "DELETE",
              headers: {},
            }
          );

          if (!deleteResponse.ok) {
            let errorMessage = "Failed to delete file";
            try {
              const errorData = await deleteResponse.json();
              errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch (e) {
              errorMessage = `Server error: ${deleteResponse.status} ${deleteResponse.statusText}`;
            }
            console.error(errorMessage);
          } else {
            console.log(`Successfully deleted file: ${url}`);
          }
        } catch (error) {
          console.error("Error deleting file:", error);
        }
      }

      // Update product with processed URLs
      const response = await apiFetch(`${API_BASE}/products/${updated.item.product_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...updated.item,
          picture_url: picture_urls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to update product: ${response.status}`);
      }

      // Refetch all items to sync with server
      await get().fetchItems();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteItem: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
        headers: {},
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to delete product: ${response.status}`);
      }

      // Refetch all items to sync with server
      await get().fetchItems();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

}));

