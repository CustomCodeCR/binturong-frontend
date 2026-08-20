import { computed, ref } from "vue";

export type ValidationRule = (value: any) => string | null;
export type ValidationSchema = Record<string, ValidationRule[]>;

export function useFormValidation() {
  const errors = ref<Record<string, string>>({});
  const touched = ref<Record<string, boolean>>({});

  function markAsTouched(field: string) {
    touched.value[field] = true;
  }

  function clearErrors() {
    errors.value = {};
    touched.value = {};
  }

  function clearError(field: string) {
    delete errors.value[field];
  }

  function setError(field: string, message: string) {
    touched.value[field] = true;
    errors.value[field] = message;
  }

  function getError(field: string): string {
    if (!touched.value[field]) return "";
    return errors.value[field] || "";
  }

  function hasError(field: string): boolean {
    return getError(field).length > 0;
  }

  /**
   * Clases de borde para el input: rojo cuando el campo tiene error.
   * Evita repetir el ternario en cada plantilla.
   */
  function fieldClass(
    field: string,
    base = "border-bt-grey-300",
    invalid = "border-bt-error-500",
  ): string {
    return hasError(field) ? invalid : base;
  }

  function validateField(
    field: string,
    value: any,
    rules: ValidationRule[],
  ): boolean {
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        errors.value[field] = error;
        return false;
      }
    }

    delete errors.value[field];
    return true;
  }

  /**
   * Valida el formulario completo contra el esquema.
   * Marca todos los campos como "touched" para que los mensajes se rendericen.
   */
  function validate(
    form: Record<string, any>,
    schema: ValidationSchema,
  ): boolean {
    let valid = true;

    for (const field in schema) {
      markAsTouched(field);

      const fieldValid = validateField(field, form[field], schema[field]);

      if (!fieldValid) valid = false;
    }

    return valid;
  }

  const errorList = computed(() => Object.values(errors.value).filter(Boolean));
  const firstError = computed(() => errorList.value[0] ?? "");
  const isValid = computed(() => errorList.value.length === 0);

  return {
    errors,
    touched,
    errorList,
    firstError,
    isValid,
    getError,
    hasError,
    fieldClass,
    setError,
    clearError,
    markAsTouched,
    clearErrors,
    validateField,
    validate,
  };
}
