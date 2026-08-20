import type { ValidationSchema } from "@/shared/composables/useFormValidation";
import type { Rules, Translator } from "@/shared/validation/rules";

/**
 * Esquema de validación compartido por los formularios de creación y edición de
 * clientes, para que ambos apliquen exactamente las mismas reglas de formato.
 *
 * El pasaporte admite letras, por lo que la identificación solo se valida como
 * numérica cuando el tipo de identificación es una cédula.
 */
export function buildClientSchema(
  rules: Rules,
  t: Translator,
  identificationType: string,
): ValidationSchema {
  const identificationLabel = t("clients.fields.identification");
  const tradeNameLabel = t("clients.fields.tradeName");
  const contactNameLabel = t("clients.fields.contactName");
  const emailLabel = t("clients.fields.email");
  const primaryPhoneLabel = t("clients.fields.primaryPhone");
  const secondaryPhoneLabel = t("clients.fields.secondaryPhone");
  const industryLabel = t("clients.fields.industry");
  const clientTypeLabel = t("clients.fields.clientType");
  const scoreLabel = t("clients.fields.score");

  const isPassport = identificationType === "Pasaporte";

  return {
    identification: [
      rules.required(identificationLabel),
      isPassport
        ? rules.passport(identificationLabel)
        : rules.identification(identificationLabel, 9, 12),
    ],
    tradeName: [
      rules.required(tradeNameLabel),
      rules.businessName(tradeNameLabel),
      rules.maxLength(120, tradeNameLabel),
    ],
    contactName: [
      rules.required(contactNameLabel),
      rules.personName(contactNameLabel),
      rules.maxLength(120, contactNameLabel),
    ],
    email: [rules.required(emailLabel), rules.email(emailLabel)],
    primaryPhone: [
      rules.required(primaryPhoneLabel),
      rules.phone(primaryPhoneLabel),
    ],
    secondaryPhone: [rules.phone(secondaryPhoneLabel)],
    industry: [
      rules.businessName(industryLabel),
      rules.maxLength(80, industryLabel),
    ],
    clientType: [
      rules.businessName(clientTypeLabel),
      rules.maxLength(50, clientTypeLabel),
    ],
    score: [rules.min(0, scoreLabel), rules.max(100, scoreLabel)],
  };
}
