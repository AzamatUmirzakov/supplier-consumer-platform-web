import { API_BASE } from "./constants";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import useAuthStore from "./useAuthStore";

export type Order = {
  order_id: number;
  product_id: number,
  product_name: string,
  product_description: string,
  product_picture_url?: string,
  quantity: number,
  price: number,
  unit: string,
  order_status: "created" | "processing" | "shipping" | "completed";
  order_total_price: number;
  order_created_at: string;
  order_updated_at: string;
};

export const useOrdersStore = create<{
  orders: Order[];
  fetchOrders: () => Promise<void>;
  changeOrderStatus: (orderId: number, status: Order["order_status"]) => Promise<void>;
}>()(
  persist(
    (set, get) => ({
      orders: [],
      fetchOrders: async () => {
        const accessToken = useAuthStore.getState().accessToken;
        try {
          const response = await fetch(`${API_BASE}/orders`, {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
            },
          });
          if (!response.ok) {
            throw new Error(`Error fetching orders: ${response.statusText}`);
          }
          const data: Order[] = await response.json();
          set({ orders: data });
        } catch (error) {
          console.error("Failed to fetch orders:", error);
        }
      },
      changeOrderStatus: async (orderId: number, status: Order["order_status"]) => {
        const accessToken = useAuthStore.getState().accessToken;
        try {
          const response = await fetch(`${API_BASE}/orders/${orderId}/status?status=${status}`, {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) {
            throw new Error(`Error updating order status: ${response.statusText}`);
          }

          // Update the order status in the local store
          const updatedOrders = get().orders.map(order =>
            order.order_id === orderId ? { ...order, order_status: status } : order
          );
          set({ orders: updatedOrders });
        } catch (error) {
          console.error("Failed to update order status:", error);
        }
      },
    }),
    {
      name: "orders-store",
      partialize: (state) => ({
        orders: state.orders,
      }),
    }
  )
);