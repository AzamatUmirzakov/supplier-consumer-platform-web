import { create } from "zustand";
import { API_BASE, CompanyStore } from "./constants";
import useAuthStore from "./useAuthStore";
import { apiFetch } from "./api-fetch";

export const useCompanyStore = create<CompanyStore>()(
  (set) => ({
    users: [],
    loading: false,
    error: null,
    company: {
      name: "",
      description: "",
      logo_url: undefined,
      location: "",
      status: "",
      company_id: 0,
      company_type: "consumer",
    },

    fetchUsers: async () => {
      set({ loading: true, error: null });
      try {
        const response = await apiFetch(`${API_BASE}/user`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          let errorMessage = "Failed to fetch users";
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        set({ users: data.users, loading: false });
      } catch (error: any) {
        set({ error: error.message, loading: false });
      }
    },

    getCompanyDetails: async (id?: number) => {
      const company_id = id ?? useAuthStore.getState().user?.company_id;
      if (!company_id) {
        set({ error: "No company ID found", loading: false });
        return;
      }
      set({ loading: true, error: null });
      try {
        const response = await apiFetch(`${API_BASE}/company/get-company?company_id=${company_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          let errorMessage = "Failed to fetch company details";
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        set({ company: data, loading: false });
      } catch (error: any) {
        set({ error: error.message, loading: false });
      }
    },

    addUser: async (userData) => {
      set({ loading: true, error: null });
      try {
        const response = await apiFetch(`${API_BASE}/user/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...userData,
            locale: "en",
          }),
        });

        if (!response.ok) {
          let errorMessage = "Failed to add user";
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        // Refetch users to update the list
        const state = useCompanyStore.getState();
        await state.fetchUsers();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    updateUser: async (userId, userData) => {
      set({ loading: true, error: null });
      try {
        const response = await apiFetch(`${API_BASE}/user/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          let errorMessage = "Failed to update user";
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        // Refetch users to update the list
        const state = useCompanyStore.getState();
        await state.fetchUsers();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    deleteUser: async (userId) => {
      set({ loading: true, error: null });
      try {
        const response = await apiFetch(`${API_BASE}/user/${userId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          let errorMessage = "Failed to delete user";
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        // Refetch users to update the list
        const state = useCompanyStore.getState();
        await state.fetchUsers();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    updateCompany: async (companyData) => {
      const company_id = useAuthStore.getState().user?.company_id;
      set({ loading: true, error: null });
      try {
        const response = await apiFetch(`${API_BASE}/company/${company_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(companyData),
        });

        if (!response.ok) {
          let errorMessage = "Failed to update company";
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        // Refetch company details to update the state
        const state = useCompanyStore.getState();
        await state.getCompanyDetails();
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },
  }),
);