import { create } from "zustand";
import { API_BASE } from "./constants";
import { useAuthStore } from "./useAuthStore";
import { apiFetch } from "./api-fetch";

export enum LinkingStatus {
  pending = "pending",
  accepted = "accepted",
  rejected = "rejected",
  unlinked = "unlinked",
}

export type Linking = {
  linking_id: number;
  consumer_company_id: number;
  supplier_company_id: number;
  requested_by_user_id: number;
  responded_by_user_id?: number;
  assigned_salesman_user_id?: number;
  status: LinkingStatus;
  message?: string;
  created_at: string;
  updated_at: string;
  // Additional fields for display (from joins)
  consumer_company_name?: string;
  supplier_company_name?: string;
  requested_by_user_name?: string;
  responded_by_user_name?: string;
  assigned_salesman_name?: string;
};

export type CompanyDetails = {
  company_id: number;
  name: string;
  description: string;
  logo_url?: string;
  location: string;
  company_type: "supplier" | "consumer";
  status: string;
};

// Standalone function to fetch company details
export const fetchCompanyDetails = async (companyId: number): Promise<CompanyDetails | null> => {
  try {
    const response = await apiFetch(`${API_BASE}/company/get-company?company_id=${companyId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.ok) {
      const data: CompanyDetails = await response.json();
      return data;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch company details:", error);
    return null;
  }
};

type LinkingsStore = {
  linkings: Linking[];
  loading: boolean;
  error: string | null;
  fetchLinkings: () => Promise<void>;
  updateLinking: (linkingId: number, status: "pending" | "accepted" | "rejected" | "unlinked") => Promise<void>;
};

export const useLinkingsStore = create<LinkingsStore>((set, get) => ({
  linkings: [],
  loading: false,
  error: null,

  fetchLinkings: async () => {
    set({ loading: true, error: null });
    try {
      // For testing, use stub data
      // Comment this out and uncomment the API call when backend is ready
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      set({ linkings: [], loading: false });

      const response = await apiFetch(`${API_BASE}/linkings/`, {
        method: "GET",
        headers: {},
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch linkings: ${response.status}`);
      }

      const data = await response.json();
      const linkings = Array.isArray(data.linkings) ? data.linkings : [];

      set({ linkings, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateLinking: async (linkingId, status) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`${API_BASE}/linkings/supplier_response/${linkingId}?status=${status}`, {
        method: "PATCH",
        headers: {},
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to accept linking: ${response.status}`);
      }

      // Refetch linkings
      await get().fetchLinkings();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));

export default useLinkingsStore;
