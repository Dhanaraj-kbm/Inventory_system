import { Html5QrcodeScanner } from "html5-qrcode";
import { useState, useRef, useEffect } from "react";

const API = "http://10.57.75.58:8000";

function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div>
      {page === "pos" && (
        <POSPage
          goDashboard={() => setPage("dashboard")}
          goHistory={() => setPage("history")}
        />
      )}
      {page === "history" && <HistoryPage goBack={() => setPage("pos")} />}
      {page === "dashboard" && (
        <DashboardPage
          goHistory={() => setPage("history")}
          goPOS={() => setPage("pos")}
        />
      )}
    </div>
  );
}

//////////////////////////////////////////////////////////////////
// POS PAGE
//////////////////////////////////////////////////////////////////

function POSPage({ goDashboard, goHistory }) {

  const [barcode, setBarcode] = useState("");
  const [customer, setCustomer] = useState("");
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [editingProduct, setEditingProduct] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const barcodeRef = useRef(null);

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  /////////////////////////////////////////////////////////////////
  // Update total
  /////////////////////////////////////////////////////////////////

  const updateTotal = (cartData) => {
    const newTotal = cartData.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    setTotal(newTotal);
  };

  /////////////////////////////////////////////////////////////////
  // Add to cart
  /////////////////////////////////////////////////////////////////

  const addToCart = async (codeOverride = null) => {

    const code = codeOverride || barcode;
    if (!code) return;

    try {

      let res = await fetch(`${API}/products/barcode/${code}`);
      let product;

      if (res.ok) {

        product = await res.json();

        // 🔥 HARD VALIDATION
        if (!product.price || product.price <= 0) {
          setEditingProduct(product);
          setBarcode("");
          return;
        }

      } else {

        res = await fetch(`${API}/products/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode: code })
        });

        product = await res.json();

        setEditingProduct(product);
        setBarcode("");
        return;
      }

      const existing = cart.find(item => item.barcode === code);

      let updatedCart;

      if (existing) {

        updatedCart = cart.map(item =>
          item.barcode === code
            ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * item.price
            }
            : item
        );

      } else {

        updatedCart = [
          ...cart,
          {
            barcode: product.barcode,
            name: product.name,
            price: product.price,
            quantity: 1,
            subtotal: product.price
          }
        ];
      }

      setCart(updatedCart);
      updateTotal(updatedCart);
      setBarcode("");

    } catch (err) {
      console.error(err);
      alert("Backend error");
    }
  };

  /////////////////////////////////////////////////////////////////
  // Save product after editing
  /////////////////////////////////////////////////////////////////

  const saveProduct = async () => {

    const res = await fetch(`${API}/products/${editingProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingProduct)
    });

    const updated = await res.json();

    setEditingProduct(null);

    const updatedCart = [
      ...cart,
      {
        barcode: updated.barcode,
        name: updated.name,
        price: updated.price,
        quantity: 1,
        subtotal: updated.price
      }
    ];

    setCart(updatedCart);
    updateTotal(updatedCart);
  };

  /////////////////////////////////////////////////////////////////
  // Scanner
  /////////////////////////////////////////////////////////////////

  const startScanner = () => {

    setScannerOpen(true);

    setTimeout(() => {

      const scanner = new Html5QrcodeScanner(
        "scanner",
        {
          fps: 10,
          qrbox: 250,
          videoConstraints: {
            facingMode: { exact: "environment" }
          }
        },
        false
      );

      scanner.render(
        (decodedText) => {

          const cleanCode = decodedText.trim();

          scanner.clear();
          setScannerOpen(false);

          addToCart(cleanCode);

        },
        () => { }
      );

    }, 300);
  };

  /////////////////////////////////////////////////////////////////
  // Remove item
  /////////////////////////////////////////////////////////////////

  const removeItem = (code) => {
    const updatedCart = cart.filter(item => item.barcode !== code);
    setCart(updatedCart);
    updateTotal(updatedCart);
  };
  const increaseQty = (code) => {

    const updatedCart = cart.map(item =>
      item.barcode === code
        ? {
          ...item,
          quantity: item.quantity + 1,
          subtotal: (item.quantity + 1) * item.price
        }
        : item
    );

    setCart(updatedCart);
    updateTotal(updatedCart);
  };

  const decreaseQty = (code) => {

    const updatedCart = cart
      .map(item =>
        item.barcode === code
          ? {
            ...item,
            quantity: item.quantity - 1,
            subtotal: (item.quantity - 1) * item.price
          }
          : item
      )
      .filter(item => item.quantity > 0); // remove if 0

    setCart(updatedCart);
    updateTotal(updatedCart);
  };

  /////////////////////////////////////////////////////////////////
  // Create invoice
  /////////////////////////////////////////////////////////////////

  const createInvoice = async () => {

    if (cart.length === 0) {
      alert("Cart empty");
      return;
    }

    const items = cart.map(item => ({
      barcode: item.barcode,
      quantity: item.quantity
    }));

    try {

      const res = await fetch(`${API}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customer || "Walk-in Customer",
          items
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Invoice creation failed");
        return;
      }

      if (data.warnings && data.warnings.length > 0) {
        alert(
          `Invoice Created: ${data.invoice_number}\n\nWarnings:\n` +
          data.warnings.join("\n")
        );
      } else {
        alert(`Invoice Created: ${data.invoice_number}`);
      }

      setCart([]);
      setTotal(0);
      setCustomer("");

    } catch (err) {
      console.error(err);
      alert("Server error while creating invoice");
    }
  };

  /////////////////////////////////////////////////////////////////
  // UI
  /////////////////////////////////////////////////////////////////

  return (
    <div style={containerStyle}>

      <h1>POS Billing System</h1>

      <button onClick={goHistory} style={secondaryBtn}>
        View Invoice History
      </button>

      <button onClick={goDashboard} style={{ ...secondaryBtn, marginLeft: "10px" }}>
        Dashboard
      </button>

      <br /><br />

      <input
        placeholder="Customer Name"
        value={customer}
        onChange={(e) => setCustomer(e.target.value)}
        style={inputStyle}
      />

      <br /><br />

      <input
        ref={barcodeRef}
        placeholder="Scan Barcode"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && addToCart()}
        style={inputStyle}
      />

      <button onClick={() => addToCart()} style={buttonStyle}>
        Add
      </button>

      <button onClick={startScanner} style={secondaryBtn}>
        Scan with Camera
      </button>

      {scannerOpen && (
        <div
          id="scanner"
          style={{ width: "300px", marginTop: "20px", background: "white", padding: "10px" }}
        ></div>
      )}

      <h2>Cart</h2>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Barcode</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Subtotal</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, i) => (
            <tr key={i}>
              <td>{item.name}</td>
              <td>{item.barcode}</td>
              <td>₹ {item.price}</td>
              <td>
                <button
                  onClick={() => decreaseQty(item.barcode)}
                  style={{ marginRight: "5px" }}
                >
                  −
                </button>

                {item.quantity}

                <button
                  onClick={() => increaseQty(item.barcode)}
                  style={{ marginLeft: "5px" }}
                >
                  +
                </button>
              </td>
              <td>₹ {item.subtotal}</td>
              <td>
                <button
                  onClick={() => removeItem(item.barcode)}
                  style={removeStyle}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Total: ₹ {total}</h2>

      <button onClick={createInvoice} style={invoiceButton}>
        Create Invoice
      </button>

      {editingProduct && (
        <div style={popupStyle}>
          <h2>Edit Product</h2>

          <label>Name</label>
          <input
            value={editingProduct.name}
            onChange={(e) =>
              setEditingProduct({ ...editingProduct, name: e.target.value })
            }
          />

          <label>Price</label>
          <input
            type="number"
            value={editingProduct.price === 0 ? "" : editingProduct.price}
            onChange={(e) =>
              setEditingProduct({
                ...editingProduct,
                price: Number(e.target.value)
              })
            }
          />

          <label>Stock</label>
          <input
            type="number"
            value={editingProduct.stock === 0 ? "" : editingProduct.stock}
            onChange={(e) =>
              setEditingProduct({
                ...editingProduct,
                stock: Number(e.target.value)
              })
            }
          />

          <button
            onClick={saveProduct}
            disabled={
              !editingProduct.name ||
              editingProduct.price <= 0 ||
              editingProduct.stock <= 0
            }
          >
            Save Product
          </button>
        </div>
      )}

    </div>
  );
}

//////////////////////////////////////////////////////////////////
// DASHBOARD PAGE
//////////////////////////////////////////////////////////////////

function DashboardPage({ goHistory, goPOS }) {
  const [summary, setSummary] = useState(null);
  const [weeklySales, setWeeklySales] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        summaryRes,
        weeklySalesRes,
        recentOrdersRes,
        topProductsRes,
        lowStockRes
      ] = await Promise.all([
        fetch(`${API}/dashboard/summary`),
        fetch(`${API}/dashboard/weekly-sales`),
        fetch(`${API}/dashboard/recent-orders`),
        fetch(`${API}/dashboard/top-selling-products`),
        fetch(`${API}/dashboard/low-stock-products`)
      ]);

      const responses = [
        summaryRes,
        weeklySalesRes,
        recentOrdersRes,
        topProductsRes,
        lowStockRes
      ];

      if (responses.some(res => !res.ok)) {
        throw new Error("Failed to load dashboard analytics");
      }

      const [
        summaryData,
        weeklySalesData,
        recentOrdersData,
        topProductsData,
        lowStockData
      ] = await Promise.all(responses.map(res => res.json()));

      setSummary(summaryData);
      setWeeklySales(weeklySalesData);
      setRecentOrders(recentOrdersData);
      setTopProducts(topProductsData);
      setLowStockProducts(lowStockData);
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const maxWeeklyRevenue = Math.max(
    ...weeklySales.map(day => day.revenue),
    1
  );
  const maxSold = Math.max(
    ...topProducts.map(product => product.sold),
    1
  );

  return (
    <div style={dashboardShellStyle}>
      <aside style={dashboardSidebarStyle}>
        <div style={brandWrapStyle}>
          <div style={brandMarkStyle}></div>
          <strong style={brandTextStyle}>POS<span style={brandAccentStyle}>Studio</span></strong>
        </div>

        <div style={sidebarSectionStyle}>MAIN</div>
        <button style={sidebarActiveItemStyle}>Dashboard</button>
        <button onClick={goPOS} style={sidebarItemStyle}>POS Billing</button>
        <button onClick={goHistory} style={sidebarItemStyle}>Invoice History</button>

        <div style={sidebarDividerStyle}></div>
        <div style={sidebarSectionStyle}>SYSTEM</div>
        <button style={sidebarItemStyle}>Products</button>
        <button style={sidebarItemStyle}>Stock Alerts</button>

        <div style={sidebarUserStyle}>
          <div style={avatarStyle}>RK</div>
          <div>
            <strong>Raj K.</strong>
            <span style={mutedSidebarTextStyle}>Cashier</span>
          </div>
          <span style={onlineDotStyle}></span>
        </div>
      </aside>

      <main style={dashboardMainStyle}>
        <header style={dashboardHeaderStyle}>
          <div>
            <h1 style={dashboardTitleStyle}>Dashboard</h1>
            <span style={dashboardWelcomeStyle}>Live inventory analytics</span>
          </div>
          <div style={dashboardTopActionsStyle}>
            <div style={datePillStyle}>{formatDisplayDate(new Date())}</div>
            <input
              placeholder="Search items, orders"
              style={dashboardSearchStyle}
            />
          </div>
        </header>

        {loading && <div style={dashboardStateStyle}>Loading dashboard...</div>}
        {error && <div style={dashboardStateStyle}>{error}</div>}

        {!loading && !error && summary && (
          <div style={dashboardContentStyle}>
            <div style={metricScrollStyle}>
              <DashboardStat
                accent="#bff5ec"
                label="Revenue"
                value={`₹ ${summary.total_revenue.toFixed(2)}`}
                note="Total billed"
              />
              <DashboardStat
                accent="#c9f8dd"
                label="Orders"
                value={summary.total_sales}
                note="All invoices"
              />
              <DashboardStat
                accent="#fff2b8"
                label="Products"
                value={summary.total_products}
                note={`${summary.low_stock_products} low stock`}
                warning={summary.low_stock_products > 0}
              />
              <DashboardStat
                accent="#fbdde2"
                label="Alerts"
                value={summary.low_stock_products}
                note="Needs restock"
                warning={summary.low_stock_products > 0}
              />
            </div>

            <div style={dashboardGridStyle}>
              <section style={salesPanelStyle}>
                <div style={panelHeaderStyle}>
                  <h2 style={panelTitleStyle}>Weekly Sales</h2>
                  <div style={tabGroupStyle}>
                    <span style={activeTabStyle}>Week</span>
                    <span style={tabStyle}>Month</span>
                    <span style={tabStyle}>Year</span>
                  </div>
                </div>
                <div style={chartStyle}>
                  {weeklySales.map(day => (
                    <div key={day.date} style={barWrapStyle}>
                      <div
                        title={`₹ ${day.revenue.toFixed(2)}`}
                        style={{
                          ...barStyle,
                          height: `${Math.max((day.revenue / maxWeeklyRevenue) * 170, 8)}px`
                        }}
                      />
                      <small>{formatShortDate(day.date)}</small>
                    </div>
                  ))}
                </div>
              </section>

              <section style={sidePanelStyle}>
                <h2 style={panelTitleStyle}>Recent Orders</h2>
                <div style={listStyle}>
                  {recentOrders.map((order, index) => (
                    <div key={order.invoice_id} style={orderRowStyle}>
                      <div style={{
                        ...listSwatchStyle,
                        background: swatchColors[index % swatchColors.length]
                      }}></div>
                      <div style={listContentStyle}>
                        <strong>{order.invoice_number}</strong>
                        <span>{order.customer_name} · {order.items_sold} items</span>
                      </div>
                      <strong>₹ {order.total.toFixed(0)}</strong>
                    </div>
                  ))}
                  {recentOrders.length === 0 && <p>No orders yet.</p>}
                </div>
              </section>

              <section style={widePanelStyle}>
                <div style={panelHeaderStyle}>
                  <h2 style={panelTitleStyle}>Top-Selling Products</h2>
                  <span style={detailsLinkStyle}>Details →</span>
                </div>
                <div style={listStyle}>
                  {topProducts.map(product => (
                    <div key={product.product_id} style={productRowStyle}>
                      <div style={productInitialStyle}>{getInitial(product.name)}</div>
                      <div style={listContentStyle}>
                        <strong>{product.name}</strong>
                        <span>{product.sold} sold</span>
                      </div>
                      <div style={progressTrackStyle}>
                        <div
                          style={{
                            ...progressFillStyle,
                            width: `${Math.min((product.sold / maxSold) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      <strong>₹ {product.revenue.toFixed(0)}</strong>
                    </div>
                  ))}
                  {topProducts.length === 0 && <p>No product sales yet.</p>}
                </div>
              </section>

              <section style={sidePanelStyle}>
                <h2 style={panelTitleStyle}>Low Stock</h2>
                <div style={listStyle}>
                  {lowStockProducts.map((product, index) => (
                    <div key={product.product_id} style={orderRowStyle}>
                      <div style={{
                        ...listSwatchStyle,
                        background: swatchColors[(index + 2) % swatchColors.length]
                      }}></div>
                      <div style={listContentStyle}>
                        <strong>{product.name}</strong>
                        <span>{product.sku}</span>
                      </div>
                      <strong style={stockAlertStyle}>{product.stock}</strong>
                    </div>
                  ))}
                  {lowStockProducts.length === 0 && <p>No low-stock products.</p>}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function DashboardStat({ accent, label, note, value, warning = false }) {
  return (
    <div style={statStyle}>
      <div style={{ ...metricAccentStyle, background: accent }}></div>
      <span style={statLabelStyle}>{label}</span>
      <strong style={statValueStyle}>{value}</strong>
      <span style={warning ? statWarningStyle : statNoteStyle}>{note}</span>
    </div>
  );
}

function formatShortDate(dateValue) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short"
  });
}

function formatDisplayDate(dateValue) {
  return dateValue.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getInitial(value) {
  return value ? value.charAt(0).toUpperCase() : "P";
}

//////////////////////////////////////////////////////////////////
// HISTORY PAGE
//////////////////////////////////////////////////////////////////

function HistoryPage({ goBack }) {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadInvoices = async () => {
      const res = await fetch(`${API}/invoices`);
      const data = await res.json();

      if (!ignore) {
        setInvoices(data);
      }
    };

    loadInvoices();

    return () => {
      ignore = true;
    };
  }, []);

  const viewInvoiceDetails = async (id) => {
    const res = await fetch(`${API}/invoice/${id}`);
    const data = await res.json();
    setSelectedInvoice(data);
  };

  if (selectedInvoice) {
    return (
      <div style={containerStyle}>
        <h1>Invoice Details</h1>
        <button onClick={() => setSelectedInvoice(null)} style={secondaryBtn}>
          Back
        </button>
        <h3>Invoice: {selectedInvoice.invoice_number}</h3>
        <h3>Total: ₹ {selectedInvoice.total}</h3>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1>Invoice History</h1>
      <button onClick={goBack} style={secondaryBtn}>
        Back to POS
      </button>
      <table style={tableStyle}>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.invoice_id}>
              <td>{inv.invoice_number}</td>
              <td>₹ {inv.total}</td>
              <td>
                <button
                  onClick={() => viewInvoiceDetails(inv.invoice_id)}
                  style={buttonStyle}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

//////////////////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////////////////

const containerStyle = {
  padding: "40px",
  background: "#0f172a",
  color: "white",
  minHeight: "100vh"
};

const inputStyle = {
  padding: "10px",
  marginRight: "10px"
};

const buttonStyle = {
  padding: "10px 20px",
  background: "#22c55e",
  color: "white",
  border: "none",
  cursor: "pointer"
};

const removeStyle = {
  padding: "5px 10px",
  background: "red",
  color: "white",
  border: "none"
};

const invoiceButton = {
  padding: "15px 30px",
  background: "#3b82f6",
  color: "white",
  border: "none",
  marginTop: "20px",
  cursor: "pointer"
};

const secondaryBtn = {
  padding: "10px 20px",
  background: "#6366f1",
  color: "white",
  border: "none",
  cursor: "pointer"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "20px"
};

const swatchColors = ["#bff5ec", "#c9f8dd", "#fff2b8", "#fbdde2"];

const dashboardShellStyle = {
  minHeight: "100vh",
  background: "#eefafa",
  color: "#0f2d34",
  display: "grid",
  gridTemplateColumns: "minmax(280px, 438px) minmax(0, 1fr)",
  textAlign: "left"
};

const dashboardSidebarStyle = {
  minHeight: "100vh",
  background: "#0d3038",
  color: "#e7fbfb",
  padding: "46px 20px",
  display: "flex",
  flexDirection: "column",
  gap: "16px"
};

const brandWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
  padding: "0 16px 28px"
};

const brandMarkStyle = {
  width: "64px",
  height: "64px",
  borderRadius: "18px",
  background: "#149d8f"
};

const brandTextStyle = {
  fontSize: "28px",
  letterSpacing: "0"
};

const brandAccentStyle = {
  color: "#16d5b6"
};

const sidebarSectionStyle = {
  color: "#568292",
  fontSize: "18px",
  fontWeight: 800,
  letterSpacing: "2px",
  margin: "18px 16px 0"
};

const sidebarItemStyle = {
  minHeight: "72px",
  borderRadius: "22px",
  border: "2px solid rgba(182, 228, 230, 0.22)",
  background: "rgba(10, 43, 51, 0.7)",
  color: "#cbe7e8",
  textAlign: "left",
  padding: "0 24px",
  fontSize: "18px"
};

const sidebarActiveItemStyle = {
  ...sidebarItemStyle,
  borderColor: "rgba(182, 228, 230, 0.38)",
  background: "#113943",
  color: "#ffffff"
};

const sidebarDividerStyle = {
  height: "1px",
  background: "#1d5664",
  margin: "8px 2px"
};

const sidebarUserStyle = {
  marginTop: "auto",
  borderTop: "1px solid #1d5664",
  padding: "40px 20px 6px",
  display: "grid",
  gridTemplateColumns: "60px 1fr 12px",
  alignItems: "center",
  gap: "18px"
};

const avatarStyle = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  background: "#149d8f",
  display: "grid",
  placeItems: "center",
  fontWeight: 800,
  fontSize: "22px"
};

