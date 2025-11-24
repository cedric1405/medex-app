import { useEffect, useState, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { Loader2, CheckCircle, XCircle, Truck } from "lucide-react";

const DeliveryDashboard = () => {
  const { backendUrl } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null); // order id being updated

  // Simuler un livreur connecté (plus tard: via auth context)
  const deliveryManId = 1;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${backendUrl}/api/delivery/orders?delivery_man_id=${deliveryManId}`
      );
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des commandes :", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdating(orderId);
      await axios.put(`${backendUrl}/api/delivery/orders/${orderId}/status/`, {
        status: newStatus,
      });
      // mettre à jour localement
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );
    } catch (error) {
      console.error("Erreur de mise à jour :", error);
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
      </div>
    );
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case "received":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Reçue</span>;
      case "delivered":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Livrée</span>;
      case "cancelled":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Annulée</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-600">Inconnue</span>;
    }
  };

  return (
    <div className="my-10 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Tableau de bord du livreur
      </h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">Aucune commande assignée pour le moment.</p>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-xl">
          <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Adresse</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr
                  key={order.id}
                  className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">{order.customer_name}</td>
                  <td className="px-4 py-3">{order.address}</td>
                  <td className="px-4 py-3 font-semibold">{order.total_price} €</td>
                  <td className="px-4 py-3">{renderStatusBadge(order.status)}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    {order.status === "received" && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, "delivered")}
                          disabled={updating === order.id}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md flex items-center gap-1 text-xs"
                        >
                          <CheckCircle size={14} />
                          {updating === order.id ? "..." : "Marquer Livrée"}
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          disabled={updating === order.id}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md flex items-center gap-1 text-xs"
                        >
                          <XCircle size={14} />
                          Annuler
                        </button>
                      </>
                    )}
                    {order.status === "delivered" && (
                      <span className="text-green-500 flex items-center gap-1">
                        <Truck size={14} /> Livrée
                      </span>
                    )}
                    {order.status === "cancelled" && (
                      <span className="text-red-500 flex items-center gap-1">
                        <XCircle size={14} /> Annulée
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
