import {
  IndianRupee,
  ShoppingCart,
  Package,
  TriangleAlert,
} from "lucide-react";

import { useEffect, useState } from "react";

import StatCard from "../components/dashboard/StatCard";
import SalesChart from "../components/dashboard/SalesChart";
import RecentOrders from "../components/dashboard/RecentOrders";
import TopProducts from "../components/dashboard/TopProducts";
import LowStock from "../components/dashboard/LowStock";

import {
  fetchDashboardSummary,
  fetchDashboardWeeklySales,
  fetchDashboardRecentOrders,
  fetchDashboardTopProducts,
  fetchDashboardLowStock,
} from "../api/api";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [weeklySales, setWeeklySales] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          summaryData,
          weeklyData,
          ordersData,
          productsData,
          stockData,
        ] = await Promise.all([
          fetchDashboardSummary(),
          fetchDashboardWeeklySales(),
          fetchDashboardRecentOrders(),
          fetchDashboardTopProducts(),
          fetchDashboardLowStock(),
        ]);

        setSummary(summaryData);
        setWeeklySales(weeklyData);
        setRecentOrders(ordersData);
        setTopProducts(productsData);
        setLowStock(stockData);
      } catch (err) {
        console.error("Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);
  console.log("Summary:", summary);
  console.log("Top Products:", topProducts);
  console.log("Low Stock:", lowStock);
  console.log("Recent Orders:", recentOrders);
  if (loading) {
    return <h2>Loading dashboard...</h2>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>Dashboard</h1>

      {/* Summary Cards */}
      <div
        className="grid gap-6 mb-8"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        }}
      >
        <StatCard
          title="Revenue"
          value={`₹${summary?.total_revenue ?? 0}`}
          subtitle="Lifetime Revenue"
          icon={IndianRupee}
          color="#10B981"
        />

        <StatCard
          title="Orders"
          value={summary?.total_sales ?? 0}
          subtitle="Invoices Generated"
          icon={ShoppingCart}
          color="#3B82F6"
        />

        <StatCard
          title="Products"
          value={summary?.total_products ?? 0}
          subtitle="Inventory Items"
          icon={Package}
          color="#8B5CF6"
        />

        <StatCard
          title="Low Stock"
          value={summary?.low_stock_products ?? 0}
          subtitle="Needs Attention"
          icon={TriangleAlert}
          color="#EF4444"
        />
      </div>

      {/* Weekly Sales + Recent Orders */}
      <div
        className="grid gap-6 mb-8"
        style={{
          gridTemplateColumns: "2fr 1fr",
        }}
      >
        <SalesChart data={weeklySales} />
        <RecentOrders orders={recentOrders} />
      </div>

      {/* Top Products + Low Stock */}
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <TopProducts products={topProducts} />
        <LowStock products={lowStock} />
      </div>
    </div>
  );
}