// Archivo: frontend/src/__tests__/components/EmptyState.test.jsx. Comentarios en espanol.
//
// EmptyState usa NavLink de react-router-dom: envolvemos en MemoryRouter para
// que el contexto de routing este disponible en el test.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";

const renderWithRouter = (ui) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe("EmptyState", () => {
  it("renderiza title, description y CTA con NavLink al ctaTo", () => {
    renderWithRouter(
      <EmptyState
        title="Sin datos todavia"
        description="Importa un extracto para empezar"
        ctaLabel="Importar movimientos"
        ctaTo="/import"
      />
    );

    expect(screen.getByRole("heading", { name: "Sin datos todavia" })).toBeInTheDocument();
    expect(screen.getByText("Importa un extracto para empezar")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Importar movimientos" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/import");
  });

  it("expone role='status' con aria-live='polite'", () => {
    renderWithRouter(
      <EmptyState title="Vacio" description="desc" ctaLabel="Ir" ctaTo="/x" />
    );
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
  });

  it("omite la descripcion si no se pasa", () => {
    renderWithRouter(
      <EmptyState title="Solo titulo" ctaLabel="Ir" ctaTo="/x" />
    );
    expect(screen.getByRole("heading", { name: "Solo titulo" })).toBeInTheDocument();
    // No deberia haber un parrafo de descripcion adicional.
    expect(document.querySelector(".empty-state-description")).toBeNull();
  });

  it("omite el CTA cuando faltan ctaLabel o ctaTo", () => {
    renderWithRouter(<EmptyState title="Sin CTA" />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renderiza icono custom cuando se pasa por prop", () => {
    renderWithRouter(
      <EmptyState
        title="Custom"
        icon={<svg data-testid="icono-custom" />}
        ctaLabel="Ir"
        ctaTo="/x"
      />
    );
    expect(screen.getByTestId("icono-custom")).toBeInTheDocument();
    // El icono default tiene aria-label='Sin datos'; no debe estar.
    expect(screen.queryByLabelText("Sin datos")).toBeNull();
  });
});
