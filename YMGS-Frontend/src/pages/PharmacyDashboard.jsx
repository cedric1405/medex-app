import React, { useState, useEffect, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import DashboardHeader from "../components/DashboardHeader";
import {
  Package,
  ShoppingCart,
  Mail,
  Bell,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Box,
  Search,
  Plus,
  Edit,
  Trash2,
  Upload,
  X,
  Download,
} from "lucide-react";

const PharmacyDashboard = () => {
  const { backendUrl } = useContext(ShopContext);
  const [activeSection, setActiveSection] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // États pour les images
  const [productImages, setProductImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

  // Form state for adding/editing products
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    generic_name: "",
    manufacturer: "",
    dosage: "",
    price: "",
    stock_quantity: "",
    min_order_quantity: 1,
    category_id: "",
    subcategory_id: "",
    requires_prescription: false,
  });

  // Gérer le changement d'images
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Limiter à 5 images maximum
    if (files.length > 5) {
      toast.warning("Vous ne pouvez télécharger que 5 images maximum");
      return;
    }

    setProductImages(files);

    // Créer des previews
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  // Supprimer une image du preview
  const removeImage = (index) => {
    const newImages = productImages.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setProductImages(newImages);
    setImagePreview(newPreviews);
  };

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(backendUrl + "/api/pharmacy/products", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.data.success) {
        setProducts(response.data.products);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/categories");
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch subcategories
  const fetchSubcategories = async (categoryId) => {
    try {
      const response = await axios.get(
        backendUrl + `/api/categories/${categoryId}/subcategories`
      );
      if (response.data.success) {
        setSubcategories(response.data.subcategories);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  useEffect(() => {
    if (activeSection === "products") {
      fetchProducts();
      fetchCategories();
    }
  }, [activeSection]);

  // Handle add product avec images
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Utiliser FormData pour les images
      const formData = new FormData();

      // Ajouter tous les champs
      Object.keys(productForm).forEach((key) => {
        if (productForm[key] !== "" && productForm[key] !== null) {
          formData.append(key, productForm[key]);
        }
      });

      // Ajouter les images
      productImages.forEach((image) => {
        formData.append("images", image);
      });

      const response = await axios.post(
        backendUrl + "/api/pharmacy/products/add",
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setShowAddModal(false);
        resetForm();
        fetchProducts();
      }
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error(error.response?.data?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit product avec images
  const handleEditProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Utiliser FormData pour les images
      const formData = new FormData();

      // Ajouter tous les champs
      Object.keys(productForm).forEach((key) => {
        if (productForm[key] !== "" && productForm[key] !== null) {
          formData.append(key, productForm[key]);
        }
      });

      // Ajouter les nouvelles images si présentes
      productImages.forEach((image) => {
        formData.append("images", image);
      });

      const response = await axios.put(
        backendUrl + `/api/pharmacy/products/${selectedProduct.id}/update`,
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setShowEditModal(false);
        resetForm();
        fetchProducts();
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(error.response?.data?.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        backendUrl + `/api/pharmacy/products/${productId}/delete`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchProducts();
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  // Handle import Excel
  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        backendUrl + "/api/pharmacy/products/import",
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchProducts();
      }
    } catch (error) {
      console.error("Error importing products:", error);
      toast.error(error.response?.data?.message || "Failed to import products");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setProductForm({
      name: "",
      description: "",
      generic_name: "",
      manufacturer: "",
      dosage: "",
      price: "",
      stock_quantity: "",
      min_order_quantity: 1,
      category_id: "",
      subcategory_id: "",
      requires_prescription: false,
    });
    setSelectedProduct(null);
    setSubcategories([]);
    setProductImages([]);
    setImagePreview([]);
  };

  // Open edit modal
  const openEditModal = (product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      generic_name: product.generic_name || "",
      manufacturer: product.manufacturer || "",
      dosage: product.dosage || "",
      price: product.price,
      stock_quantity: product.stock_quantity,
      min_order_quantity: product.min_order_quantity,
      category_id: product.category?.id || "",
      subcategory_id: product.subCategory?.id || "",
      requires_prescription: product.requires_prescription,
    });

    if (product.category?.id) {
      fetchSubcategories(product.category.id);
    }

    setShowEditModal(true);
  };

  // Filter products
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Download Excel template
  const downloadTemplate = () => {
    const csvContent =
      "name,description,generic_name,manufacturer,dosage,price,stock_quantity,min_order_quantity,category,subcategory,requires_prescription\n" +
      "Paracetamol 500mg,Pain reliever,Paracetamol,PharmaCo,500mg,500,100,1,Pain Relief,Analgesics,false\n";

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_template.csv";
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <DashboardHeader title="Dashboard MedEx Pharmacy" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 h-fit sticky top-6">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection("overview")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === "overview"
                    ? "bg-[#02ADEE] text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span>Vue d'ensemble</span>
              </button>
              <button
                onClick={() => setActiveSection("products")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === "products"
                    ? "bg-[#02ADEE] text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Box className="w-5 h-5" />
                <span>Gestion Produits</span>
              </button>
              <button
                onClick={() => setActiveSection("orders")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === "orders"
                    ? "bg-[#02ADEE] text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Commandes</span>
              </button>
              <button
                onClick={() => setActiveSection("email")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === "email"
                    ? "bg-[#02ADEE] text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Mail className="w-5 h-5" />
                <span>Notifications</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Overview Section */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Chiffre d'affaires
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          0 FCFA
                        </p>
                      </div>
                      <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                        <DollarSign className="w-6 h-6 text-green-600 dark:text-green-300" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-600">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span>+0% ce mois</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Commandes
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          0
                        </p>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                        <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-blue-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>0 en attente</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Produits
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {stats.total || 0}
                        </p>
                      </div>
                      <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                        <Package className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-purple-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span>{stats.approved || 0} approuvés</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          En attente
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {stats.pending_approval || 0}
                        </p>
                      </div>
                      <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-orange-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Approbation admin</span>
                    </div>
                  </div>
                </div>

                {/* Recent Orders & Low Stock */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Commandes récentes
                    </h3>
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Aucune commande récente</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Produits en rupture
                    </h3>
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>{stats.out_of_stock || 0} produit(s) en rupture</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Management Section */}
            {activeSection === "products" && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Gestion des Produits
                    </h2>
                    <div className="flex gap-3">
                      <button
                        onClick={downloadTemplate}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Download className="w-5 h-5" />
                        Template
                      </button>
                      <label className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600 cursor-pointer">
                        <Upload className="w-5 h-5" />
                        Importer Excel
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleImportExcel}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-[#02ADEE] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#0296d1]"
                      >
                        <Plus className="w-5 h-5" />
                        Nouveau produit
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Products Table */}
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02ADEE] mx-auto"></div>
                      <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Chargement...
                      </p>
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Produit
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Catégorie
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Prix
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Stock
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Statut
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredProducts.map((product) => (
                            <tr key={product.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                    <Package className="w-6 h-6 text-gray-500" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {product.name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {product.dosage}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {product.category_name || "N/A"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {product.price} FCFA
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {product.stock_quantity}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    product.is_approved
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  }`}
                                >
                                  {product.is_approved
                                    ? "Approuvé"
                                    : "En attente"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openEditModal(product)}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                                  >
                                    <Edit className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteProduct(product.id)
                                    }
                                    className="text-red-600 hover:text-red-900 dark:text-red-400"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">Aucun produit disponible</p>
                      <p className="text-sm">
                        Cliquez sur "Nouveau produit" pour commencer
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Management Section */}
            {activeSection === "orders" && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Gestion des Commandes
                  </h2>
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Aucune commande</p>
                    <p className="text-sm">Les commandes apparaîtront ici</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Section */}
            {activeSection === "email" && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Email & Notifications
                  </h2>
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Aucune notification</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Ajouter un nouveau produit
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom du produit *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prix (FCFA) *
                    </label>
                    <input
                      type="number"
                      required
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          price: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom générique
                    </label>
                    <input
                      type="text"
                      value={productForm.generic_name}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          generic_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fabricant
                    </label>
                    <input
                      type="text"
                      value={productForm.manufacturer}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          manufacturer: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={productForm.dosage}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          dosage: e.target.value,
                        })
                      }
                      placeholder="ex: 500mg"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantité en stock
                    </label>
                    <input
                      type="number"
                      value={productForm.stock_quantity}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          stock_quantity: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantité minimum
                    </label>
                    <input
                      type="number"
                      value={productForm.min_order_quantity}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          min_order_quantity: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Catégorie
                    </label>
                    <select
                      value={productForm.category_id}
                      onChange={(e) => {
                        setProductForm({
                          ...productForm,
                          category_id: e.target.value,
                          subcategory_id: "",
                        });
                        if (e.target.value) {
                          fetchSubcategories(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Sélectionner</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sous-catégorie
                    </label>
                    <select
                      value={productForm.subcategory_id}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          subcategory_id: e.target.value,
                        })
                      }
                      disabled={!productForm.category_id}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    >
                      <option value="">Sélectionner</option>
                      {subcategories.map((subcat) => (
                        <option key={subcat.id} value={subcat.id}>
                          {subcat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Upload d'images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Images du produit (jusqu'à 5 images)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />

                  {/* Preview des images */}
                  {imagePreview.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {imagePreview.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requires_prescription"
                    checked={productForm.requires_prescription}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        requires_prescription: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-[#02ADEE] border-gray-300 rounded focus:ring-[#02ADEE]"
                  />
                  <label
                    htmlFor="requires_prescription"
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    Nécessite une ordonnance
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-[#02ADEE] text-white rounded-lg hover:bg-[#0296d1] disabled:opacity-50"
                  >
                    {loading ? "Ajout..." : "Ajouter le produit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Modifier le produit
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEditProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom du produit *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prix (FCFA) *
                    </label>
                    <input
                      type="number"
                      required
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          price: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom générique
                    </label>
                    <input
                      type="text"
                      value={productForm.generic_name}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          generic_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fabricant
                    </label>
                    <input
                      type="text"
                      value={productForm.manufacturer}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          manufacturer: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={productForm.dosage}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          dosage: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantité en stock
                    </label>
                    <input
                      type="number"
                      value={productForm.stock_quantity}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          stock_quantity: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantité minimum
                    </label>
                    <input
                      type="number"
                      value={productForm.min_order_quantity}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          min_order_quantity: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Catégorie
                    </label>
                    <select
                      value={productForm.category_id}
                      onChange={(e) => {
                        setProductForm({
                          ...productForm,
                          category_id: e.target.value,
                          subcategory_id: "",
                        });
                        if (e.target.value) {
                          fetchSubcategories(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Sélectionner</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sous-catégorie
                    </label>
                    <select
                      value={productForm.subcategory_id}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          subcategory_id: e.target.value,
                        })
                      }
                      disabled={!productForm.category_id}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    >
                      <option value="">Sélectionner</option>
                      {subcategories.map((subcat) => (
                        <option key={subcat.id} value={subcat.id}>
                          {subcat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Upload de nouvelles images pour modification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nouvelles images (jusqu'à 5 images)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />

                  {/* Preview des nouvelles images */}
                  {imagePreview.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {imagePreview.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_requires_prescription"
                    checked={productForm.requires_prescription}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        requires_prescription: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-[#02ADEE] border-gray-300 rounded focus:ring-[#02ADEE]"
                  />
                  <label
                    htmlFor="edit_requires_prescription"
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    Nécessite une ordonnance
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-[#02ADEE] text-white rounded-lg hover:bg-[#0296d1] disabled:opacity-50"
                  >
                    {loading ? "Modification..." : "Modifier le produit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyDashboard;
