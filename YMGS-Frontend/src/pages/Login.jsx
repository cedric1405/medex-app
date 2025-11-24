import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ArrowRight,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  UserCircle,
  Shield,
  Loader,
} from "lucide-react";

const Login = () => {
  const [currentState, setCurrentState] = useState("Login");
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext);
  const [loading, setLoading] = useState(false);
  
  // État pour la vérification OTP (admin)
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // États pour tous les champs
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "client",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (currentState === "Sign up") {
        // Validation côté client
        if (!formData.firstName || !formData.lastName) {
          toast.error("First name and last name are required");
          setLoading(false);
          return;
        }

        if (!formData.email || !formData.password) {
          toast.error("Email and password are required");
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        const response = await axios.post(backendUrl + "/api/register", {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || null,
          address: formData.address || null,
          role: formData.role,
        });

        if (response.data.success) {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          toast.success("Account created successfully!");
        } else {
          toast.error(response.data.message);
        }
      } else {
        // Login
        if (!formData.email || !formData.password) {
          toast.error("Email and password are required");
          setLoading(false);
          return;
        }

        const response = await axios.post(backendUrl + "/api/login", {
          email: formData.email,
          password: formData.password,
        });

        if (response.data.success) {
          const user = response.data.user;
          
          // ✅ Vérifier si c'est un admin
          if (user.role === 'admin') {
            // Demander le code OTP pour l'admin
            try {
              const otpResponse = await axios.post(
                backendUrl + "/api/admin/login/request-otp",
                {
                  email: formData.email,
                  password: formData.password,
                }
              );

              if (otpResponse.data.success) {
                toast.success("Verification code sent to your email!");
                setShowOtpVerification(true);
                // Ne pas définir le token maintenant, attendre la vérification OTP
              } else {
                toast.error(otpResponse.data.message);
              }
            } catch (otpError) {
              console.error("OTP request error:", otpError);
              toast.error("Failed to send verification code");
            }
          } else {
            // Pour les non-admins, connexion normale
            setToken(response.data.token);
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            toast.success("Welcome back!");
          }
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      if (error.response) {
        toast.error(error.response.data.message || "An error occurred");
      } else {
        toast.error("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Vérifier le code OTP pour l'admin
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        backendUrl + "/api/admin/login/verify-otp",
        {
          email: formData.email,
          otp_code: otpCode,
        }
      );

      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        toast.success("Welcome back, Admin!");
        setShowOtpVerification(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error(error.response?.data?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  // Renvoyer le code OTP
  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        backendUrl + "/api/admin/login/request-otp",
        {
          email: formData.email,
          password: formData.password,
        }
      );

      if (response.data.success) {
        toast.success("New verification code sent!");
        setOtpCode("");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  // Redirection basée sur le rôle
  useEffect(() => {
    if (token) {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) {
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return;
      }

      switch (user?.role) {
        case "client":
          navigate("/");
          break;

        case "pharmacist":
          if (user.has_pharmacy === true) {
            navigate("/dashboard");
          } else {
            navigate("/pharmacy-registration");
          }
          break;

        case "delivery":
          if (user.has_delivery_profile === true) {
            navigate("/delivery");
          } else {
            navigate("/delivery-registration");
          }
          break;

        case "admin":
          navigate("/admin");
          break;

        default:
          navigate("/");
      }
    }
  }, [token, navigate]);

  // Réinitialiser le formulaire lors du changement d'état
  useEffect(() => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      role: "client",
    });
    setShowOtpVerification(false);
    setOtpCode("");
  }, [currentState]);

  // ✅ Si on affiche la vérification OTP
  if (showOtpVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Verify Your Identity
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {/* OTP Form */}
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            <div>
              <label
                htmlFor="otpCode"
                className="block text-sm font-medium text-gray-700 mb-1 text-center"
              >
                Verification Code
              </label>
              <input
                id="otpCode"
                name="otpCode"
                type="text"
                required
                maxLength="6"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="000000"
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Code sent to {formData.email}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader className="animate-spin h-5 w-5" />
              ) : (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  <span>Verify & Login</span>
                </>
              )}
            </button>

            {/* Resend Code */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium disabled:opacity-50"
              >
                Didn't receive code? Resend
              </button>
            </div>

            {/* Back Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setShowOtpVerification(false);
                  setOtpCode("");
                }}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                ← Back to login
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              <p className="text-xs text-blue-800">
                Your admin account is protected with two-factor authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Formulaire de login/signup normal
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {currentState === "Login" ? "Welcome Back!" : "Create Account"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {currentState === "Login"
              ? "Sign in to access MedEx Online Medicine"
              : "Join MedEx - Your Healthcare Partner"}
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={onSubmitHandler}>
          <div className="space-y-4">
            {/* Sign Up Fields */}
            {currentState === "Sign up" && (
              <>
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      First Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="John"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Last Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Address (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="address"
                      name="address"
                      rows="3"
                      value={formData.address}
                      onChange={handleChange}
                      className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm resize-none"
                      placeholder="Enter your full address"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    I am a *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserCircle className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="role"
                      name="role"
                      required
                      value={formData.role}
                      onChange={handleChange}
                      className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    >
                      <option value="client">Client (Customer)</option>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="delivery">Delivery Person</option>
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Select your role in the platform
                  </p>
                </div>
              </>
            )}

            {/* Email (for both Login and Sign Up) */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="john.doe@example.com"
                />
              </div>
            </div>

            {/* Password (for both Login and Sign Up) */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              {currentState === "Sign up" && (
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters
                </p>
              )}
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {currentState === "Login" ? (
                <button
                  type="button"
                  onClick={() => setCurrentState("Sign up")}
                  className="font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  Create new account
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentState("Login")}
                  className="font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  Already have an account?
                </button>
              )}
            </div>
            {currentState === "Login" && (
              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <ArrowRight
                  className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform"
                  aria-hidden="true"
                />
              </span>
              {loading
                ? "Processing..."
                : currentState === "Login"
                ? "Sign in"
                : "Create Account"}
            </button>
          </div>

          {/* Terms & Conditions (for Sign Up) */}
          {currentState === "Sign up" && (
            <p className="text-xs text-center text-gray-500">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-primary hover:text-primary-dark">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:text-primary-dark">
                Privacy Policy
              </a>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;