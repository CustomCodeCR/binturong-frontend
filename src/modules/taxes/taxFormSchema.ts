import type { ValidationSchema } from "@/shared/composables/useFormValidation";
import type { Rules, Translator } from "@/shared/validation/rules";

/**
 * Catálogo de impuestos: `Nombre` es texto descriptivo y `Código` un
 * identificador numérico (el backend valida `^[0-9]{1,20}$`).
 */
export function buildTaxSchema(rules: Rules, t: Translator): ValidationSchema {
  const nameLabel = t("taxes.fields.name");
  const codeLabel = t("taxes.fields.code");
  const percentageLabel = t("taxes.fields.percentage");

  return {
    name: [
      rules.required(nameLabel),
      rules.meaningfulText(nameLabel, 3),
      rules.maxLength(60, nameLabel),
    ],
    code: [rules.required(codeLabel), rules.numericCode(codeLabel, 1, 20)],
    percentage: [
      rules.required(percentageLabel),
      rules.percentage(percentageLabel),
    ],
  };
}
