import DashboardCard from "../common/DashboardCard";

export default function TopProducts({ products }) {
  console.log("TopProducts component:", products);
  return (
    <DashboardCard
      title="Top Selling Products"
      subtitle="Best performing products"
    >
      {products.length === 0 ? (
        <p className="text-gray-500">No sales yet.</p>
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
                <p className="font-bold text-emerald-600">
                  {product.sold} sold
                </p>

                <p className="text-sm text-gray-500">
                  ₹{product.revenue}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}