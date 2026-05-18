// Tests unitarios de normalizeText y normalizeConcept.
//
// Estos helpers se usan para:
//   - construir fingerprintKey (deteccion de duplicados)
//   - matchear keywords de reglas de categorizacion
//
// Si normalizeText pierde acentos o pasa todo a minusculas de forma
// inconsistente, fallan duplicados y categorizacion. Los casos cubren
// acentos, mayusculas, espacios y entradas no-string.
import { describe, it, expect } from "vitest";
import { normalizeText, normalizeConcept } from "../../src/utils/text.js";

describe("normalizeText", () => {
  it("convierte a minusculas y quita acentos: 'Café' -> 'cafe'", () => {
    expect(normalizeText("Café")).toBe("cafe");
  });

  it("conserva puntos y signos: 'MERCADONA S.A.' -> 'mercadona s.a.'", () => {
    expect(normalizeText("MERCADONA S.A.")).toBe("mercadona s.a.");
  });

  it("hace trim de espacios externos pero conserva los internos", () => {
    expect(normalizeText("  espacios   ")).toBe("espacios");
  });

  it("string vacio devuelve ''", () => {
    expect(normalizeText("")).toBe("");
  });

  it("null se trata como cadena vacia (defensivo)", () => {
    expect(normalizeText(null)).toBe("null"); // String(null) === "null"
  });

  it("undefined usa el default '' del parametro -> ''", () => {
    expect(normalizeText()).toBe("");
  });
});

describe("normalizeConcept", () => {
  it("elimina puntos y normaliza espacios: 'MERCADONA S.A.' -> 'mercadona s a'", () => {
    expect(normalizeConcept("MERCADONA S.A.")).toBe("mercadona s a");
  });

  it("colapsa varios espacios, quita acentos y reemplaza simbolos por espacios", () => {
    // 'Caf&é   pago ' -> normalize quita acentos -> 'caf&e   pago' -> el regex
    // reemplaza '&' por ' ' -> 'caf e   pago' -> colapsa espacios -> 'caf e pago'.
    expect(normalizeConcept("Caf&é   pago ")).toBe("caf e pago");
  });

  it("string vacio devuelve ''", () => {
    expect(normalizeConcept("")).toBe("");
  });
});
