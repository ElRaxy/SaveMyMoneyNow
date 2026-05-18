// Archivo: frontend\src\hooks\usePersistedState.js. Codigo y comentarios en espanol.
//
// Hook: wrap de useState con sincronizacion a localStorage por una `key`.
//
// POR QUE existe este hook:
//   - Resiliencia a refresh: el usuario no quiere perder sus filtros cada vez
//     que recarga la pagina. Persistir en localStorage es el patron mas barato
//     (no hay que tocar backend ni cookies) y mas explicito.
//   - Separation of concerns: las views no deben acordarse de "ah, ademas de
//     setState tengo que sincronizar con localStorage y leer al montar". Ese
//     boilerplate se encapsula aqui; las views solo cambian useState por
//     usePersistedState y siguen tratandolo como estado normal.
//
// POR QUE try/catch alrededor del localStorage:
//   - El storage puede estar deshabilitado (modo privado en algunos navegadores
//     antiguos, configuraciones corporativas) o lleno (QuotaExceededError).
//     En ese caso degradamos a useState normal: la app sigue funcionando, solo
//     pierde la persistencia. Romper toda la view porque no podemos escribir
//     un filtro a disco seria un fallo de UX desproporcionado.
//
// POR QUE leemos lazy con la funcion inicializadora de useState:
//   - useState(fn) ejecuta `fn` solo en el primer render. Si pasaramos el valor
//     directamente, JSON.parse correria en cada render aunque no se use.
//
// POR QUE NO escuchamos el evento `storage`:
//   - Ese evento solo dispara cuando el storage cambia en OTRA pestana. Para
//     este caso de uso (filtros locales por sesion) anadiria complejidad sin
//     beneficio claro. Si en el futuro queremos sync cross-tab, se anade aqui.
import { useState, useEffect, useRef } from "react";

const readFromStorage = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    // Ej: JSON corrupto de una version anterior, o storage bloqueado.
    return fallback;
  }
};

const writeToStorage = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // QuotaExceededError o storage deshabilitado: ignoramos silenciosamente.
    // La app sigue funcionando con el estado en memoria.
  }
};

export function usePersistedState(key, initialValue) {
  // Guardamos la key en un ref para detectar cambios y reaccionar. En la
  // practica casi siempre es constante por componente, pero protegerlo evita
  // bugs si alguien la pasa dinamica.
  const keyRef = useRef(key);

  const [value, setValue] = useState(() => readFromStorage(key, initialValue));

  useEffect(() => {
    // Si la key cambia, releemos. Caso raro pero correcto.
    if (keyRef.current !== key) {
      keyRef.current = key;
      setValue(readFromStorage(key, initialValue));
      return;
    }
    writeToStorage(key, value);
    // No incluimos `initialValue` en deps a proposito: queremos que cambios
    // de la referencia de initialValue (objetos nuevos en cada render) no
    // disparen escrituras innecesarias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value]);

  return [value, setValue];
}

export default usePersistedState;
