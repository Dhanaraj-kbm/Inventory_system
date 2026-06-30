import { popupStyle } from "../../styles/styles";

/**
 * ProductGrid – modal popup to fill in missing product details
 * (price / stock) before adding to cart.
 * @param {Object|null} product       – the product being edited, or null to hide
 * @param {Function}    onChange      – (updatedProduct) => void
 * @param {Function}    onSave        – called when Save is clicked
 */
export default function ProductGrid({ product, onChange, onSave }) {
  if (!product) return null;

  const isDisabled =
    !product.name || product.price <= 0 || product.stock <= 0;

  return (
    <div style={popupStyle}>
      <h2>Edit Product</h2>

      <label>Name</label>
      <input
        value={product.name ?? ""}
        onChange={(e) => onChange({ ...product, name: e.target.value })}
      />

      <label>Price</label>
      <input
        type="number"
        value={product.price === 0 ? "" : (product.price ?? "")}
        onChange={(e) =>
          onChange({ ...product, price: Number(e.target.value) })
        }
      />

      <label>Stock</label>
      <input
        type="number"
        value={product.stock === 0 ? "" : (product.stock ?? "")}
        onChange={(e) =>
          onChange({ ...product, stock: Number(e.target.value) })
        }
      />

      <button onClick={onSave} disabled={isDisabled}>
        Save Product
      </button>
    </div>
  );
}
