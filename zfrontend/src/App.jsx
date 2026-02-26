import { Html5QrcodeScanner } from "html5-qrcode";
import { useState, useRef, useEffect } from "react";

const API = "http://192.168.1.17:8000";

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
  const [scannerOpen, setScannerOpen] =
    useState(false);
  const barcodeRef = useRef(null);
  const saveProduct = async () => {

    const res = await fetch(`${API}/products/${editingProduct.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(editingProduct)
    });

    const updated = await res.json();

    setEditingProduct(null);

    alert("Product saved successfully");

  };
  const startScanner = () => {

    setScannerOpen(true);

    setTimeout(() => {

      const scanner = new Html5QrcodeScanner(
        "scanner",
        {
          fps: 10,
          qrbox: 250,
          supportedScanTypes: [],
          videoConstraints: {
            facingMode: { exact: "environment" }
          }
        },
        false
      );

      scanner.render(
        (decodedText) => {

          console.log("SCANNED:", decodedText);
          alert("Scanned: " + decodedText);

          setBarcode(decodedText.trim());

          scanner.clear();
          setScannerOpen(false);

        },
        (error) => { }
      );

    }, 300);
  };

  useEffect(() => {
    barcodeRef.current.focus();
  }, []);

  const updateTotal = (cartData) => {
    const newTotal = cartData.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    setTotal(newTotal);
  };



  const addToCart = async () => {

    if (!barcode) return;

    try {

      // First try to find product
      let res = await fetch(`${API}/products/barcode/${barcode}`);

      let product;

      if (res.ok) {

        product = await res.json();

      } else {

        // If not found → auto create product
        res = await fetch(`${API}/products/scan`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(barcode)
        });

        product = await res.json();

        // open edit popup
        setEditingProduct(product);
        setBarcode("");
        return;
      }


      // Add to cart normally
      const existing = cart.find(item => item.barcode === barcode);

      let updatedCart;

      if (existing) {

        updatedCart = cart.map(item =>
          item.barcode === barcode
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

    } catch {

      alert("Backend connection failed");

    }

  };

  const removeItem = (barcode) => {
    const updatedCart = cart.filter(item => item.barcode !== barcode);
    setCart(updatedCart);
    updateTotal(updatedCart);
  };

  const createInvoice = async () => {

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    const items = cart.map(item => ({
      barcode: item.barcode,
      quantity: item.quantity
    }));

    const res = await fetch(`${API}/invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customer || "Walk-in Customer",
        items: items
      })
    });

    const data = await res.json();

    alert(`Invoice Created: ${data.invoice_number}`);

    setCart([]);
    setTotal(0);
    setCustomer("");
  };

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

      <button onClick={addToCart} style={buttonStyle}>
        Add
      </button>
      <button onClick={startScanner} style={secondaryBtn}>
        Scan with Camera
      </button>
      {scannerOpen && (
        <div
          id="scanner"
          style={{
            width: "300px",
            marginTop: "20px",
            background: "white",
            padding: "10px"
          }}
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
          {cart.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.barcode}</td>
              <td>₹ {item.price}</td>
              <td>{item.quantity}</td>
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

          <input
            placeholder="Name"
            value={editingProduct.name}
            onChange={(e) =>
              setEditingProduct({
                ...editingProduct,
                name: e.target.value
              })
            }
          />

          <input
            placeholder="Price"
            type="number"
            value={editingProduct.price}
            onChange={(e) =>
              setEditingProduct({
                ...editingProduct,
                price: Number(e.target.value)
              })
            }
          />

          <input
            placeholder="Stock"
            type="number"
            value={editingProduct.stock}
            onChange={(e) =>
              setEditingProduct({
                ...editingProduct,
                stock: Number(e.target.value)
              })
            }
          />

          <button onClick={saveProduct}>
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

  const viewInvoiceDetails = async (invoice_id) => {

    const res = await fetch(`${API}/invoice/${invoice_id}`);
    const data = await res.json();

    setSelectedInvoice(data);
  };
  const downloadInvoicePDF = async (invoice_id) => {

    try {

      const res = await fetch(`${API}/invoice/${invoice_id}/pdf`);

      if (!res.ok) {
        alert("PDF download failed");
        return;
      }

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = `invoice_${invoice_id}.pdf`;

      document.body.appendChild(a);

      a.click();

      a.remove();

    } catch {
      alert("PDF download error");
    }

  };

  //////////////////////////////////////////////////////////////////
  // SHOW DETAILS VIEW
  //////////////////////////////////////////////////////////////////

  if (selectedInvoice) {

    return (
      <div style={containerStyle}>

        <h1>Invoice Details</h1>

        <button
          onClick={() => setSelectedInvoice(null)}
          style={secondaryBtn}
        >
          Back to History
        </button>

        <br /><br />

        <h3>Invoice Number: {selectedInvoice.invoice_number}</h3>
        <h3>Customer: {selectedInvoice.customer_name}</h3>
        <h3>Total: ₹ {selectedInvoice.total}</h3>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Barcode</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
          </thead>

          <tbody>

            {selectedInvoice.items.map((item, index) => (

              <tr key={index}>
                <td>{item.product_name}</td>
                <td>{item.barcode}</td>
                <td>₹ {item.price}</td>
                <td>{item.quantity}</td>
                <td>₹ {item.subtotal}</td>
              </tr>

            ))}

          </tbody>

        </table>

      </div>
    );
  }

  //////////////////////////////////////////////////////////////////
  // SHOW HISTORY LIST
  //////////////////////////////////////////////////////////////////

  return (
    <div style={containerStyle}>

      <h1>Invoice History</h1>

      <button onClick={goBack} style={secondaryBtn}>
        Back to POS
      </button>

      <br /><br />

      <table style={tableStyle}>

        <thead>

          <tr>
            <th>ID</th>
            <th>Invoice Number</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Date</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          {invoices.map(inv => (

            <tr key={inv.invoice_id}>

              <td>{inv.invoice_id}</td>
              <td>{inv.invoice_number}</td>
              <td>{inv.customer_name}</td>
              <td>₹ {inv.total}</td>
              <td>{new Date(inv.created_at).toLocaleString()}</td>

              <td>

                <button
                  onClick={() => viewInvoiceDetails(inv.invoice_id)}
                  style={buttonStyle}
                >
                  View
                </button>

                <button
                  onClick={() => downloadInvoicePDF(inv.invoice_id)}
                  style={{
                    ...buttonStyle,
                    background: "#10b981",
                    marginLeft: "10px"
                  }}
                >
                  PDF
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
  fontFamily: "Arial",
  background: "#0f172a",
  color: "white",
  minHeight: "100vh"
};

const inputStyle = {
  padding: "10px",
  marginRight: "10px",
  fontSize: "16px"
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

export default App;
const popupStyle = {
  position: "fixed",
  top: "30%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  background: "#1e293b",
  padding: "20px",
  borderRadius: "10px",
  zIndex: 1000
};