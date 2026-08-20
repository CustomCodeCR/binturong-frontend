import type { ValidationSchema } from "@/shared/composables/useFormValidation";
import type { Rules, Translator } from "@/shared/validation/rules";

/** Sucursal: código corto, nombre y dirección de texto, teléfono numérico. */
export function buildBranchSchema(
  rules: Rules,
  t: Translator,
): ValidationSchema {
  const codeLabel = t("branches.fields.code");
  const nameLabel = t("branches.fields.name");
  const addressLabel = t("branches.fields.address");
  const phoneLabel = t("branches.fields.phone");

  return {
    code: [rules.required(codeLabel), rules.code(codeLabel, 2, 20)],
    name: [
      rules.required(nameLabel),
      rules.meaningfulText(nameLabel, 3),
      rules.maxLength(80, nameLabel),
    ],
    address: [
      rules.required(addressLabel),
      rules.meaningfulText(addressLabel, 5),
      rules.maxLength(200, addressLabel),
    ],
    phone: [rules.required(phoneLabel), rules.phone(phoneLabel)],
  };
}

/** Bodega: código corto, nombre y descripción de texto. */
export function buildWarehouseSchema(
  rules: Rules,
  t: Translator,
): ValidationSchema {
  const codeLabel = t("branches.warehouses.fields.code");
  const nameLabel = t("branches.warehouses.fields.name");
  const descriptionLabel = t("branches.warehouses.fields.description");

  return {
    code: [rules.required(codeLabel), rules.code(codeLabel, 2, 20)],
    name: [
      rules.required(nameLabel),
      rules.meaningfulText(nameLabel, 3),
      rules.maxLength(80, nameLabel),
    ],
    description: [
      rules.required(descriptionLabel),
      rules.meaningfulText(descriptionLabel, 5),
      rules.maxLength(255, descriptionLabel),
    ],
  };
}
