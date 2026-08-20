import { describe, expect, it } from "vitest";

import { extractServerMessage } from "@/core/api/apiErrorHandler";

/**
 * El backend responde con tres formas distintas y ninguna usa `message`, que
 * era lo único que leía el manejador: por eso todos los 400 llegaban al usuario
 * como un genérico "Bad request".
 */
describe("extractServerMessage", () => {
  it("usa la descripción de un error de negocio", () => {
    expect(
      extractServerMessage({
        code: "Taxes.CodeNotUnique",
        description: "The provided tax code is not unique",
        type: 4,
      }),
    ).toBe("The provided tax code is not unique");
  });

  it("junta todos los errores de validación", () => {
    expect(
      extractServerMessage({
        errors: [
          { code: "EmailValidator", description: "'Email' is not a valid email address." },
          { code: "PredicateValidator", description: "The specified condition was not met for 'National Id'." },
        ],
        code: "Validation.General",
        description: "One or more validation errors occurred",
      }),
    ).toBe(
      "'Email' is not a valid email address. · The specified condition was not met for 'National Id'.",
    );
  });

  it("no repite descripciones idénticas", () => {
    expect(
      extractServerMessage({
        errors: [{ description: "Campo inválido" }, { description: "Campo inválido" }],
      }),
    ).toBe("Campo inválido");
  });

  it("cae a ProblemDetails cuando no hay descripción", () => {
    expect(
      extractServerMessage({
        type: "https://datatracker.ietf.org/doc/html/rfc7231",
        title: "Server failure",
        status: 500,
      }),
    ).toBe("Server failure");
  });

  it("prefiere detail sobre title", () => {
    expect(extractServerMessage({ title: "Bad Request", detail: "El período ya fue cerrado" })).toBe(
      "El período ya fue cerrado",
    );
  });

  it("devuelve null cuando no hay nada aprovechable", () => {
    expect(extractServerMessage(null)).toBeNull();
    expect(extractServerMessage({})).toBeNull();
    expect(extractServerMessage({ errors: [] })).toBeNull();
    expect(extractServerMessage({ description: "   " })).toBeNull();
    expect(extractServerMessage("texto plano")).toBeNull();
  });
});
