import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { Bell, User, Settings, LogOut } from "lucide-react";
import { toast } from "react-toastify";
import ThemeSwitcher from "./ThemeSwitcher";

const DashboardHeader = ({ title = "Dashboard MedEx Pharmacy" }) => {
  const { setToken, setCartItems } = useContext(ShopContext);
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setCartItems({});
    toast.success("Déconnexion réussie");
    navigate("/login");
  };

  const handleAccountSettings = () => {
    navigate("/account-settings");
    setShowProfileMenu(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />

            <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 bg-[#02ADEE] rounded-full flex items-center justify-center text-white hover:bg-[#0296d1] transition-colors"
              >
                <User className="w-6 h-6" />
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />

                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-2 z-50">
                    <button
                      onClick={handleAccountSettings}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                      <span>Paramètres du compte</span>
                    </button>

                    <hr className="my-2 border-gray-200 dark:border-gray-600" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
