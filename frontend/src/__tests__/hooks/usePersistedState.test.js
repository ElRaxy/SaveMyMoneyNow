// Archivo: frontend/src/__tests__/hooks/usePersistedState.test.js. Comentarios en espanol.
//
// Tests para usePersistedState: estado con persistencia en localStorage.
//
// Aprovechamos que jsdom expone window.localStorage en cada test. Limpiamos
// entre tests para evitar fugas de estado.
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePersistedState } from "../../hooks/usePersistedState";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePersistedState", () => {
  it("usa initialValue cuando no hay nada en storage", () => {
    const { result } = renderHook(() => usePersistedState("filtros", { q: "" }));
    expect(result.current[0]).toEqual({ q: "" });
  });

  it("escribe en localStorage cuando setState cambia el valor", () => {
    const { result } = renderHook(() => usePersistedState("filtros", { q: "" }));
    act(() => {
      result.current[1]({ q: "mercadona" });
    });
    expect(result.current[0]).toEqual({ q: "mercadona" });
    expect(JSON.parse(window.localStorage.getItem("filtros"))).toEqual({ q: "mercadona" });
  });

  it("recupera el valor persistido al volver a montar con la misma key", () => {
    window.localStorage.setItem("filtros", JSON.stringify({ q: "previo" }));
    const { result } = renderHook(() => usePersistedState("filtros", { q: "default" }));
    expect(result.current[0]).toEqual({ q: "previo" });
  });

  it("degrada a estado en memoria si setItem lanza (QuotaExceededError)", () => {
    const spy = vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      const err = new Error("QuotaExceededError");
      err.name = "QuotaExceededError";
      throw err;
    });

    const { result } = renderHook(() => usePersistedState("k", 0));
    // No debe romper aun lanzando setItem.
    expect(() => {
      act(() => {
        result.current[1](42);
      });
    }).not.toThrow();
    expect(result.current[0]).toBe(42);

    spy.mockRestore();
  });

  it("fallback a initialValue si getItem devuelve JSON corrupto", () => {
    window.localStorage.setItem("k", "{json:corrupto}");
    const { result } = renderHook(() => usePersistedState("k", "fallback"));
    expect(result.current[0]).toBe("fallback");
  });

  it("permite tipos primitivos (string, number, boolean, array)", () => {
    const a = renderHook(() => usePersistedState("a", "hola"));
    expect(a.result.current[0]).toBe("hola");

    const b = renderHook(() => usePersistedState("b", 7));
    act(() => b.result.current[1](42));
    expect(b.result.current[0]).toBe(42);

    const c = renderHook(() => usePersistedState("c", true));
    act(() => c.result.current[1](false));
    expect(c.result.current[0]).toBe(false);

    const d = renderHook(() => usePersistedState("d", []));
    act(() => d.result.current[1]([1, 2, 3]));
    expect(d.result.current[0]).toEqual([1, 2, 3]);
    expect(JSON.parse(window.localStorage.getItem("d"))).toEqual([1, 2, 3]);
  });
});
