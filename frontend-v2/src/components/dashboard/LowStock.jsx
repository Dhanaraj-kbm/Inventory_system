import DashboardCard from "../common/DashboardCard";

export default function LowStock({ products }) {
  console.log("LowStock component:", products);
  return (
    <DashboardCard
      title="Low Stock Products"
      subtitle="Products requiring restocking"
    >
      {products.length === 0 ? (
        <p className="text-gray-500">
          Everything is well stocked 🎉
        </p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.product_id}
              className="flex justify-between items-center border-b border-gray-100 pb-3"
            >
              <div>
                <p className="font-semibold">
                  {product.name}
                </p>

                <p className="text-sm text-gray-500">
                  SKU: {product.sku}
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-red-600">
                  {product.stock} left
                </p>

                <p className="text-xs text-gray-500">
                  Threshold: {product.threshold}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}