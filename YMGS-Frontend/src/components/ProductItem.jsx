import { useContext } from "react";
import PropTypes from "prop-types";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import { MapPin, Store } from "lucide-react";

const ProductItem = ({
  id = null,
  image = [],
  name,
  price,
  quantity_price_list = null,
  bestseller = false,
  pharmacy_name,
  pharmacy_address,
  pharmacy_is_open,
  stock_quantity,
}) => {
  const { currency } = useContext(ShopContext);

  // Get the lowest price from quantity price list if available
  const getDisplayPrice = () => {
    if (!quantity_price_list) {
      return { price, displayText: price };
    }

    try {
      const priceList =
        typeof quantity_price_list === "string"
          ? JSON.parse(quantity_price_list)
          : quantity_price_list;

      if (Array.isArray(priceList) && priceList.length > 0) {
        const lowestPriceOption = priceList.reduce(
          (min, current) =>
            parseFloat(current.price) < parseFloat(min.price) ? current : min,
          priceList[0]
        );

        return {
          price: lowestPriceOption.price,
          displayText: `${lowestPriceOption.price}`,
          quantity: lowestPriceOption.quantity,
        };
      }
    } catch (error) {
      console.error("Error parsing quantity price list:", error);
    }

    return { price, displayText: price };
  };

  const displayPrice = getDisplayPrice();

  // Gérer les images manquantes
  const getImageSrc = () => {
    if (Array.isArray(image) && image.length > 0) {
      return image[0];
    }
    if (typeof image === "string" && image) {
      return image;
    }
    return "/assets/paracetamol.jpeg";
  };

  const handleClick = (e) => {
    if (!id || id === undefined || id === null || id === "") {
      e.preventDefault();
      console.error("❌ Product ID is missing or invalid:", {
        id,
        name,
        fullProduct: { id, image, name, price },
      });
      alert(`Impossible d'afficher ce produit. ID manquant pour: ${name}`);
      return;
    }
    console.log("✅ Navigating to product:", id, name);
  };

  // Si pas d'ID, afficher le produit mais désactiver le clic
  if (!id || id === undefined || id === null || id === "") {
    return (
      <div className="text-gray-700 dark:text-gray-300 opacity-50 cursor-not-allowed">
        <div className="overflow-hidden rounded-lg relative">
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-10">
            ID Missing
          </div>

          <img
            className="w-full h-auto"
            src={getImageSrc()}
            alt={name || "Product"}
          />
        </div>

        <div className="pt-3 pb-1">
          <p className="text-sm text-center line-clamp-2 min-h-[40px]">
            {name || "Unnamed Product"}
          </p>

          <div className="text-center mt-2">
            <p className="text-sm font-medium dark:text-white">
              {currency}
              {displayPrice.displayText}
            </p>
            <p className="text-xs text-red-500 mt-1">Product unavailable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      className="text-gray-700 dark:text-gray-300 cursor-pointer group"
      to={`/product/${id}`}
      onClick={handleClick}
    >
      <div className="overflow-hidden rounded-lg relative shadow-sm hover:shadow-md transition-shadow">
        {/* Badges en haut */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {bestseller && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
              Bestseller
            </span>
          )}
          {pharmacy_is_open !== undefined && (
            <span
              className={`${
                pharmacy_is_open ? "bg-green-500" : "bg-gray-500"
              } text-white text-xs px-2 py-1 rounded`}
            >
              {pharmacy_is_open ? "Open" : "Closed"}
            </span>
          )}
        </div>

        {/* Stock badge */}
        {stock_quantity !== undefined &&
          stock_quantity < 10 &&
          stock_quantity > 0 && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded z-10">
              Only {stock_quantity} left
            </div>
          )}

        <img
          className="hover:scale-110 transition ease-in-out duration-300 w-full h-auto"
          src={getImageSrc()}
          alt={name || "Product"}
         
        />
      </div>

      <div className="pt-3 pb-1">
        {/* Nom du produit */}
        <p className="text-sm text-center line-clamp-2 min-h-[40px] group-hover:text-[#02ADEE] dark:group-hover:text-yellow-400 transition font-medium">
          {name || "Unnamed Product"}
        </p>

        {/* Prix */}
        <div className="text-center mt-2">
          <p className="text-sm font-bold dark:text-white">
            {currency}
            {displayPrice.displayText}
          </p>

          {displayPrice.quantity && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Starting from {displayPrice.quantity} units
            </p>
          )}
        </div>

        {/* ✅ Informations Pharmacie */}
        {pharmacy_name && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <Store className="w-3 h-3" />
              <span className="font-medium truncate">{pharmacy_name}</span>
            </div>

            {pharmacy_address && (
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-500 mt-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {pharmacy_address.split(",")[0]}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hover effect */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center mt-2">
        <button className="text-xs text-[#02ADEE] dark:text-yellow-400 font-medium">
          View Details →
        </button>
      </div>
    </Link>
  );
};

ProductItem.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  image: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  name: PropTypes.string.isRequired,
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  quantity_price_list: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  bestseller: PropTypes.bool,
  pharmacy_name: PropTypes.string,
  pharmacy_address: PropTypes.string,
  pharmacy_is_open: PropTypes.bool,
  stock_quantity: PropTypes.number,
};

export default ProductItem;
