// Archivo: frontend\src\services\apiClient.js
//
// Cliente HTTP compartido. Anade interceptores de log de peticion y
// respuesta para facilitar la depuracion durante el desarrollo del wizard.
// Los logs SOLO se emiten en modo desarrollo (Vite expone import.meta.env.DEV)
// para no contaminar la consola en produccion ni filtrar URLs internas.
import axios from "axios";

const IS_DEV = Boolean(import.meta.env?.DEV);

const logInfo = (...args) => {
  if (IS_DEV) console.info(...args);
};

const logError = (...args) => {
  if (IS_DEV) console.error(...args);
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api"
});

apiClient.interceptors.request.use(
  (config) => {
    const metodo = String(config.method || "GET").toUpperCase();
    logInfo(`[Frontend][API] -> ${metodo} ${config.url}`);
    return config;
  },
  (error) => {
    logError("[Frontend][API] Error antes de enviar peticion:", error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const metodo = String(response.config?.method || "GET").toUpperCase();
    logInfo(`[Frontend][API] <- ${metodo} ${response.config?.url} (${response.status})`);
    return response;
  },
  (error) => {
    const metodo = String(error.config?.method || "GET").toUpperCase();
    const url = error.config?.url || "URL desconocida";
    const status = error.response?.status || "sin estado";
    logError(`[Frontend][API] <- ${metodo} ${url} (${status})`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
