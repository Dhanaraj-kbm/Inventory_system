import { Html5QrcodeScanner } from "html5-qrcode";
import { useState, useRef, useEffect } from "react";

const API = "http://10.57.75.58:8000";

function App() {
  const [page, setPage] = useState("pos");

  return (
    <div>
      {page === "pos" ? (
        <POSPage goHistory={() => setPage("history")} />
      ) : (
        <HistoryPage goBack={() => setPage("pos")} />
      )}
    </div>
  );
}

//////////////////////////////////////////////////////////////////
// POS PAGE
//////////////////////////////////////////////////////////////////

function POSPage({ goHistory }) {

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
// HISTORY PAGE
//////////////////////////////////////////////////////////////////

function HistoryPage({ goBack }) {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    const res = await fetch(`${API}/invoices`);
    const data = await res.json();
    setInvoices(data);
  };

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