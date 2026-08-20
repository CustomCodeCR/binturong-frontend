import { useI18n } from "vue-i18n";

import { useFormValidation } from "@/shared/composables/useFormValidation";
import { createRules } from "@/shared/validation/rules";

/**
 * Estado de validación + catálogo de reglas ya traducidas al idioma activo.
 *
 * Uso típico en un formulario:
 *
 * ```ts
 * const { rules, validate, getError, fieldClass, firstError } = useValidation();
 *
 * function isFormValid() {
 *   return validate(
 *     { email: email.value },
 *     { email: [rules.required("Email"), rules.email("Email")] },
 *   );
 * }
 * ```
 */
export function useValidation() {
  const { t } = useI18n();
  const form = useFormValidation();
  const rules = createRules((key, named) => t(key, named ?? {}));

  return { ...form, rules, t };
}
