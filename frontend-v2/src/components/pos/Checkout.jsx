import { inputStyle, invoiceButton } from "../../styles/styles";

/**
 * Checkout – customer name input, running total, and invoice submit button.
 * @param {string}   customer           – customer name value
 * @param {Function} onCustomerChange   – (value: string) => void
 * @param {number}   total              – cart total amount
 * @param {Function} onCreateInvoice    – called when the button is clicked
 */
export default function Checkout({ customer, onCustomerChange, total, onCreateInvoice }) {
  return (
    <div>
      <input
        placeholder="Customer Name"
        value={customer}
        onChange={(e) => onCustomerChange(e.target.value)}
        style={inputStyle}
      />
      <h2>Total: ₹ {total}</h2>
      <button onClick={onCreateInvoice} style={invoiceButton}>
        Create Invoice
      </button>
    </div>
  );
}
