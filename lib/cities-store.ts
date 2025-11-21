import { API_BASE } from "./constants";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch } from "./api-fetch";

export type City = {
  city_id: number;
  city_name: string;
  city_name_ru: string;
  city_name_kz: string;
};

export type CitiesStore = {
  cities: City[];
  fetchCities: () => Promise<void>;
};

export const useCitiesStore = create<CitiesStore>()(
  persist(
    (set, get) => ({
      cities: [],
      fetchCities: async () => {
        try {
          // Return early if cities are already loaded
          if (get().cities.length > 0) {
            return;
          }

          const response = await apiFetch(`${API_BASE}/cities/get-all-cities`);
          if (!response.ok) {
            throw new Error(`Error fetching cities: ${response.statusText}`);
          }
          const data: City[] = await response.json();
          set({ cities: data });
        } catch (error) {
          console.error("Failed to fetch cities:", error);
        }
      },
    }),
    {
      name: "cities-store",
      partialize: (state) => ({
        cities: state.cities,
      }),
    }
  )
);