const mutedSidebarTextStyle = {
  display: "block",
  color: "#6692a0",
  marginTop: "2px"
};

const onlineDotStyle = {
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  background: "#4ade80"
};

const dashboardMainStyle = {
  minWidth: 0,
  overflow: "hidden"
};

const dashboardHeaderStyle = {
  minHeight: "108px",
  padding: "16px 44px",
  background: "#ffffff",
  borderBottom: "2px solid #c8eeee",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px"
};

const dashboardTitleStyle = {
  fontSize: "30px",
  lineHeight: 1,
  margin: 0,
  display: "inline"
};

const dashboardWelcomeStyle = {
  color: "#4a7c88",
  fontSize: "22px",
  marginLeft: "8px"
};

const dashboardTopActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  minWidth: 0
};

const datePillStyle = {
  minWidth: "130px",
  border: "2px solid #c8eeee",
  borderRadius: "14px",
  padding: "12px 20px",
  color: "#477885",
  background: "#f1fbfb",
  fontSize: "18px",
  textAlign: "center"
};

const dashboardSearchStyle = {
  width: "320px",
  maxWidth: "34vw",
  height: "68px",
  border: "2px solid #c8eeee",
  borderRadius: "14px",
  padding: "0 24px",
  fontSize: "20px",
  background: "#f7ffff",
  color: "#0f2d34"
};

