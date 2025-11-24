import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Shield,
  LogOut,
  Settings,
  Bell,
  User,
} from "lucide-react";
import ThemeSwitcher from "../components/ThemeSwitcher";

const AdminDashboard = () => {
  const { backendUrl, setToken, setCartItems } = useContext(ShopContext);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [products, setProducts] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setCartItems({});
    toast.success("Déconnexion réussie");
    navigate("/login");
  };

  // Fetch dashboard statistics
  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(backendUrl + "/api/admin/dashboard/stats", {
        headers: {
          Authorization: `Token ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  // Fetch pharmacies
  const fetchPharmacies = async (statusFilter = "all") => {
    setLoading(true);
    try {
      const response = await fetch(
        backendUrl + `/api/admin/pharmacies?status=${statusFilter}`,
        {
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setPharmacies(data.pharmacies);
      }
    } catch (error) {
      console.error("Error fetching pharmacies:", error);
      toast.error("Failed to load pharmacies");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async (statusFilter = "all") => {
    setLoading(true);
    try {
      const response = await fetch(
        backendUrl + `/api/admin/products?status=${statusFilter}`,
        {
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Verify pharmacy
  const handleVerifyPharmacy = async (pharmacyId) => {
    try {
      const response = await fetch(
        backendUrl + `/api/admin/pharmacies/${pharmacyId}/verify`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchPharmacies();
        fetchStats();
      }
    } catch (error) {
      toast.error("Failed to verify pharmacy");
    }
  };

  // Approve product
  const handleApproveProduct = async (productId) => {
    try {
      const response = await fetch(
        backendUrl + `/api/admin/products/${productId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchProducts();
        fetchStats();
      }
    } catch (error) {
      toast.error("Failed to approve product");
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeSection === "pharmacies") {
      fetchPharmacies();
    } else if (activeSection === "products") {
      fetchProducts();
    }
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Header with Logout */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard MedEx
              </h1>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4">
              <ThemeSwitcher />

              <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile Menu with Logout */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-colors"
                >
                  <User className="w-6 h-6" />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <>
                    {/* Overlay to close menu */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />

                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-2 z-50">
                      <div className="px-4 py-3 border-b dark:border-gray-600">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Administrator
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {localStorage.getItem("userEmail") ||
                            "admin@medex.com"}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          navigate("/admin/settings");
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                        <span>Paramètres</span>
                      </button>

                      <hr className="my-2 border-gray-200 dark:border-gray-600" />

                      <button
                        onClick={() => {
                          handleLogout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Direct Logout Button (visible on desktop) */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 h-fit sticky top-6">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection("overview")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === "overview"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span>Vue d'ensemble</span>
              </button>
              <button
                onClick={() => setActiveSection("pharmacies")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === "pharmacies"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Store className="w-5 h-5" />
                <span>Pharmacies</span>
              </button>
              <button
                onClick={() => setActiveSection("products")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === "products"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Package className="w-5 h-5" />
                <span>Produits</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Overview Section */}
            {activeSection === "overview" && stats && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total Users
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {stats.users.total}
                        </p>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      <p>Clients: {stats.users.clients}</p>
                      <p>Pharmacists: {stats.users.pharmacists}</p>
                      <p>Delivery: {stats.users.delivery_persons}</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Pharmacies
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {stats.pharmacies.total}
                        </p>
                      </div>
                      <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                        <Store className="w-6 h-6 text-green-600 dark:text-green-300" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {stats.pharmacies.verified} verified
                      </span>
                    </div>
                    <div className="mt-1 flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-1 text-orange-600" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {stats.pharmacies.pending} pending
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Products
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {stats.products.total}
                        </p>
                      </div>
                      <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                        <Package className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {stats.products.approved} approved
                      </span>
                    </div>
                    <div className="mt-1 flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-1 text-orange-600" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {stats.products.pending} pending
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Revenue
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {stats.revenue.total.toLocaleString()} FCFA
                        </p>
                      </div>
                      <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                        <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        Delivery Fees:{" "}
                        {stats.revenue.delivery_fees.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                </div>

                {/* Top Pharmacies */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Top Pharmacies
                  </h3>
                  <div className="space-y-3">
                    {stats.top_pharmacies?.map((pharmacy) => (
                      <div
                        key={pharmacy.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Store className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {pharmacy.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {pharmacy.order_count} orders • {pharmacy.rating}★
                            </p>
                          </div>
                        </div>
                        {pharmacy.is_verified && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pharmacies Section */}
            {activeSection === "pharmacies" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Pharmacy Management
                </h2>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                      Loading pharmacies...
                    </p>
                  </div>
                ) : pharmacies.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Pharmacy
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Owner
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Products
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {pharmacies.map((pharmacy) => (
                          <tr key={pharmacy.id}>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {pharmacy.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {pharmacy.address}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {pharmacy.owner_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {pharmacy.owner_email}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  pharmacy.is_verified
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {pharmacy.is_verified ? "Verified" : "Pending"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {pharmacy.product_count}
                            </td>
                            <td className="px-6 py-4">
                              {!pharmacy.is_verified && (
                                <button
                                  onClick={() =>
                                    handleVerifyPharmacy(pharmacy.id)
                                  }
                                  className="text-green-600 hover:text-green-900 flex items-center gap-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Verify</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Store className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No pharmacies found</p>
                  </div>
                )}
              </div>
            )}

            {/* Products Section */}
            {activeSection === "products" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Product Management
                </h2>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                      Loading products...
                    </p>
                  </div>
                ) : products.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Pharmacy
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td className="px-6 py-4">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {product.dosage}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {product.pharmacy_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {product.price} FCFA
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  product.is_approved
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {product.is_approved ? "Approved" : "Pending"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {!product.is_approved && (
                                <button
                                  onClick={() =>
                                    handleApproveProduct(product.id)
                                  }
                                  className="text-green-600 hover:text-green-900 flex items-center gap-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Approve</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No products found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
