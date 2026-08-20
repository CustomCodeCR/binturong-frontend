import type { ValidationRule } from "@/shared/composables/useFormValidation";

/**
 * Reglas de validación reutilizables para los formularios del sistema.
 *
 * Las reglas se construyen a partir de una función de traducción (`t`) para que
 * los mensajes queden siempre en el idioma activo. Use `useValidation()` para
 * obtenerlas ya enlazadas al i18n del componente.
 */

export type Translator = (
  key: string,
  named?: Record<string, unknown>,
) => string;

// ---------------------------------------------------------------------------
// Expresiones y helpers de bajo nivel (exportados para pruebas/uso puntual)
// ---------------------------------------------------------------------------

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
export const DIGITS_PATTERN = /^\d+$/;
/**
 * Identificación: solo dígitos. El backend la almacena sin separadores
 * (`^[0-9]{5,20}$`), así que aceptar guiones aquí solo produce un 400 genérico
 * al guardar en vez de un error junto al campo.
 */
export const IDENTIFICATION_PATTERN = /^\d+$/;
export const PHONE_PATTERN = /^[\d+()\-\s]+$/;
/** Debe coincidir con `InputValidation.IsCode` del backend (no admite `/`). */
export const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
/** Debe coincidir con `InputValidation.PassportRegex` del backend. */
export const PASSPORT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9.-]{4,19}$/;
export const LETTER_PATTERN = /\p{L}/u;
export const NAME_PATTERN = /^[\p{L}\p{M}\s'.,&()-]+$/u;
/** Igual que `NAME_PATTERN` pero admitiendo dígitos y `/` ("Cerrajería 24/7"). */
export const BUSINESS_NAME_PATTERN = /^[\p{L}\p{M}\d\s'.,&()/-]+$/u;

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function countDigits(value: string): number {
  return (value.match(/\d/g) ?? []).length;
}

function countLetters(value: string): number {
  return (value.match(/\p{L}/gu) ?? []).length;
}

/** Un valor "vacío" nunca falla una regla de formato: eso lo cubre `required`. */
function isBlank(value: unknown): boolean {
  return asText(value) === "";
}

// ---------------------------------------------------------------------------
// Fábrica de reglas enlazada al traductor
// ---------------------------------------------------------------------------

export function createRules(t: Translator) {
  return {
    required(field: string): ValidationRule {
      return (value) => {
        if (Array.isArray(value)) {
          return value.length === 0
            ? t("validation.required", { field })
            : null;
        }
        if (typeof value === "boolean") return null;
        if (value === 0) return null;
        return isBlank(value) ? t("validation.required", { field }) : null;
      };
    },

    arrayRequired(field: string): ValidationRule {
      return (value) =>
        !Array.isArray(value) || value.length === 0
          ? t("validation.arrayRequired", { field })
          : null;
    },

    email(field: string): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        return EMAIL_PATTERN.test(asText(value))
          ? null
          : t("validation.email", { field });
      };
    },

    minLength(min: number, field: string): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        return asText(value).length < min
          ? t("validation.minLength", { field, min })
          : null;
      };
    },

    maxLength(max: number, field: string): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        return asText(value).length > max
          ? t("validation.maxLength", { field, max })
          : null;
      };
    },

    /**
     * Nombre de una persona (contacto, empleado). No admite dígitos y exige al
     * menos `min` letras: evita "12345" y "a".
     */
    personName(field: string, min = 2): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        const text = asText(value);

        if (countDigits(text) > 0) {
          return t("validation.nameNoDigits", { field });
        }
        if (!NAME_PATTERN.test(text) || countLetters(text) < min) {
          return t("validation.nameInvalid", { field, min });
        }
        return null;
      };
    },

    /**
     * Nombre comercial o razón social. A diferencia de `personName` admite
     * dígitos ("Cerrajería 24/7"), pero rechaza valores puramente numéricos y
     * exige un mínimo de letras.
     */
    businessName(field: string, min = 2): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        const text = asText(value);

        if (countLetters(text) < min) {
          return t("validation.nameInvalid", { field, min });
        }
        if (!BUSINESS_NAME_PATTERN.test(text)) {
          return t("validation.nameInvalidChars", { field });
        }
        return null;
      };
    },

    /**
     * Texto descriptivo (descripciones, notas, justificaciones).
     * Rechaza contenido puramente numérico y exige un mínimo de letras.
     */
    meaningfulText(field: string, min = 3): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        const text = asText(value);

        if (DIGITS_PATTERN.test(text.replace(/[\s.,-]/g, ""))) {
          return t("validation.textNotOnlyNumbers", { field });
        }
        if (text.length < min || countLetters(text) < min) {
          return t("validation.textTooShort", { field, min });
        }
        return null;
      };
    },

    /** Cédula / identificación: solo dígitos, sin separadores. */
    identification(field: string, min = 8, max = 20): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        const text = asText(value);

        if (!IDENTIFICATION_PATTERN.test(text)) {
          return t("validation.identification", { field });
        }

        const digits = countDigits(text);
        if (digits < min || digits > max) {
          return t("validation.identificationLength", { field, min, max });
        }
        return null;
      };
    },

    /** Teléfono: dígitos y separadores habituales, con un mínimo de dígitos. */
    phone(field: string, min = 8, max = 15): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        const text = asText(value);

        if (!PHONE_PATTERN.test(text)) {
          return t("validation.phone", { field });
        }

        const digits = countDigits(text);
        if (digits < min || digits > max) {
          return t("validation.phoneLength", { field, min, max });
        }
        return null;
      };
    },

    /** Campo numérico expresado como texto (códigos numéricos). */
    numericText(field: string): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        return DIGITS_PATTERN.test(asText(value))
          ? null
          : t("validation.numeric", { field });
      };
    },

    /**
     * Código estrictamente numérico (catálogos de Impuestos y Métodos de pago).
     * El backend valida `^[0-9]{1,20}$`; usar `code()` aquí dejaba pasar letras
     * que el servidor rechazaba después con un error genérico.
     */
    numericCode(field: string, min = 1, max = 20): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        const text = asText(value);

        if (!DIGITS_PATTERN.test(text)) {
          return t("validation.numeric", { field });
        }
        if (text.length < min || text.length > max) {
          return t("validation.codeLength", { field, min, max });
        }
        return null;
      };
    },

    /** Pasaporte: alfanumérico con `.` y `-`, entre 5 y 20 caracteres. */
    passport(field: string): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        return PASSPORT_PATTERN.test(asText(value))
          ? null
          : t("validation.passport", { field });
      };
    },

    /** Código alfanumérico sin espacios (SKU, código de impuesto, etc.). */
    code(field: string, min = 2, max = 30): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        const text = asText(value);

        if (!CODE_PATTERN.test(text)) {
          return t("validation.code", { field });
        }
        if (text.length < min || text.length > max) {
          return t("validation.codeLength", { field, min, max });
        }
        return null;
      };
    },

    number(field: string): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        return Number.isFinite(Number(value))
          ? null
          : t("validation.number", { field });
      };
    },

    min(min: number, field: string): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return t("validation.number", { field });
        return numeric < min ? t("validation.numberMin", { field, min }) : null;
      };
    },

    max(max: number, field: string): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return t("validation.number", { field });
        return numeric > max ? t("validation.numberMax", { field, max }) : null;
      };
    },

    positive(field: string): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return t("validation.number", { field });
        return numeric <= 0 ? t("validation.positive", { field }) : null;
      };
    },

    percentage(field: string): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return t("validation.number", { field });
        return numeric < 0 || numeric > 100
          ? t("validation.percentage", { field })
          : null;
      };
    },

    /**
     * Política de contraseña del backend (`InputValidation.IsStrongPassword`):
     * longitud + mayúscula + minúscula + dígito + carácter especial, sin
     * espacios. Debe coincidir exactamente o el servidor rechaza contraseñas
     * que el formulario dio por buenas.
     */
    password(field: string, min = 8, max = 128): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        const text = String(value);

        const strong =
          text.length >= min &&
          text.length <= max &&
          /[a-z]/.test(text) &&
          /[A-Z]/.test(text) &&
          /\d/.test(text) &&
          /[^A-Za-z0-9]/.test(text) &&
          !/\s/.test(text);

        return strong ? null : t("validation.password", { field, min, max });
      };
    },

    sameAs(
      expected: () => unknown,
      field: string,
      other: string,
    ): ValidationRule {
      return (value) => {
        if (isBlank(value)) return null;
        return String(value) === String(expected() ?? "")
          ? null
          : t("validation.sameAs", { field, other });
      };
    },

    /** Fecha no anterior a otra (para rangos desde/hasta). */
    dateNotBefore(start: () => string, field: string): ValidationRule {
      return (value) => {
        const from = asText(start());
        const to = asText(value);
        if (!from || !to) return null;
        return from > to ? t("validation.dateRange", { field }) : null;
      };
    },
  };
}

export type Rules = ReturnType<typeof createRules>;

/**
 * Compara un rango de fechas en formato `YYYY-MM-DD` (o ISO).
 * Devuelve `true` cuando el rango es válido (inicio <= fin).
 */
export function isDateRangeValid(
  from?: string | null,
  to?: string | null,
): boolean {
  const start = asText(from);
  const end = asText(to);
  if (!start || !end) return true;

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (Number.isNaN(startTime) || Number.isNaN(endTime)) return true;
  return startTime <= endTime;
}
