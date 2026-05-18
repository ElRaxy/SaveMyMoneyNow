// Archivo: frontend/src/components/common/Toast.jsx. Codigo y comentarios en espanol.
//
// Sistema de notificaciones temporales tipo toast.
//
// POR QUE Context + Provider:
//   Una notificacion puede dispararse desde cualquier vista del wizard
//   (Upload, Categorization, DuplicateResolution) sin que esas vistas
//   necesiten conocer la cola de mensajes ni el contenedor visual. Es el
//   problema canonico que React Context resuelve: comunicacion entre primos
//   lejanos del arbol sin prop drilling.
//
// POR QUE auto-dismiss con setTimeout y cleanup:
//   Toasts persistentes degeneran en una pila de ruido. El patron estandar
//   (Material, Polaris) es vida util limitada (~3-4 segundos) con clear
//   timeout al desmontar para evitar memory leaks y race conditions cuando
//   el usuario navega antes de que el timer dispare.
//
// POR QUE aria-live="polite" en el contenedor (no "assertive"):
//   "polite" anuncia el mensaje al lector de pantalla cuando termine de
//   leer lo que tenga entre manos. "assertive" interrumpe al usuario y solo
//   se debe reservar para alertas criticas. Para errores recoverable usamos
//   role="alert" individual en el toast tipo error (interrumpe ese mensaje
//   concreto sin bloquear todo el sistema).
//
// POR QUE crypto.randomUUID() y no Date.now():
//   Date.now() puede colisionar si se disparan dos toasts en el mismo ms
//   (raro pero posible al hacer dispatch en cadena). randomUUID es nativo
//   en navegadores modernos y nos da unicidad real.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ToastContext = createContext(null);

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback robusto para entornos sin crypto.randomUUID (algunos webviews).
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  // Mantenemos los timers en un ref para no provocar re-renders al gestionarlos
  // y para tener acceso estable en el cleanup del useEffect global.
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    ({ message, type = "info", durationMs = 3500 }) => {
      const id = generateId();
      setToasts((prev) => [...prev, { id, message, type }]);
      const timer = setTimeout(() => removeToast(id), durationMs);
      timersRef.current.set(id, timer);
      return id;
    },
    [removeToast]
  );

  // Cleanup global: si el provider se desmonta (navegacion fuera o test),
  // limpiamos todos los timers pendientes para evitar setState sobre un
  // componente desmontado.
  useEffect(() => {
    const timersMap = timersRef.current;
    return () => {
      timersMap.forEach((timer) => clearTimeout(timer));
      timersMap.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast is-${toast.type}`}
            role={toast.type === "error" ? "alert" : "status"}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de un <ToastProvider>");
  }
  return context.showToast;
}

export default ToastProvider;
