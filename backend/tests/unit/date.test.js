// Tests unitarios para parseDateValue.
//
// La funcion tiene que aceptar los formatos mas habituales de los bancos
// espanoles, ademas del Excel serial (numero de dias desde 1899-12-30) que
// devuelve `xlsx` cuando una celda esta formateada como fecha pero el
// parser no la convierte a string.
//
// Para evitar acoplamiento con el TZ del runner, comprobamos componentes
// UTC en lugar de la representacion ISO completa.
import { describe, it, expect } from "vitest";
import { parseDateValue } from "../../src/utils/date.js";

describe("parseDateValue", () => {
  it("formato espanol con guiones y mes abreviado: '17-sept-25' -> 2025-09-17", () => {
    const date = parseDateValue("17-sept-25");
    expect(date).toBeInstanceOf(Date);
    expect(date.getUTCFullYear()).toBe(2025);
    expect(date.getUTCMonth()).toBe(8); // septiembre
    expect(date.getUTCDate()).toBe(17);
  });

  it("formato dd/mm/yyyy: '17/09/2025'", () => {
    const date = parseDateValue("17/09/2025");
    expect(date).toBeInstanceOf(Date);
    expect(date.getUTCFullYear()).toBe(2025);
    expect(date.getUTCMonth()).toBe(8);
    expect(date.getUTCDate()).toBe(17);
  });

  it("formato yyyy-mm-dd ISO: '2025-09-17' produce fecha del 17/sep (TZ-tolerante)", () => {
    const date = parseDateValue("2025-09-17");
    expect(date).toBeInstanceOf(Date);
    // El parser usa `new Date("2025/09/17")` que interpreta la fecha en TZ
    // local. Para hacer el test independiente del TZ del runner usamos los
    // componentes locales del Date.
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(8); // septiembre
    expect(date.getDate()).toBe(17);
  });

  it("Excel serial 45000 produce fecha razonable (2023-03-15 aprox)", () => {
    const date = parseDateValue(45000);
    expect(date).toBeInstanceOf(Date);
    // 45000 dias desde 1899-12-30 cae a mediados de marzo 2023.
    expect(date.getUTCFullYear()).toBe(2023);
    expect(date.getUTCMonth()).toBe(2); // marzo
  });

  it("texto no parseable devuelve null", () => {
    expect(parseDateValue("fecha invalida")).toBeNull();
  });

  it("string vacio devuelve null", () => {
    expect(parseDateValue("")).toBeNull();
  });

  it("null devuelve null", () => {
    expect(parseDateValue(null)).toBeNull();
  });

  it("acepta los abreviados estandar de meses en espanol", () => {
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    meses.forEach((mes, idx) => {
      const date = parseDateValue(`10-${mes}-25`);
      expect(date, `mes ${mes}`).toBeInstanceOf(Date);
      expect(date.getUTCMonth(), `mes ${mes}`).toBe(idx);
    });
  });

  it("acepta 'sept' como sinonimo de septiembre", () => {
    const date = parseDateValue("01-sept-25");
    expect(date).toBeInstanceOf(Date);
    expect(date.getUTCMonth()).toBe(8);
  });

  it("devuelve la misma Date si ya viene como Date valida", () => {
    const ref = new Date(Date.UTC(2025, 0, 1));
    expect(parseDateValue(ref)).toBe(ref);
  });
});