const dashboardStateStyle = {
  margin: "40px 44px",
  padding: "24px",
  borderRadius: "18px",
  border: "2px solid #bfe8e8",
  background: "#ffffff",
  fontSize: "20px"
};

const dashboardContentStyle = {
  padding: "38px 44px",
  display: "flex",
  flexDirection: "column",
  gap: "32px"
};

const metricScrollStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
  gap: "20px",
  overflowX: "auto",
  paddingBottom: "2px"
};

const statStyle = {
  minHeight: "170px",
  background: "#ffffff",
  border: "2px solid #bfe8e8",
  borderRadius: "22px",
  padding: "30px 32px",
  position: "relative",
  textAlign: "left",
  boxSizing: "border-box"
};

const statLabelStyle = {
  display: "block",
  color: "#6cb7c7",
  fontSize: "18px",
  fontWeight: 800,
  letterSpacing: "2px",
  textTransform: "uppercase"
};

const statValueStyle = {
  display: "block",
  fontSize: "40px",
  marginTop: "30px",
  letterSpacing: "0"
};

const metricAccentStyle = {
  position: "absolute",
  top: "28px",
  right: "32px",
  width: "54px",
  height: "54px",
  borderRadius: "14px"
};

const statNoteStyle = {
  color: "#00936f",
  display: "block",
  fontWeight: 800,
  marginTop: "14px",
  fontSize: "18px"
};

