import { create } from "zustand";

export type CatalogItem = {
  category: string;
  description: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  preview: string;
};



type CatalogStore = {
  items: CatalogItem[];
  currentItemId: string | null;
  searchTerm: string;
  setCurrentItemId: (id: string | null) => void;
  setSearchTerm: (term: string) => void;
  addItem: (item: CatalogItem) => void;
  updateItem: (item: CatalogItem) => void;
  deleteItem: (id: string) => void;
};

const initialItems: CatalogItem[] = [
  {
    id: "1",
    name: "Oranges",
    category: "Fruits",
    description: "Fresh oranges",
    price: 999,
    quantity: 10,
    preview: "https://plus.unsplash.com/premium_photo-1675237625695-710b9a6c3f2e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687",
  },
  {
    id: "2",
    name: "Apples",
    category: "Fruits",
    description: "Crisp apples",
    price: 799,
    quantity: 15,
    preview: "https://plus.unsplash.com/premium_photo-1674262321087-bfcd8135fdc5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=627",
  },
  {
    id: "3",
    name: "Bananas",
    category: "Fruits",
    description: "Ripe bananas",
    price: 499,
    quantity: 20,
    preview: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=627",
  },
];

export const useCatalogStore = create<CatalogStore>((set) => ({
  items: initialItems,
  currentItemId: null,
  searchTerm: "",
  setCurrentItemId: (id) => set({ currentItemId: id }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  updateItem: (updated) =>
    set((state) => ({
      items: state.items.map((it) => (it.id === updated.id ? updated : it)),
    })),
  deleteItem: (id) =>
    set((state) => ({ items: state.items.filter((it) => it.id !== id) })),
}));

