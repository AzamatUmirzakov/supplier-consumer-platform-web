"use client";
import { useState, useEffect, useMemo } from "react";
import { useOrdersStore, Order } from "@/lib/orders-store";
import { useTranslations } from "next-intl";

type GroupedOrder = {
  order_id: number;
  items: Order[];
  status: Order["order_status"];
  total_price: number;
  created_at: string;
  updated_at: string;
};

function OrdersPage() {
  const orders = useOrdersStore((state) => state.orders);
  const fetchOrders = useOrdersStore((state) => state.fetchOrders);
  const changeOrderStatus = useOrdersStore((state) => state.changeOrderStatus);

  const t = useTranslations("Orders");

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Group orders by order_id
  const groupedOrders = useMemo(() => {
    const grouped = new Map<number, GroupedOrder>();

    orders.forEach((order) => {
      if (!grouped.has(order.order_id)) {
        grouped.set(order.order_id, {
          order_id: order.order_id,
          items: [],
          status: order.order_status,
          total_price: order.order_total_price,
          created_at: order.order_created_at,
          updated_at: order.order_updated_at,
        });
      }
      grouped.get(order.order_id)!.items.push(order);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [orders]);

  const selectedOrder = groupedOrders.find((o) => o.order_id === selectedOrderId);

  const getStatusColor = (status: Order["order_status"]) => {
    switch (status) {
      case "created":
        return "bg-gray-600";
      case "processing":
        return "bg-yellow-600";
      case "shipping":
        return "bg-blue-600";
      case "completed":
        return "bg-green-600";
      case "rejected":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen">
      {/* Left Sidebar - Orders List */}
      <div className="w-80 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#2a2a2a]">
          <h2 className="text-xl font-bold text-white">{t("title")}</h2>
          <p className="text-sm text-gray-400 mt-1">{groupedOrders.length} {t("total_orders")}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {groupedOrders.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center p-4">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>{t("no_orders_found")}</p>
              </div>
            </div>
          ) : (
            groupedOrders.map((order) => (
              <div
                key={order.order_id}
                onClick={() => setSelectedOrderId(order.order_id)}
                className={`p-4 cursor-pointer transition-colors border-b border-[#2a2a2a] ${selectedOrderId === order.order_id
                  ? "bg-[#2a2a2a]"
                  : "hover:bg-[#222222]"
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">
                    {t("order")} #{order.order_id}
                  </h3>
                  <span className={`${getStatusColor(order.status)} text-white text-xs px-2 py-1 rounded capitalize`}>
                    {t(`status.${order.status}`)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{order.items.length} {t("items")}</span>
                  <span className="font-semibold text-white">{order.total_price.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(order.created_at)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Order Details */}
      <div className="flex-1 bg-[#0a0a0a] flex flex-col">
        {selectedOrder ? (
          <>
            {/* Order Header */}
            <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] p-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-white">
                  {t("order")} #{selectedOrder.order_id}
                </h1>
                {/* change status */}
                <select
                  value={selectedOrder.status}
                  onChange={(e) => changeOrderStatus(selectedOrder.order_id, e.target.value as Order["order_status"])}
                  className={`${getStatusColor(selectedOrder.status)} text-white text-sm px-3 py-1.5 rounded-lg capitalize font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="created">{t("status.created")}</option>
                  <option value="processing">{t("status.processing")}</option>
                  <option value="shipping">{t("status.shipping")}</option>
                  <option value="completed">{t("status.completed")}</option>
                  <option value="rejected">{t("status.rejected")}</option>
                </select>
              </div>
              <div className="flex gap-4 text-sm text-gray-400">
                <span>{selectedOrder.items.length} {t("items")}</span>
                <span>•</span>
                <span>{t("total")}: {selectedOrder.total_price.toFixed(2)}</span>
                <span>•</span>
                <span>{formatDate(selectedOrder.created_at)}</span>
              </div>
            </div>

            {/* Order Items */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.product_id}
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 flex gap-4"
                  >
                    {/* Product Image */}
                    <div className="shrink-0">
                      {item.product_picture_url ? (
                        <img
                          src={item.product_picture_url}
                          alt={item.product_name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-[#0a0a0a] rounded-lg flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {item.product_name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {item.product_description}
                      </p>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="text-gray-400">{t("info.quantity")}:</span>
                          <span className="text-white ml-2 font-semibold">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">{t("info.unit_price")}:</span>
                          <span className="text-white ml-2 font-semibold">
                            {item.price.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">{t("info.id")}:</span>
                          <span className="text-white ml-2">
                            #{item.product_id}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">{t("info.item_total")}:</span>
                          <span className="text-white ml-2 font-semibold">
                            {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t("summary.order_summary")}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-lg mb-2">
                    <span className="text-white font-semibold">{t("total")}:</span>
                    <span className="text-white font-bold">
                      {selectedOrder.total_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-[#2a2a2a] pt-3 mt-3">
                    <div className="text-sm text-gray-400">
                      <div className="flex justify-between mb-1">
                        <span>{t("summary.created")}:</span>
                        <span className="text-gray-300">{formatDate(selectedOrder.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("summary.last_updated")}:</span>
                        <span className="text-gray-300">{formatDate(selectedOrder.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg">{t("select_order_to_view_details")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersPage;