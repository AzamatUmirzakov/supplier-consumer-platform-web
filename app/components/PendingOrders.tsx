import DashboardCard from "./DashboardCard";

const PendingOrders = () => {
  const orders = [
    { id: 1, item: "Item A", quantity: 2, status: "Pending" },
    { id: 2, item: "Item B", quantity: 1, status: "Pending" },
    { id: 3, item: "Item C", quantity: 5, status: "Pending" },
    { id: 4, item: "Item D", quantity: 3, status: "Pending" },
    { id: 5, item: "Item E", quantity: 4, status: "Pending" },
  ];
  return (
    <DashboardCard classNames="flex-1 max-h-[400px] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">Pending Orders</h2>
      <ul className="space-y-2">
        {orders.map((order) => (
          <Order key={order.id} item={order.item} quantity={order.quantity} status={order.status} />
        ))}
      </ul>
    </DashboardCard>
  );
};

const Order = ({ item, quantity, status }: any) => {
  return (
    <li className="p-5 bg-[#131313] rounded-lg cursor-pointer">
      {item} - Quantity: {quantity} - Status: {status}
    </li>
  )
}

export default PendingOrders;