const statWarningStyle = {
  ...statNoteStyle,
  color: "#f01446"
};

const dashboardGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(520px, 1.5fr) minmax(320px, 0.9fr)",
  gap: "32px"
};

const salesPanelStyle = {
  minHeight: "420px",
  border: "2px solid #bfe8e8",
  borderRadius: "22px",
  background: "#ffffff",
  padding: "34px",
  boxSizing: "border-box"
};

const sidePanelStyle = {
  minHeight: "420px",
  border: "2px solid #bfe8e8",
  borderRadius: "22px",
  background: "#ffffff",
  padding: "34px",
  boxSizing: "border-box"
};

const widePanelStyle = {
  border: "2px solid #bfe8e8",
  borderRadius: "22px",
  background: "#ffffff",
  padding: "34px",
  boxSizing: "border-box"
};

const panelHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "18px"
};

const panelTitleStyle = {
  margin: 0,
  fontSize: "26px",
  lineHeight: 1.15
};

const tabGroupStyle = {
  display: "flex",
  gap: "52px",
  fontSize: "26px"
};

const activeTabStyle = {
  color: "#0f2d34"
};

const tabStyle = {
  color: "#0f2d34"
};

const chartStyle = {
  minHeight: "280px",
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(60px, 1fr))",
  gap: "14px",
  alignItems: "end",
  marginTop: "42px",
  borderBottom: "2px solid #d8f0ef"
};

