import DashboardCard from "../common/DashboardCard";

export default function RecentOrders({ orders }) {
  return (
    <DashboardCard
      title="Recent Orders"
      subtitle="Latest customer purchases"
    >
      {orders.length === 0 ? (
        <p className="text-gray-500">No recent orders.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.invoice_id}
              className="flex items-center justify-between border-b border-gray-100 pb-4"
            >
              <div>
                <p className="font-semibold">
                  {order.invoice_number}
                </p>

                <p className="text-sm text-gray-500">
                  {order.customer_name}
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-emerald-600">
                  ₹{order.total}
                </p>

                <p className="text-sm text-gray-500">
                  {order.items_sold} items
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}