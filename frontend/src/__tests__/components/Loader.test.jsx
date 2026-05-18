// Archivo: frontend/src/__tests__/components/Loader.test.jsx. Comentarios en espanol.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Loader from "../../components/common/Loader";

describe("Loader", () => {
  it("renderiza texto default 'Cargando...' con role='status'", () => {
    render(<Loader />);
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent("Cargando...");
  });

  it("expone aria-live='polite' para anuncios no intrusivos", () => {
    render(<Loader />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("muestra el texto pasado por prop", () => {
    render(<Loader text="Importando movimientos" />);
    expect(screen.getByRole("status")).toHaveTextContent("Importando movimientos");
    // Aseguramos que NO queda el default por error.
    expect(screen.getByRole("status")).not.toHaveTextContent("Cargando...");
  });
});
