import { useEffect, useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import axios from "axios";
import { ShoppingCart, Trash2, Plus, Minus, Loader2 } from "lucide-react";

const Cart = () => {
  const { currency, navigate, token, backendUrl } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);

  // Récupérer le panier depuis le backend
  const fetchCart = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(backendUrl + "/api/cart", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.data.success) {
        const cart = response.data.cart;
        setCartData(cart.items || []);
        setCartTotal(cart.total_amount || 0);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      if (error.response?.status !== 401) {
        toast.error("Failed to load cart");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  // Mettre à jour la quantité
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    try {
      setUpdating(true);
      const response = await axios.put(
        `${backendUrl}/api/cart/item/${itemId}`,
        { quantity: newQuantity },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.data.success) {
        await fetchCart();
        toast.success("Cart updated");
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      toast.error(error.response?.data?.error || "Failed to update cart");
    } finally {
      setUpdating(false);
    }
  };

  // Supprimer du panier
  const removeFromCart = async (itemId) => {
    try {
      setUpdating(true);
      const response = await axios.delete(
        `${backendUrl}/api/cart/item/${itemId}`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.data.success) {
        await fetchCart();
        toast.success("Item removed from cart");
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Failed to remove item");
    } finally {
      setUpdating(false);
    }
  };

  // Vider le panier
  const clearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your cart?")) {
      return;
    }

    try {
      setUpdating(true);
      const response = await axios.delete(`${backendUrl}/api/cart/clear`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.data.success) {
        await fetchCart();
        toast.success("Cart cleared");
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart");
    } finally {
      setUpdating(false);
    }
  };

  const proceedToPayment = () => {
    if (token) {
      navigate("/place-order");
    } else {
      toast.info("Please login to continue");
      navigate("/login");
    }
  };

  // Empty cart component
  const EmptyCart = () => (
    <div className="flex flex-col items-center justify-center py-20 dark:text-gray-200">
      <ShoppingCart className="w-24 h-24 text-gray-400 mb-4" />
      <h2 className="text-2xl font-medium text-gray-600 dark:text-gray-300 mb-4">
        Your Cart is Empty
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Looks like you haven&apos;t added anything to your cart yet
      </p>
      <button
        onClick={() => navigate("/collection")}
        className="bg-[#02ADEE] text-white px-8 py-3 text-sm hover:bg-[#0296d1] rounded-lg"
      >
        SHOP NOW
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen dark:bg-gray-900">
        <Loader2 className="w-12 h-12 animate-spin text-[#02ADEE]" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="border-t dark:border-gray-700 pt-14 dark:bg-gray-800">
        <div className="text-center py-20">
          <h2 className="text-2xl font-medium text-gray-600 dark:text-gray-300 mb-4">
            Please Login
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            You need to be logged in to view your cart
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-[#02ADEE] text-white px-8 py-3 text-sm hover:bg-[#0296d1] rounded-lg"
          >
            LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t dark:border-gray-700 pt-14 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <Title text1={"YOUR"} text2={"CART"} />
          {cartData.length > 0 && (
            <button
              onClick={clearCart}
              disabled={updating}
              className="text-red-500 hover:text-red-600 flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
              Clear Cart
            </button>
          )}
        </div>

        {cartData.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            <div className="space-y-4">
              {cartData.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <Link to={`/product/${item.medicine}`}>
                      <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1">
                      <Link to={`/product/${item.medicine}`}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-[#02ADEE]">
                          {item.product_name}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.pharmacy_name}
                      </p>
                      <p className="text-lg font-bold text-[#02ADEE] mt-2">
                        {currency}
                        {item.selected_price}
                      </p>
                      {item.is_package && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2 inline-block">
                          Package Price
                        </span>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={updating || item.quantity <= 1}
                          className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <span className="text-lg font-semibold w-12 text-center dark:text-white">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={
                            updating || item.quantity >= item.stock_available
                          }
                          className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          disabled={updating}
                          className="ml-auto text-red-500 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Subtotal
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {currency}
                        {item.subtotal}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end my-20">
              <div className="w-full sm:w-[450px]">
                <CartTotal totalAmount={cartTotal} />
                <div className="w-full text-end">
                  <button
                    onClick={proceedToPayment}
                    disabled={updating}
                    className="bg-[#02ADEE] text-white text-sm my-8 px-8 py-3 rounded-lg hover:bg-[#0296d1] disabled:opacity-50"
                  >
                    PROCEED TO PAYMENT
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
