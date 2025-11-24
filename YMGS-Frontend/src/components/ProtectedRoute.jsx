import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const ProtectedRoute = ({ children, requiredRole, requiresProfile }) => {
  const { token } = useContext(ShopContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler un petit délai pour vérifier l'authentification
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur est connecté
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Vérifier le rôle si requis
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Vérifier le profil pour pharmacien
  if (requiresProfile && user.role === "pharmacist") {
    if (!user.has_pharmacy) {
      return <Navigate to="/pharmacy-registration" replace />;
    }
  }

  // Vérifier le profil pour livreur
  if (requiresProfile && user.role === "delivery") {
    if (!user.has_delivery_profile) {
      return <Navigate to="/delivery-registration" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
