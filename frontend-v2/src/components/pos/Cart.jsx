import { tableStyle, removeStyle } from "../../styles/styles";

/**
 * Cart – displays billed items with quantity controls and remove action.
 * @param {Array}    items       – array of { barcode, name, price, quantity, subtotal }
 * @param {Function} onIncrease  – (barcode) => void
 * @param {Function} onDecrease  – (barcode) => void
 * @param {Function} onRemove    – (barcode) => void
 */
export default function Cart({ items = [], onIncrease, onDecrease, onRemove }) {
  return (
    <>
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
          {items.map((item, i) => (
            <tr key={i}>
              <td>{item.name}</td>
              <td>{item.barcode}</td>
              <td>₹ {item.price}</td>
              <td>
                <button
                  onClick={() => onDecrease(item.barcode)}
                  style={{ marginRight: "5px" }}
                >
                  −
                </button>
                {item.quantity}
                <button
                  onClick={() => onIncrease(item.barcode)}
                  style={{ marginLeft: "5px" }}
                >
                  +
                </button>
              </td>
              <td>₹ {item.subtotal}</td>
              <td>
                <button
                  onClick={() => onRemove(item.barcode)}
                  style={removeStyle}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan="6" style={{ padding: "16px", opacity: 0.5 }}>
                Cart is empty. Scan a barcode to start.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
