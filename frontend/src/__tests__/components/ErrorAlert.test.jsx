// Archivo: frontend/src/__tests__/components/ErrorAlert.test.jsx. Comentarios en espanol.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorAlert from "../../components/common/ErrorAlert";

describe("ErrorAlert", () => {
  it("renderiza el mensaje precedido de 'Error: ' con role='alert'", () => {
    render(<ErrorAlert message="Algo fallo" />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("Error: Algo fallo");
  });

  it("expone aria-live='assertive' para lectores de pantalla", () => {
    render(<ErrorAlert message="Critico" />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });

  it("no renderiza nada cuando message es vacio", () => {
    const { container } = render(<ErrorAlert message="" />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("no renderiza nada cuando message es null/undefined", () => {
    const { container } = render(<ErrorAlert message={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
