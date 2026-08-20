import type { ValidationSchema } from "@/shared/composables/useFormValidation";
import type { Rules, Translator } from "@/shared/validation/rules";

/**
 * Esquema de validación compartido por los formularios de creación y edición de
 * proveedores. Reutiliza las mismas reglas que Clientes porque los campos son
 * equivalentes (identificación, nombre, correo, teléfono).
 */
export function buildSupplierSchema(
  rules: Rules,
  t: Translator,
  identificationType: string,
): ValidationSchema {
  const identificationLabel = t("suppliers.fields.identification");
  const legalNameLabel = t("suppliers.fields.legalName");
  const tradeNameLabel = t("suppliers.fields.tradeName");
  const emailLabel = t("suppliers.fields.email");
  const phoneLabel = t("suppliers.fields.phone");
  const paymentTermsLabel = t("suppliers.fields.paymentTerms");

  // Solo el pasaporte admite letras. DIMEX y NITE son numéricos: el backend
  // los valida con el mismo patrón que la cédula (`^[0-9]{5,20}$`).
  const isPassport = identificationType === "Pasaporte";

  return {
    identification: [
      rules.required(identificationLabel),
      isPassport
        ? rules.passport(identificationLabel)
        : rules.identification(identificationLabel, 9, 12),
    ],
    legalName: [
      rules.required(legalNameLabel),
      rules.businessName(legalNameLabel),
      rules.maxLength(150, legalNameLabel),
    ],
    tradeName: [
      rules.required(tradeNameLabel),
      rules.businessName(tradeNameLabel),
      rules.maxLength(150, tradeNameLabel),
    ],
    email: [rules.required(emailLabel), rules.email(emailLabel)],
    phone: [rules.required(phoneLabel), rules.phone(phoneLabel)],
    paymentTerms: [
      rules.required(paymentTermsLabel),
      rules.meaningfulText(paymentTermsLabel, 3),
      rules.maxLength(120, paymentTermsLabel),
    ],
  };
}
