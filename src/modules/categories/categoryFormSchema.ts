import type { ValidationSchema } from "@/shared/composables/useFormValidation";
import type { Rules, Translator } from "@/shared/validation/rules";

/** Catálogo de categorías de producto: nombre y descripción deben ser texto. */
export function buildCategorySchema(
  rules: Rules,
  t: Translator,
): ValidationSchema {
  const nameLabel = t("categories.fields.name");
  const descriptionLabel = t("categories.fields.description");

  return {
    name: [
      rules.required(nameLabel),
      rules.meaningfulText(nameLabel, 3),
      rules.maxLength(60, nameLabel),
    ],
    description: [
      rules.required(descriptionLabel),
      rules.meaningfulText(descriptionLabel, 5),
      rules.maxLength(300, descriptionLabel),
    ],
  };
}
