import type { ValidationSchema } from "@/shared/composables/useFormValidation";
import type { Rules, Translator } from "@/shared/validation/rules";

/**
 * Catálogo de métodos de pago: `Código` es un identificador numérico (el
 * backend valida `^[0-9]{1,20}$`) y `Descripción` un texto que no puede ser
 * solo números.
 */
export function buildPaymentMethodSchema(
  rules: Rules,
  t: Translator,
): ValidationSchema {
  const codeLabel = t("paymentMethods.fields.code");
  const descriptionLabel = t("paymentMethods.fields.description");

  return {
    code: [rules.required(codeLabel), rules.numericCode(codeLabel, 1, 20)],
    description: [
      rules.required(descriptionLabel),
      rules.meaningfulText(descriptionLabel, 5),
      rules.maxLength(200, descriptionLabel),
    ],
  };
}
