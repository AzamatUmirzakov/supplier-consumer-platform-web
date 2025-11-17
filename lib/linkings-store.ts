import { create } from "zustand";
import { API_BASE } from "./constants";
import { useAuthStore } from "./useAuthStore";

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

type LinkingsStore = {
  linkings: Linking[];
  loading: boolean;
  error: string | null;
  fetchLinkings: () => Promise<void>;
  updateLinking: (linkingId: number, status: "pending" | "accepted" | "rejected" | "unlinked") => Promise<void>;
};

// Stub data for testing
// const testInitialLinkings: Linking[] = [
//   {
//     linking_id: 1,
//     consumer_company_id: 101,
//     supplier_company_id: 102,
//     requested_by_user_id: 1,
//     status: LinkingStatus.pending,
//     message: "Would like to establish a partnership for office supplies",
//     created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
//     updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
//     consumer_company_name: "Tech Solutions Inc.",
//     supplier_company_name: "Global Supplies Co.",
//     requested_by_user_name: "John Smith"
//   },
//   {
//     linking_id: 2,
//     consumer_company_id: 103,
//     supplier_company_id: 101,
//     requested_by_user_id: 5,
//     status: LinkingStatus.pending,
//     message: "Interested in bulk hardware purchases",
//     created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
//     updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
//     consumer_company_name: "BuildIt Construction",
//     supplier_company_name: "Tech Solutions Inc.",
//     requested_by_user_name: "Sarah Johnson"
//   },
//   {
//     linking_id: 3,
//     consumer_company_id: 101,
//     supplier_company_id: 104,
//     requested_by_user_id: 1,
//     responded_by_user_id: 8,
//     assigned_salesman_user_id: 9,
//     status: LinkingStatus.active,
//     message: "Partnership for electronic components",
//     created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
//     updated_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
//     consumer_company_name: "Tech Solutions Inc.",
//     supplier_company_name: "Electronics Warehouse",
//     requested_by_user_name: "John Smith",
//     responded_by_user_name: "Mike Davis",
//     assigned_salesman_name: "Tom Anderson"
//   },
//   {
//     linking_id: 4,
//     consumer_company_id: 105,
//     supplier_company_id: 101,
//     requested_by_user_id: 12,
//     responded_by_user_id: 1,
//     assigned_salesman_user_id: 2,
//     status: LinkingStatus.active,
//     message: "Long-term partnership for office equipment",
//     created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
//     updated_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
//     consumer_company_name: "Metro Services LLC",
//     supplier_company_name: "Tech Solutions Inc.",
//     requested_by_user_name: "Emily Brown",
//     responded_by_user_name: "John Smith",
//     assigned_salesman_name: "Alex Wilson"
//   },
//   {
//     linking_id: 5,
//     consumer_company_id: 106,
//     supplier_company_id: 101,
//     requested_by_user_id: 15,
//     status: LinkingStatus.pending,
//     created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
//     updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
//     consumer_company_name: "StartUp Innovations",
//     supplier_company_name: "Tech Solutions Inc.",
//     requested_by_user_name: "David Lee"
//   }
// ];

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

      const accessToken = useAuthStore.getState().accessToken;
      const response = await fetch(`${API_BASE}/linkings/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
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
      const accessToken = useAuthStore.getState().accessToken;
      const response = await fetch(`${API_BASE}/linkings/supplier_response/${linkingId}?status=${status}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
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
