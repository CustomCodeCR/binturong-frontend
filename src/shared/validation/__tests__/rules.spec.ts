import { describe, expect, it } from "vitest";

import { createRules, isDateRangeValid } from "@/shared/validation/rules";

/** Traductor de prueba: devuelve la clave para poder afirmar sobre ella. */
const rules = createRules((key) => key);

function run(rule: ReturnType<typeof rules.required>, value: unknown) {
  return rule(value);
}

describe("required", () => {
  const rule = rules.required("Campo");

  it("rechaza vacío y solo espacios", () => {
    expect(run(rule, "")).toBe("validation.required");
    expect(run(rule, "   ")).toBe("validation.required");
    expect(run(rule, null)).toBe("validation.required");
    expect(run(rule, [])).toBe("validation.required");
  });

  it("acepta 0 y false como valores presentes", () => {
    expect(run(rule, 0)).toBeNull();
    expect(run(rule, false)).toBeNull();
    expect(run(rule, "texto")).toBeNull();
  });
});

describe("email", () => {
  const rule = rules.email("Correo");

  it("rechaza formatos inválidos", () => {
    expect(run(rule, "prueba123")).toBe("validation.email");
    expect(run(rule, "sin@dominio")).toBe("validation.email");
    expect(run(rule, "sin arroba.com")).toBe("validation.email");
  });

  it("acepta correos válidos y deja pasar el vacío", () => {
    expect(run(rule, "admin@system.local")).toBeNull();
    expect(run(rule, "")).toBeNull();
  });
});

describe("identification", () => {
  const rule = rules.identification("Identificación", 9, 12);

  it("rechaza letras", () => {
    expect(run(rule, "abc123456")).toBe("validation.identification");
  });

  it("rechaza longitudes fuera de rango", () => {
    expect(run(rule, "123")).toBe("validation.identificationLength");
  });

  // El backend almacena la identificación sin separadores (`^[0-9]{5,20}$`):
  // aceptar guiones aquí terminaba en un 400 genérico al guardar.
  it("rechaza guiones separadores", () => {
    expect(run(rule, "1-1234-5678")).toBe("validation.identification");
  });

  it("acepta solo dígitos", () => {
    expect(run(rule, "112345678")).toBeNull();
  });
});

describe("numericCode", () => {
  const rule = rules.numericCode("Código", 1, 20);

  it("rechaza códigos con letras", () => {
    expect(run(rule, "IVA")).toBe("validation.numeric");
    expect(run(rule, "IVA13")).toBe("validation.numeric");
  });

  it("rechaza longitudes fuera de rango", () => {
    expect(run(rule, "1".repeat(21))).toBe("validation.codeLength");
  });

  it("acepta códigos numéricos", () => {
    expect(run(rule, "13")).toBeNull();
    expect(run(rule, "1")).toBeNull();
  });
});

describe("passport", () => {
  const rule = rules.passport("Pasaporte");

  it("rechaza caracteres que el backend no admite", () => {
    expect(run(rule, "AB_12345")).toBe("validation.passport");
    expect(run(rule, "AB/12345")).toBe("validation.passport");
  });

  it("rechaza longitudes fuera de rango", () => {
    expect(run(rule, "AB12")).toBe("validation.passport");
  });

  it("acepta alfanuméricos con punto y guion", () => {
    expect(run(rule, "A1234567")).toBeNull();
    expect(run(rule, "AB-12.345")).toBeNull();
  });
});

describe("phone", () => {
  const rule = rules.phone("Teléfono");

  it("rechaza letras", () => {
    expect(run(rule, "abcd1234")).toBe("validation.phone");
  });

  it("rechaza menos dígitos de los requeridos", () => {
    expect(run(rule, "2222")).toBe("validation.phoneLength");
  });

  it("acepta formatos habituales", () => {
    expect(run(rule, "+506 2222-3333")).toBeNull();
    expect(run(rule, "(506) 88887777")).toBeNull();
  });
});

describe("personName", () => {
  const rule = rules.personName("Nombre");

  it("rechaza dígitos y valores puramente numéricos", () => {
    expect(run(rule, "12345")).toBe("validation.nameNoDigits");
    expect(run(rule, "Juan 2")).toBe("validation.nameNoDigits");
  });

  it("acepta nombres con acentos y signos habituales", () => {
    expect(run(rule, "María José Calderón")).toBeNull();
    expect(run(rule, "O'Brien")).toBeNull();
  });
});

