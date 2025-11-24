import { useState, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import { Store, MapPin, Phone, Mail, Clock, FileText } from "lucide-react";

const PharmacyRegistration = () => {
  const { navigate, backendUrl } = useContext(ShopContext);
  const [loading, setLoading] = useState(false);

  const [pharmacyData, setPharmacyData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    latitude: "",
    longitude: "",
    opening_hours: {
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
      saturday: "",
      sunday: "",
    },
  });

  const [logo, setLogo] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPharmacyData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleHoursChange = (day, value) => {
    setPharmacyData((prev) => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: value,
      },
    }));
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required");
        navigate("/login");
        return;
      }

      // Validation
      if (!pharmacyData.name || !pharmacyData.address || !pharmacyData.phone) {
        toast.error("Name, address and phone are required");
        setLoading(false);
        return;
      }

      // Créer FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append("name", pharmacyData.name);
      formData.append("address", pharmacyData.address);
      formData.append("phone", pharmacyData.phone);
      formData.append("email", pharmacyData.email || "");
      formData.append("description", pharmacyData.description || "");
      formData.append("latitude", pharmacyData.latitude || "");
      formData.append("longitude", pharmacyData.longitude || "");
      formData.append(
        "opening_hours",
        JSON.stringify(pharmacyData.opening_hours)
      );

      if (logo) {
        formData.append("logo", logo);
      }

      const response = await axios.post(
        backendUrl + "/api/pharmacy/register",
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Pharmacy registered successfully!");

        // ✅ Mettre à jour les infos utilisateur dans localStorage
        const user = JSON.parse(localStorage.getItem("user"));
        user.has_pharmacy = true;
        user.pharmacy_id = response.data.pharmacy.id;
        user.pharmacy_name = response.data.pharmacy.name;
        user.pharmacy_is_verified = response.data.pharmacy.is_verified;
        localStorage.setItem("user", JSON.stringify(user));

        // ✅ Rediriger vers le dashboard pharmacien
        navigate("/dashboard");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Pharmacy registration error:", error);
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-3xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Register Your Pharmacy
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Complete your pharmacy profile to start selling on MedEx
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Pharmacy Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Pharmacy Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Store className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={pharmacyData.name}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Pharmacy Name"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Address *
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="address"
                  name="address"
                  rows="3"
                  required
                  value={pharmacyData.address}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm resize-none"
                  placeholder="Full pharmacy address"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={pharmacyData.phone}
                    onChange={handleChange}
                    className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={pharmacyData.email}
                    onChange={handleChange}
                    className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="pharmacy@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description (Optional)
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  value={pharmacyData.description}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm resize-none"
                  placeholder="Brief description of your pharmacy"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label
                htmlFor="logo"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Pharmacy Logo (Optional)
              </label>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="latitude"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Latitude (Optional)
                </label>
                <input
                  id="latitude"
                  name="latitude"
                  type="text"
                  value={pharmacyData.latitude}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="3.8480"
                />
              </div>

              <div>
                <label
                  htmlFor="longitude"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Longitude (Optional)
                </label>
                <input
                  id="longitude"
                  name="longitude"
                  type="text"
                  value={pharmacyData.longitude}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="11.5021"
                />
              </div>
            </div>

            {/* Opening Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Opening Hours (Optional)
              </label>
              <div className="space-y-2">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="grid grid-cols-3 gap-2 items-center"
                  >
                    <label className="text-sm text-gray-600 capitalize">
                      {day}
                    </label>
                    <input
                      type="text"
                      value={pharmacyData.opening_hours[day]}
                      onChange={(e) => handleHoursChange(day, e.target.value)}
                      className="col-span-2 appearance-none rounded-lg px-3 py-1 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      placeholder="08:00-18:00 or Closed"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex-1 py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : "Register Pharmacy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PharmacyRegistration;
