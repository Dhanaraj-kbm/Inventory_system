import { API_URL } from "../config";

// --- Product Endpoints ---

export const getProductByBarcode = async (barcode) => {
  const res = await fetch(`${API_URL}/products/barcode/${barcode}`);
  if (!res.ok) throw new Error("Product not found");
  return res.json();
};

export const scanProduct = async (barcode) => {
  const res = await fetch(`${API_URL}/products/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ barcode })
  });
  if (!res.ok) throw new Error("Scan request failed");
  return res.json();
};

export const updateProduct = async (id, productData) => {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData)
  });
  if (!res.ok) throw new Error("Failed to update product");
  return res.json();
};


// --- Invoice/Billing Endpoints ---

export const getInvoices = async () => {
  const res = await fetch(`${API_URL}/invoices`);
  if (!res.ok) throw new Error("Failed to load invoices");
  return res.json();
};

export const getInvoiceDetails = async (id) => {
  const res = await fetch(`${API_URL}/invoice/${id}`);
  if (!res.ok) throw new Error("Failed to load invoice details");
  return res.json();
};

export const createInvoice = async (invoiceData) => {
  const res = await fetch(`${API_URL}/invoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoiceData)
  });
  const data = await res.json();
  return { ok: res.ok, data };
};


// --- Dashboard Endpoints ---

export const fetchDashboardSummary = async () => {
  const res = await fetch(`${API_URL}/dashboard/summary`);
  if (!res.ok) throw new Error("Failed to load summary stats");
  return res.json();
};

export const fetchDashboardWeeklySales = async () => {
  const res = await fetch(`${API_URL}/dashboard/weekly-sales`);
  if (!res.ok) throw new Error("Failed to load weekly sales");
  return res.json();
};

export const fetchDashboardRecentOrders = async () => {
  const res = await fetch(`${API_URL}/dashboard/recent-orders`);
  if (!res.ok) throw new Error("Failed to load recent orders");
  return res.json();
};

export const fetchDashboardTopProducts = async () => {
  const res = await fetch(`${API_URL}/dashboard/top-selling-products`);
  if (!res.ok) throw new Error("Failed to load top products");
  return res.json();
};

export const fetchDashboardLowStock = async () => {
  const res = await fetch(`${API_URL}/dashboard/low-stock-products`);
  if (!res.ok) throw new Error("Failed to load low stock data");
  return res.json();
};

export const getProducts = async () => {
  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) throw new Error("Failed to load products list");
  return res.json();
};

