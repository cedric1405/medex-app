import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import {
  Star,
  StarHalf,
  Loader2,
  AlertTriangle,
  Store,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
} from "lucide-react";
import RelatedProducts from "../components/RelatedProducts";
import axios from "axios";
import { toast } from "react-toastify";

const Product = () => {
  const { productId } = useParams();
  const { currency, addToCart, backendUrl } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [image, setImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedQuantityPrice, setSelectedQuantityPrice] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const navigate = useNavigate();

  const fetchProductData = async () => {
    if (!productId) {
      setError("No product ID provided");
      setLoading(false);
      return;
    }

    console.log("🔍 Fetching product ID:", productId);

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${backendUrl}/api/product/${productId}/`
      );

      console.log("✅ Response received:", response.data);

      if (response.data.success && response.data.product) {
        const product = response.data.product;
        setProductData(product);

        if (product.image && product.image.length > 0) {
          setImage(product.image[0]);
        }

        if (product.quantity_price_list) {
          let priceList;

          if (typeof product.quantity_price_list === "string") {
            try {
              priceList = JSON.parse(product.quantity_price_list);
            } catch (error) {
              console.error("❌ Error parsing quantity price list:", error);
              priceList = [];
            }
          } else if (Array.isArray(product.quantity_price_list)) {
            priceList = product.quantity_price_list;
          } else {
            priceList = [];
          }

          if (priceList.length > 0) {
            const smallestPackage = priceList.reduce(
              (min, current) =>
                parseInt(current.quantity) < parseInt(min.quantity)
                  ? current
                  : min,
              priceList[0]
            );
            setSelectedQuantityPrice(smallestPackage);
            setQuantity(parseInt(smallestPackage.quantity));
          }
        } else if (
          product.min_order_quantity &&
          product.min_order_quantity > 1
        ) {
          setQuantity(product.min_order_quantity);
        }
      } else {
        setError("Product not found");
        toast.error("Product not found");
      }
    } catch (error) {
      console.error("❌ Error fetching product:", error);

      if (error.response?.status === 404) {
        setError("Product not found");
        toast.error("Product not found");
      } else {
        setError("Error loading product. Please try again later.");
        toast.error("Error loading product");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!productId) {
      setError("No product ID provided");
      setLoading(false);
      return;
    }

    window.scrollTo(0, 0);
    fetchProductData();
  }, [productId]);

  const handleIncreaseQuantity = () => {
    if (selectedQuantityPrice) return;
    if (productData?.stock_quantity && quantity >= productData.stock_quantity) {
      toast.warning("Maximum stock reached");
      return;
    }
    setQuantity((prev) => prev + 1);
  };

  const handleDecreaseQuantity = () => {
    if (selectedQuantityPrice) return;
    const minQuantity = productData?.min_order_quantity || 1;
    if (quantity > minQuantity) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleQuantityPriceSelect = (qp) => {
    setSelectedQuantityPrice(qp);
    setQuantity(parseInt(qp.quantity));
  };

  const getCurrentPrice = () => {
    if (selectedQuantityPrice) return selectedQuantityPrice.price;
    return productData?.price || 0;
  };

  const getParsedQuantityPriceList = () => {
    if (!productData?.quantity_price_list) return [];
    try {
      if (typeof productData.quantity_price_list === "string") {
        return JSON.parse(productData.quantity_price_list);
      } else if (Array.isArray(productData.quantity_price_list)) {
        return productData.quantity_price_list;
      }
    } catch (error) {
      console.error("❌ Error parsing quantity price list:", error);
    }
    return [];
  };

  const handleAddToCart = async () => {
    if (!productData) return;

    if (!productData.stock_quantity || productData.stock_quantity < quantity) {
      toast.error("Insufficient stock");
      return;
    }

    try {
      setAddingToCart(true);

      // Préparer les données du panier
      const cartData = {
        quantity: quantity,
        selectedPrice: selectedQuantityPrice
          ? parseFloat(selectedQuantityPrice.price)
          : parseFloat(productData.price),
        isPackage: selectedQuantityPrice !== null,
        packageDetails: selectedQuantityPrice
          ? {
              quantity: selectedQuantityPrice.quantity,
              price: selectedQuantityPrice.price,
            }
          : {},
      };

      console.log("📦 Adding to cart:", {
        itemId: productData.id,
        cartData,
      });

      // Appeler la fonction addToCart du contexte
      const success = await addToCart(productData.id, cartData);

      if (success) {
        toast.success(`${productData.name} added to cart!`);
      }
    } catch (error) {
      console.error("❌ Error adding to cart:", error);
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!productData) return;

    if (!productData.stock_quantity || productData.stock_quantity < quantity) {
      toast.error("Insufficient stock");
      return;
    }

    try {
      setAddingToCart(true);

      const cartData = {
        quantity: quantity,
        selectedPrice: selectedQuantityPrice
          ? parseFloat(selectedQuantityPrice.price)
          : parseFloat(productData.price),
        isPackage: selectedQuantityPrice !== null,
      };

      await addToCart(productData.id, cartData);
      navigate("/cart");
    } catch (error) {
      console.error("❌ Error in buy now:", error);
      toast.error("Failed to process order");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500 dark:text-gray-300" />
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="text-center p-10 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            {error || "Product not found"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The product you're looking for may have been removed or is no longer
            available.
          </p>
          <button
            onClick={() => navigate("/collection")}
            className="px-6 py-2 bg-[#02ADEE] text-white hover:bg-[#0298d4] dark:bg-[#02ADEE] dark:text-gray-800 rounded"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100 dark:bg-gray-900 dark:border-gray-700">
      <div className="flex gap-12 sm:gap-12 flex-col lg:flex-row">
        {/* Images */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:w-[18.7%] w-full">
            {productData.image && productData.image.length > 0 ? (
              productData.image.map((item, index) => (
                <img
                  onClick={() => setImage(item)}
                  src={item}
                  key={index}
                  className={`w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer border-2 rounded ${
                    image === item
                      ? "border-[#02ADEE] dark:border-yellow-400"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  alt={`${productData.name} - Image ${index + 1}`}
                />
              ))
            ) : (
              <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded">
                <p className="text-gray-500 dark:text-gray-400">No image</p>
              </div>
            )}
          </div>
          <div className="w-full sm:w-[80%]">
            {image ? (
              <img
                className="w-full h-auto rounded-lg"
                src={image}
                alt={productData.name}
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  No image available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Informations */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2 dark:text-white">
            {productData.name}
          </h1>

          {/* Carte Pharmacie */}
          {productData.pharmacy_name && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <Store className="w-5 h-5 text-[#02ADEE] dark:text-yellow-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg dark:text-white flex items-center gap-2">
                    {productData.pharmacy_name}
                    {productData.pharmacy_is_open !== undefined &&
                      (productData.pharmacy_is_open ? (
                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                          Open
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded">
                          Closed
                        </span>
                      ))}
                  </h3>

                  {productData.pharmacy_address && (
                    <div className="flex items-start gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{productData.pharmacy_address}</span>
                    </div>
                  )}

                  {productData.pharmacy_phone && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <a
                        href={`tel:${productData.pharmacy_phone}`}
                        className="hover:text-[#02ADEE] dark:hover:text-yellow-400"
                      >
                        {productData.pharmacy_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stock et disponibilité */}
          <div className="mt-4 flex items-center gap-4">
            {productData.stock_quantity !== undefined && (
              <div className="flex items-center gap-2">
                {productData.stock_quantity > 0 ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      In Stock ({productData.stock_quantity} available)
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                      Out of Stock
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Avis */}
          <div className="flex items-center gap-1 mt-3">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <StarHalf className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <p className="pl-2 dark:text-gray-300 text-sm">
              ({productData.pharmacy_rating || "4.5"} stars)
            </p>
          </div>

          {/* Prix */}
          <p className="mt-5 text-3xl font-bold text-[#02ADEE] dark:text-yellow-400">
            {currency}
            {getCurrentPrice()}
          </p>

          {/* Packages */}
          {productData.quantity_price_list &&
            getParsedQuantityPriceList().length > 0 && (
              <div className="my-6">
                <p className="text-gray-600 dark:text-gray-300 mb-3 font-medium">
                  Select Quantity Package:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {getParsedQuantityPriceList().map((qp, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuantityPriceSelect(qp)}
                      className={`p-3 border rounded-lg transition-all ${
                        selectedQuantityPrice &&
                        selectedQuantityPrice.quantity === qp.quantity
                          ? "border-[#02ADEE] dark:border-yellow-400 bg-[#02ADEE] dark:bg-yellow-400 text-white dark:text-gray-800 font-medium"
                          : "border-gray-300 dark:border-gray-600 hover:border-[#02ADEE] dark:hover:border-yellow-400 dark:text-gray-300"
                      }`}
                    >
                      <div className="text-sm">
                        <div className="font-medium">{qp.quantity} units</div>
                        <div>
                          {currency}
                          {qp.price}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Quantité manuelle */}
          {!selectedQuantityPrice && (
            <div className="flex items-center gap-4 mb-4 my-8">
              <span className="text-gray-600 dark:text-gray-300 font-medium">
                Quantity:
              </span>
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={handleDecreaseQuantity}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition"
                  disabled={quantity <= (productData.min_order_quantity || 1)}
                >
                  -
                </button>
                <span className="px-6 py-2 dark:text-white font-medium bg-gray-50 dark:bg-gray-800">
                  {quantity}
                </span>
                <button
                  onClick={handleIncreaseQuantity}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition"
                  disabled={
                    productData.stock_quantity &&
                    quantity >= productData.stock_quantity
                  }
                >
                  +
                </button>
              </div>
              {productData.stock_quantity && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Max: {productData.stock_quantity}
                </span>
              )}
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-4 my-6">
            <button
              onClick={handleAddToCart}
              disabled={
                addingToCart ||
                !productData.stock_quantity ||
                productData.stock_quantity === 0
              }
              className="bg-[#02ADEE] text-white px-8 py-3 text-sm font-medium rounded-lg hover:bg-[#0298d4] active:bg-gray-700 dark:bg-[#02ADEE] dark:text-gray-800 dark:hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingToCart ? "ADDING..." : "ADD TO CART"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={
                addingToCart ||
                !productData.stock_quantity ||
                productData.stock_quantity === 0
              }
              className="bg-green-600 text-white px-8 py-3 text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 dark:bg-green-600 dark:hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingToCart ? "PROCESSING..." : "BUY NOW"}
            </button>
          </div>

          {/* Description */}
          <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2 dark:text-white">Description</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {productData.description || "No description available."}
            </p>
          </div>

          <hr className="mt-8 dark:border-gray-700" />

          {/* Garanties */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-5 flex flex-col gap-2">
            <p className="flex items-center gap-2">
              <span className="text-green-500">✓</span> All Meds are FDA
              Approved
            </p>
            <p className="flex items-center gap-2">
              <span className="text-green-500">✓</span> 100% Refund Guarantee
            </p>
            <p className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Fast Delivery
            </p>
          </div>
        </div>
      </div>

      {/* Produits liés */}
      {productData?.subcategory_name && (
        <RelatedProducts
          category={productData.category_name}
          subCategory={productData.subcategory_name}
        />
      )}
    </div>
  );
};

export default Product;
