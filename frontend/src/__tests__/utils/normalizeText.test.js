// Archivo: frontend/src/__tests__/utils/normalizeText.test.js. Comentarios en espanol.
//
// Tests para normalizeText: quita diacriticos, lower-case y trim.
import { describe, it, expect } from "vitest";
import { normalizeText } from "../../utils/normalizeText";

describe("normalizeText", () => {
  it("quita tildes en letras minusculas (café → cafe)", () => {
    expect(normalizeText("Café")).toBe("cafe");
  });

  it("convierte a minusculas conservando puntuacion", () => {
    expect(normalizeText("MERCADONA S.A.")).toBe("mercadona s.a.");
  });

  it("hace trim de espacios alrededor", () => {
    expect(normalizeText("  espacios  ")).toBe("espacios");
  });

  it("devuelve string vacio para input vacio", () => {
    expect(normalizeText("")).toBe("");
  });

  it("usa el default '' cuando se llama sin argumento", () => {
    // La firma es (value = ""), asi que undefined explicito tambien aplica
    // el default.
    expect(normalizeText()).toBe("");
    expect(normalizeText(undefined)).toBe("");
  });

  it("convierte null a 'null' string (String() coerce)", () => {
    // String(null) === "null". Es comportamiento documentado: el caller deberia
    // pasar undefined si no hay valor, pero blindamos para que no rompa.
    expect(normalizeText(null)).toBe("null");
  });

  it("quita multiples diacriticos (vocales + n)", () => {
    expect(normalizeText("ÁÉÍÓÚñÑüÜ")).toBe("aeiounnuu");
  });

  it("no altera caracteres ya ASCII", () => {
    expect(normalizeText("hola mundo 123")).toBe("hola mundo 123");
  });
});
