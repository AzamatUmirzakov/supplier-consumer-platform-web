import { create } from "zustand";
import { API_BASE } from "./constants";
import { apiFetch } from "./api-fetch";

export type ComplaintStatus = "open" | "in_progress" | "escalated" | "resolved" | "closed";

export type Complaint = {
  complaint_id: number;
  order_id: number;
  description: string;
  status: ComplaintStatus;
  created_by_user_id: number;
  assigned_to_user_id?: number;
  assigned_to_salesman_id?: number;
  claimed_by_user_id?: number;
  escalated_to_manager_id?: number | null;
  escalated_to_owner_id?: number | null;
  resolution_notes?: string | null;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  assigned_to_name?: string;
  claimed_by_name?: string;
};

export type ComplaintHistory = {
  history_id: number;
  complaint_id: number;
  changed_by_user_id: number;
  notes: string;
  new_status: string;
  updated_at: string;
};

type ComplaintsStore = {
  complaints: Complaint[];
  escalatedComplaints: Complaint[];
  selectedComplaint: Complaint | null;
  complaintHistory: ComplaintHistory[];
  loading: boolean;
  error: string | null;

  fetchMyComplaints: () => Promise<void>;
  fetchAssignedComplaints: () => Promise<void>;
  fetchManagedComplaints: () => Promise<void>;
  fetchEscalatedComplaints: () => Promise<void>;
  fetchCompanyComplaints: () => Promise<void>;
  fetchComplaintDetails: (complaintId: number) => Promise<void>;
  fetchComplaintHistory: (complaintId: number) => Promise<void>;

  createComplaint: (orderId: number, description: string) => Promise<void>;
  escalateComplaint: (complaintId: number, data: { notes: string }) => Promise<void>;
  claimComplaint: (complaintId: number) => Promise<void>;
  resolveComplaint: (complaintId: number, data: { resolution_notes: string; cancel_order: boolean }) => Promise<void>;
  closeComplaint: (complaintId: number, data: { resolution_notes: string; cancel_order: boolean }) => Promise<void>;

  setSelectedComplaint: (complaint: Complaint | null) => void;
  clearError: () => void;
};

export const useComplaintsStore = create<ComplaintsStore>((set, get) => ({
  complaints: [],
  escalatedComplaints: [],
  selectedComplaint: null,
  complaintHistory: [],
  loading: false,
  error: null,

  fetchMyComplaints: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`${API_BASE}/complaints/my-complaints`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch my complaints");
      }

      const data = await response.json();
      set({ complaints: data.complaints || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAssignedComplaints: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`${API_BASE}/complaints/assigned-to-me`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch assigned complaints");
      }

      const data = await response.json();
      set({ complaints: data.complaints || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchManagedComplaints: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`${API_BASE}/complaints/my-managed-complaints`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch managed complaints");
      }

      const data = await response.json();
      set({ complaints: data.complaints || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchEscalatedComplaints: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`${API_BASE}/complaints/escalated`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch escalated complaints");
      }

      const data = await response.json();
      set({ escalatedComplaints: data.complaints || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchCompanyComplaints: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`${API_BASE}/complaints/company`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch company complaints");
      }

      const data = await response.json();
      set({ complaints: data.complaints || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchComplaintDetails: async (complaintId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`${API_BASE}/complaints/${complaintId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch complaint details");
      }

      const data = await response.json();
      console.log("Complaint details response:", data);
      // API might return data directly or wrapped in { complaint: ... }
      set({ selectedComplaint: data.complaint || data, loading: false });
    } catch (error: any) {
      console.error("Error fetching complaint details:", error);
      set({ error: error.message, loading: false });
    }
  },

  fetchComplaintHistory: async (complaintId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`${API_BASE}/complaints/${complaintId}/history`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch complaint history");
      }

      const data = await response.json();
      set({ complaintHistory: data.history || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createComplaint: async (orderId: number, description: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`${API_BASE}/complaints/order/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error("Failed to create complaint");
      }

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  escalateComplaint: async (complaintId: number, data: { notes: string }) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`${API_BASE}/complaints/${complaintId}/escalate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          data
        ),
      });

      if (!response.ok) {
        throw new Error("Failed to escalate complaint");
      }

      // Refresh the current list
      const currentView = get().complaints;
      if (currentView.length > 0) {
        await get().fetchAssignedComplaints();
      }
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  claimComplaint: async (complaintId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`${API_BASE}/complaints/${complaintId}/claim`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to claim complaint");
      }

      // Refresh both lists
      await get().fetchEscalatedComplaints();
      await get().fetchManagedComplaints();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  resolveComplaint: async (complaintId: number, data: { resolution_notes: string; cancel_order: boolean }) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`${API_BASE}/complaints/${complaintId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          data
        ),
      });

      if (!response.ok) {
        throw new Error("Failed to resolve complaint");
      }

      // Refresh the current list
      await get().fetchManagedComplaints();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  closeComplaint: async (complaintId: number, data: { resolution_notes: string; cancel_order: boolean }) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`${API_BASE}/complaints/${complaintId}/close`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          data
        ),
      });

      if (!response.ok) {
        throw new Error("Failed to close complaint");
      }

      // Refresh the appropriate list based on user role
      const currentView = get().complaints;
      if (currentView.length > 0) {
        // Try to refresh the current view
        await get().fetchManagedComplaints();
      }
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setSelectedComplaint: (complaint: Complaint | null) => {
    set({ selectedComplaint: complaint });
  },

  clearError: () => {
    set({ error: null });
  },
}));