describe("businessName", () => {
  const rule = rules.businessName("Nombre comercial");

  it("rechaza valores puramente numéricos", () => {
    expect(run(rule, "12345")).toBe("validation.nameInvalid");
  });

  it("acepta nombres comerciales con dígitos", () => {
    expect(run(rule, "Cerrajería Calderón 24/7")).toBeNull();
    expect(run(rule, "Ferretería & Cía.")).toBeNull();
  });
});

describe("meaningfulText", () => {
  const rule = rules.meaningfulText("Descripción", 5);

  it("rechaza contenido solo numérico", () => {
    expect(run(rule, "123456")).toBe("validation.textNotOnlyNumbers");
    expect(run(rule, "12 34.56")).toBe("validation.textNotOnlyNumbers");
  });

  it("rechaza texto demasiado corto", () => {
    expect(run(rule, "ab")).toBe("validation.textTooShort");
  });

  it("acepta descripciones reales", () => {
    expect(run(rule, "Servicio de cerrajería a domicilio")).toBeNull();
  });
});

describe("code", () => {
  const rule = rules.code("Código", 2, 20);

  it("rechaza espacios y símbolos no permitidos", () => {
    expect(run(rule, "AB C")).toBe("validation.code");
    expect(run(rule, "AB#C")).toBe("validation.code");
    // El backend (`InputValidation.IsCode`) no admite `/`.
    expect(run(rule, "AB/C")).toBe("validation.code");
  });

  it("acepta códigos alfanuméricos", () => {
    expect(run(rule, "IVA-13")).toBeNull();
    expect(run(rule, "SKU_001")).toBeNull();
  });
});

describe("numeric / rangos", () => {
  it("numericText rechaza texto", () => {
    expect(run(rules.numericText("Código"), "ABC")).toBe("validation.numeric");
    expect(run(rules.numericText("Código"), "123")).toBeNull();
  });

  it("min rechaza valores por debajo del mínimo", () => {
    expect(run(rules.min(1, "Salario"), 0)).toBe("validation.numberMin");
    expect(run(rules.min(1, "Salario"), 1)).toBeNull();
  });

  it("percentage limita a 0-100", () => {
    expect(run(rules.percentage("Porcentaje"), -1)).toBe("validation.percentage");
    expect(run(rules.percentage("Porcentaje"), 101)).toBe("validation.percentage");
    expect(run(rules.percentage("Porcentaje"), 13)).toBeNull();
  });
});

describe("password", () => {
  const rule = rules.password("Contraseña");

  it("exige longitud, mayúscula, minúscula y dígito", () => {
    expect(run(rule, "corta1A")).toBe("validation.password");
    expect(run(rule, "sinmayuscula1")).toBe("validation.password");
    expect(run(rule, "SINMINUSCULA1")).toBe("validation.password");
    expect(run(rule, "SinDigitos")).toBe("validation.password");
  });

  // El backend (`InputValidation.IsStrongPassword`) exige carácter especial y
  // prohíbe espacios; sin esto el formulario aprobaba lo que el servidor negaba.
  it("exige carácter especial y rechaza espacios", () => {
    expect(run(rule, "Password1")).toBe("validation.password");
    expect(run(rule, "Admin 123!")).toBe("validation.password");
  });

  it("rechaza contraseñas de más de 128 caracteres", () => {
    expect(run(rule, `Aa1!${"x".repeat(125)}`)).toBe("validation.password");
  });

  it("acepta una contraseña que cumple la política", () => {
    expect(run(rule, "Admin123!")).toBeNull();
  });
});

describe("sameAs", () => {
  it("compara contra el valor de referencia", () => {
    const rule = rules.sameAs(() => "Admin123!", "Confirmación", "Contraseña");
    expect(run(rule, "otra")).toBe("validation.sameAs");
    expect(run(rule, "Admin123!")).toBeNull();
  });
});

describe("isDateRangeValid", () => {
  it("rechaza un inicio posterior al fin", () => {
    expect(isDateRangeValid("2026-06-20", "2026-05-21")).toBe(false);
  });

  it("acepta rangos válidos e incompletos", () => {
    expect(isDateRangeValid("2026-05-21", "2026-06-20")).toBe(true);
    expect(isDateRangeValid("2026-05-21", "2026-05-21")).toBe(true);
    expect(isDateRangeValid("", "2026-06-20")).toBe(true);
    expect(isDateRangeValid("2026-06-20", "")).toBe(true);
  });
});
