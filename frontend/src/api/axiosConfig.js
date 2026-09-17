import axios from "axios";

const api = axios.create({
baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 15000, 
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;