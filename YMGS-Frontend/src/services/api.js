import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post("/register", data),
  login: (data) => api.post("/login", data),
  logout: () => api.post("/logout"),
  getProfile: () => api.get("/profile"),
};

export const cartAPI = {
  getCart: () => api.get("/cart/"),
  addToCart: (data) => api.post("/cart/add/", data),
  updateItem: (itemId, data) => api.put(`/cart/update/${itemId}/`, data),
  removeItem: (itemId) => api.delete(`/cart/remove/${itemId}/`),
  clearCart: () => api.delete("/cart/clear/"),
  getSummary: () => api.get("/cart/summary/"),
};

export const productAPI = {
  getList: (params) => api.post("/product/user/list", params),
  getDetail: (id) => api.get(`/product/${id}/`),
};
