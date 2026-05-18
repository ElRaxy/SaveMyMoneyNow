// Archivo: frontend/src/__tests__/utils/formatAmount.test.js. Comentarios en espanol.
//
// Tests para formatAmount: contrato con Intl.NumberFormat("es-ES", EUR).
//
// Notas sobre output Intl:
//   - El separador decimal en es-ES es coma.
//   - El simbolo del euro va al final separado por NBSP ( ).
//   - Para >=10.000 aparece separador de miles (punto).
//   - Para 1.234,56 NO aparece separador (no llega a 5 digitos enteros).
//
// Usamos toMatch con regex para tolerar la naturaleza del NBSP/espacio
// (Intl puede emitir U+00A0 o U+202F segun version de ICU). Asi no nos
// rompe el test entre Node 18/20/22.
import { describe, it, expect } from "vitest";
import { formatAmount } from "../../utils/formatAmount";

const stripWS = (s) => s.replace(/\s+/g, " ");

describe("formatAmount", () => {
  it("formatea numero positivo grande con separador de miles", () => {
    const out = stripWS(formatAmount(12345.67));
    expect(out).toBe("12.345,67 €");
  });

  it("formatea numero positivo pequeno sin separador de miles", () => {
    // 1234.56 NO tiene separador en es-ES (Intl agrupa a partir de 5 digitos).
    const out = stripWS(formatAmount(1234.56));
    expect(out).toBe("1234,56 €");
  });

  it("formatea numero negativo con signo menos", () => {
    const out = stripWS(formatAmount(-45.15));
    expect(out).toBe("-45,15 €");
  });

  it("formatea cero como 0,00 €", () => {
    const out = stripWS(formatAmount(0));
    expect(out).toBe("0,00 €");
  });

  it("convierte null en 0,00 €", () => {
    // null || 0 = 0; Number(0) = 0.
    const out = stripWS(formatAmount(null));
    expect(out).toBe("0,00 €");
  });

  it("convierte undefined en 0,00 €", () => {
    const out = stripWS(formatAmount(undefined));
    expect(out).toBe("0,00 €");
  });

  it("acepta strings numericos", () => {
    const out = stripWS(formatAmount("1234.56"));
    expect(out).toBe("1234,56 €");
  });

  it("convierte NaN explicito en 0,00 € (NaN es falsy en el OR)", () => {
    // Number(NaN || 0) - OJO: NaN es falsy, asi que pasa a 0.
    const out = stripWS(formatAmount(NaN));
    expect(out).toBe("0,00 €");
  });

  it("convierte string no numerico en NaN €", () => {
    // "abc" es truthy, asi que NO entra la rama || 0. Number("abc") = NaN.
    const out = stripWS(formatAmount("abc"));
    expect(out).toBe("NaN €");
  });

  it("redondea decimales a 2 posiciones", () => {
    const out = stripWS(formatAmount(1.005));
    // Intl puede redondear a "1,01" o "1,00" segun banker's rounding;
    // toleramos ambos formatos.
    expect(out).toMatch(/^1,0[01] €$/);
  });
});