const barWrapStyle = {
  minHeight: "260px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "10px",
  color: "#72b8c6"
};

const barStyle = {
  width: "100%",
  maxWidth: "56px",
  background: "linear-gradient(180deg, #13978d 0%, #dff7f5 100%)",
  borderRadius: "10px 10px 0 0"
};

const listStyle = {
  marginTop: "26px",
  display: "flex",
  flexDirection: "column"
};

const orderRowStyle = {
  minHeight: "72px",
  display: "grid",
  gridTemplateColumns: "56px minmax(0, 1fr) auto",
  gap: "18px",
  alignItems: "center",
  borderBottom: "2px solid #d2eeee",
  padding: "14px 0"
};

const productRowStyle = {
  minHeight: "76px",
  display: "grid",
  gridTemplateColumns: "48px minmax(130px, 1fr) minmax(120px, 180px) auto",
  gap: "18px",
  alignItems: "center",
  borderBottom: "2px solid #d2eeee",
  padding: "14px 0"
};

const listSwatchStyle = {
  width: "56px",
  height: "56px",
  borderRadius: "14px"
};

const listContentStyle = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  fontSize: "18px"
};

const productInitialStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  background: "#fff2b8",
  color: "#0f2d34",
  display: "grid",
  placeItems: "center",
  fontWeight: 800
};

const progressTrackStyle = {
  height: "8px",
  borderRadius: "99px",
  background: "#edf8f7",
  overflow: "hidden"
};

const progressFillStyle = {
  height: "100%",
  borderRadius: "99px",
  background: "#13978d"
};

const detailsLinkStyle = {
  color: "#009b8c",
  fontSize: "18px",
  whiteSpace: "nowrap"
};

const stockAlertStyle = {
  color: "#f01446"
};

const popupStyle = {
  position: "fixed",
  top: "30%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  background: "#1e293b",
  padding: "30px",
  borderRadius: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  width: "300px",
  zIndex: 1000
};

export default App;
