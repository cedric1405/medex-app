import { Routes, Route, useLocation } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import PlaceOrder from "./pages/PlaceOrder";
import GuestCheckout from "./pages/GuestCheckout";
import Orders from "./pages/Orders";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import NavBar from "./components/Navbar";
import WhatsAppButton from "./components/WhatsAppButton";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import { ToastContainer } from "react-toastify";
import Verify from "./pages/Verify";
import Policy from "./pages/Policy";
import PharmacyDashboard from "./pages/PharmacyDashboard";
import PharmacyRegistration from "./pages/PharmacyRegistration";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  const location = useLocation();

  // Liste des routes dashboard (sans NavBar, SearchBar, Footer)
  const dashboardRoutes = ["/dashboard", "/delivery", "/admin"];

  // Vérifier si on est sur une page dashboard
  const isDashboardPage = dashboardRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  return (
    <div className="bg-white dark:bg-white-300 transition-colors font-sans">
      <ScrollToTop />
      <ToastContainer position="bottom-right" autoClose={2000} />

      {/* NavBar ne s'affiche PAS sur les pages dashboard */}
      {!isDashboardPage && <NavBar />}

      <div
        className={
          !isDashboardPage
            ? "px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] pt-20"
            : ""
        }
      >
        {/* SearchBar ne s'affiche PAS sur les pages dashboard */}
        {!isDashboardPage && <SearchBar />}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Collection />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/product/:productId" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/place-order" element={<PlaceOrder />} />
          <Route path="/guest-checkout" element={<GuestCheckout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blog/:id" element={<BlogDetail />} />

          {/* Pharmacy Registration - Protected */}
          <Route
            path="/pharmacy-registration"
            element={
              <ProtectedRoute requiredRole="pharmacist">
                <PharmacyRegistration />
              </ProtectedRoute>
            }
          />

          {/* Pharmacy Dashboard - Requires Profile */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="pharmacist" requiresProfile={true}>
                <PharmacyDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Dashboard - Protected */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Delivery Dashboard - Requires Profile 
          <Route
            path="/delivery"
            element={
              <ProtectedRoute requiredRole="delivery" requiresProfile={true}>
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />*/}
        </Routes>
      </div>

      {/* WhatsAppButton et Footer ne s'affichent PAS sur les pages dashboard */}
      {!isDashboardPage && (
        <div className="fixed bottom-4 right-4">
          <WhatsAppButton />
        </div>
      )}

      {!isDashboardPage && <Footer />}
    </div>
  );
};

export default App;
