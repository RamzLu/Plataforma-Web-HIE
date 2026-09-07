import axios from "axios";

// Instancia base de Axios
const api = axios.create({
  // En producción, esto debería apuntar a import.meta.env.VITE_API_URL
  baseURL: "http://localhost:3000/api",
  timeout: 15000, // Tiempo de espera máximo de 15 segundos
});

// INTERCEPTOR: Se ejecuta ANTES de que cualquier petición salga al backend
api.interceptors.request.use(
  (config) => {
    // Aquí es donde inyectarás el token de Keycloak en el futuro para proteger el CMS
    // const token = localStorage.getItem("keycloak_token"); // O de donde saques el token
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;