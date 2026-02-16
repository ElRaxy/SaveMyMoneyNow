// Cliente HTTP compartido con logs de peticion/respuesta para frontend.
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api"
});

apiClient.interceptors.request.use(
  (config) => {
    const metodo = String(config.method || "GET").toUpperCase();
    console.info(`[Frontend][API] -> ${metodo} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("[Frontend][API] Error antes de enviar peticion:", error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const metodo = String(response.config?.method || "GET").toUpperCase();
    console.info(`[Frontend][API] <- ${metodo} ${response.config?.url} (${response.status})`);
    return response;
  },
  (error) => {
    const metodo = String(error.config?.method || "GET").toUpperCase();
    const url = error.config?.url || "URL desconocida";
    const status = error.response?.status || "sin estado";
    console.error(`[Frontend][API] <- ${metodo} ${url} (${status})`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
