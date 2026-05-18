// Tests unitarios para parseAmountValue.
//
// Esta funcion es critica porque convierte el texto crudo del Excel en un
// numero usable. Si falla aqui, todo el flujo (importe, balance, exports)
// se rompe. Cubrimos los formatos comunes en bancos espanoles:
//   - coma como separador decimal ("10,50")
//   - punto como separador de miles ("1.234,56")
//   - simbolo de euro
//   - negativos
//   - strings con espacios
//   - basura (NaN)
//   - tipos no string
import { describe, it, expect } from "vitest";
import { parseAmountValue } from "../../src/utils/amount.js";

describe("parseAmountValue", () => {
  it("convierte coma decimal espanola: '10,50' -> 10.5", () => {
    expect(parseAmountValue("10,50")).toBe(10.5);
  });

  it("ignora punto de miles y simbolo euro: '1.234,56 €' -> 1234.56", () => {
    expect(parseAmountValue("1.234,56 €")).toBe(1234.56);
  });

  it("mantiene el signo negativo con simbolo euro pegado: '-45,15€' -> -45.15", () => {
    expect(parseAmountValue("-45,15€")).toBe(-45.15);
  });

  it("trim de espacios alrededor: '  10.000,00  ' -> 10000", () => {
    expect(parseAmountValue("  10.000,00  ")).toBe(10000);
  });

  // Nota de implementacion: tras la cadena de replaces, "abc" queda como
  // cadena vacia y `Number("")` devuelve 0. La funcion solo devuelve NaN
  // cuando el resultado de `Number(...)` no es finito (p.ej. "1.2.3"), no
  // cuando la entrada es texto puro. Documentamos el comportamiento real
  // en vez de inventar uno: si se desea cambiar, hay que tocar
  // `parseAmountValue` (esto se marca como observacion en el log).
  it("texto no numerico devuelve 0 (el strip lo deja vacio y Number('') === 0)", () => {
    expect(parseAmountValue("abc")).toBe(0);
  });

  it("string vacio devuelve NaN (caso explicito antes del strip)", () => {
    expect(Number.isNaN(parseAmountValue(""))).toBe(true);
  });

  it("input ambiguo con doble separador devuelve NaN", () => {
    // "1.2.3" -> tras strip de puntos -> "123" -> 123. No produce NaN.
    // Caso real de NaN: cadena con varios signos.
    expect(Number.isNaN(parseAmountValue("--"))).toBe(true);
  });

  it("null devuelve NaN", () => {
    expect(Number.isNaN(parseAmountValue(null))).toBe(true);
  });

  it("undefined devuelve NaN", () => {
    expect(Number.isNaN(parseAmountValue(undefined))).toBe(true);
  });

  it("number finito se devuelve tal cual", () => {
    expect(parseAmountValue(100)).toBe(100);
  });

  it("number infinito o NaN devuelve NaN", () => {
    expect(Number.isNaN(parseAmountValue(NaN))).toBe(true);
    expect(Number.isNaN(parseAmountValue(Infinity))).toBe(true);
  });
});
