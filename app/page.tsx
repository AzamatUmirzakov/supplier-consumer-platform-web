"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCatalogStore } from "@/lib/catalog-store";
import { useOrdersStore } from "@/lib/orders-store";
import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  const t = useTranslations("Dashboard");
  const { items, fetchItems } = useCatalogStore();
  const { orders, fetchOrders } = useOrdersStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchItems(), fetchOrders()]);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Group orders by order_id (since one order can have multiple products)
  const groupedOrders = orders.reduce((acc, order) => {
    if (!acc[order.order_id]) {
      acc[order.order_id] = {
        order_id: order.order_id,
        linking_id: order.linking_id,
        order_status: order.order_status,
        order_total_price: order.order_total_price,
        order_created_at: order.order_created_at,
        order_updated_at: order.order_updated_at,
        products: [],
      };
    }
    acc[order.order_id].products.push({
      product_id: order.product_id,
      product_name: order.product_name,
      product_description: order.product_description,
      product_picture_url: order.product_picture_url,
      quantity: order.quantity,
      price: order.price,
      unit: order.unit,
    });
    return acc;
  }, {} as Record<number, any>);

  const uniqueOrders = Object.values(groupedOrders);

  // Calculate metrics
  const totalRevenue = uniqueOrders
    .filter(order => order.order_status === "completed")
    .reduce((sum, order) => sum + order.order_total_price, 0);

  const today = new Date().toDateString();
  const ordersToday = uniqueOrders.filter(
    order => new Date(order.order_created_at).toDateString() === today
  ).length;

  const createdOrders = uniqueOrders.filter(
    order => order.order_status === "created"
  ).length;

  // Low stock items
  const lowStockItems = items.filter(
    item => item.stock_quantity <= item.threshold
  );

  // Order status distribution (use unique orders)
  const orderStatusCounts = uniqueOrders.reduce((acc, order) => {
    acc[order.order_status] = (acc[order.order_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const orderStatusData = {
    labels: Object.keys(orderStatusCounts).map(status => t(`status.${status}`)),
    datasets: [
      {
        data: Object.values(orderStatusCounts),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)", // blue - created
          "rgba(251, 191, 36, 0.8)", // yellow - processing
          "rgba(139, 92, 246, 0.8)", // purple - shipping
          "rgba(34, 197, 94, 0.8)",  // green - completed
          "rgba(239, 68, 68, 0.8)",  // red - rejected
        ],
        borderWidth: 0,
      },
    ],
  };

  // Revenue trend (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toDateString();
  });

  const revenueByDay = last7Days.map(day => {
    return uniqueOrders
      .filter(
        order =>
          new Date(order.order_created_at).toDateString() === day &&
          order.order_status === "completed"
      )
      .reduce((sum, order) => sum + order.order_total_price, 0);
  });

  const revenueTrendData = {
    labels: last7Days.map(day => new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" })),
    datasets: [
      {
        data: revenueByDay,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Recent orders (last 3)
  const recentOrders = [...uniqueOrders]
    .sort((a, b) => new Date(b.order_created_at).getTime() - new Date(a.order_created_at).getTime())
    .slice(0, 3);

  const formatCurrency = (amount: number) => {
    return `₸${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      created: "text-blue-500",
      processing: "text-yellow-500",
      shipping: "text-purple-500",
      completed: "text-green-500",
      rejected: "text-red-500",
    };
    return colors[status as keyof typeof colors] || "text-gray-500";
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0a0a] p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
          <button
            onClick={() => {
              fetchItems();
              fetchOrders();
            }}
            className="cursor-pointer text-white hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Revenue */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
            <p className="text-gray-400 text-sm mb-1">{t("total_revenue")}</p>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(totalRevenue)}</p>
          </div>

          {/* Orders Today */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
            <p className="text-gray-400 text-sm mb-1">{t("orders_today")}</p>
            <p className="text-2xl font-bold text-blue-500">{ordersToday}</p>
          </div>

          {/* Created Orders */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
            <p className="text-gray-400 text-sm mb-1">{t("created_orders")}</p>
            <p className="text-2xl font-bold text-orange-500">{createdOrders}</p>
          </div>

          {/* Low Stock */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
            <p className="text-gray-400 text-sm mb-1">{t("low_stock")}</p>
            <p className="text-2xl font-bold text-red-500">{lowStockItems.length}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Trend */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
            <h2 className="text-lg font-semibold text-white mb-4">{t("revenue_trend")}</h2>
            <div className="h-64">
              <Line
                data={revenueTrendData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      ticks: { color: "#9ca3af" },
                      grid: { color: "#2a2a2a" },
                    },
                    x: {
                      ticks: { color: "#9ca3af" },
                      grid: { display: false },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
            <h2 className="text-lg font-semibold text-white mb-4">{t("order_status")}</h2>
            <div className="h-64 flex items-center justify-center">
              {uniqueOrders.length > 0 ? (
                <Doughnut
                  data={orderStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "right",
                        labels: { color: "#9ca3af" },
                      },
                    },
                  }}
                />
              ) : (
                <p className="text-gray-400">No orders yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
            <h2 className="text-lg font-semibold text-white mb-4">{t("recent_orders")}</h2>
            <div className="space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.map(order => (
                  <div
                    key={order.order_id}
                    className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {t("order_number", { id: order.order_id })}
                      </p>
                      <p className="text-gray-400 text-sm">{formatDate(order.order_created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(order.order_total_price)}</p>
                      <p className={`text-sm capitalize ${getStatusColor(order.order_status)}`}>
                        {t(`status.${order.order_status}`)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No recent orders</p>
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
            <h2 className="text-lg font-semibold text-white mb-4">{t("low_stock_alert")}</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {lowStockItems.length > 0 ? (
                lowStockItems.map(item => (
                  <div
                    key={item.product_id}
                    className="flex items-start gap-3 p-3 bg-[#0a0a0a] rounded-lg"
                  >
                    {item.picture_url && item.picture_url[0] && (
                      <img
                        src={item.picture_url[0]}
                        alt={item.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-red-500 text-sm">
                        {t("stock", { current: item.stock_quantity, threshold: item.threshold })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No low stock items</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
