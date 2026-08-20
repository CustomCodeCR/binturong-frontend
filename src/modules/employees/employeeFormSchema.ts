import type { ValidationSchema } from "@/shared/composables/useFormValidation";
import type { Rules, Translator } from "@/shared/validation/rules";

/** Salario mínimo mensual permitido por la regla de negocio. */
export const MIN_BASE_SALARY = 1;

/**
 * Esquema de validación compartido por los formularios de empleados.
 * `includeNationalId` solo aplica en la creación: la cédula no se envía en la
 * actualización porque el backend la trata como dato inmutable.
 */
export function buildEmployeeSchema(
  rules: Rules,
  t: Translator,
  options: { includeNationalId: boolean; includeHireDate: boolean },
): ValidationSchema {
  const userLabel = t("employees.fields.userId");
  const branchLabel = t("employees.fields.branch");
  const fullNameLabel = t("employees.fields.fullName");
  const nationalIdLabel = t("employees.fields.nationalId");
  const emailLabel = t("employees.fields.email");
  const jobTitleLabel = t("employees.fields.jobTitle");
  const baseSalaryLabel = t("employees.fields.baseSalary");
  const hireDateLabel = t("employees.fields.hireDate");

  const schema: ValidationSchema = {
    userId: [rules.required(userLabel)],
    branchId: [rules.required(branchLabel)],
    fullName: [
      rules.required(fullNameLabel),
      rules.personName(fullNameLabel),
      rules.maxLength(120, fullNameLabel),
    ],
    email: [rules.required(emailLabel), rules.email(emailLabel)],
    jobTitle: [
      rules.required(jobTitleLabel),
      rules.businessName(jobTitleLabel),
      rules.maxLength(80, jobTitleLabel),
    ],
    baseSalary: [
      rules.required(baseSalaryLabel),
      rules.min(MIN_BASE_SALARY, baseSalaryLabel),
    ],
  };

  if (options.includeNationalId) {
    schema.nationalId = [
      rules.required(nationalIdLabel),
      rules.identification(nationalIdLabel, 9, 12),
    ];
  }

  if (options.includeHireDate) {
    schema.hireDate = [rules.required(hireDateLabel)];
  }

  return schema;
}
