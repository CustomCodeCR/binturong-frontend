import { ref } from "vue";

export type ValidationRule = (value: any) => string | null;

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

  function getError(field: string): string {
    if (!touched.value[field]) return "";
    return errors.value[field] || "";
  }

  function validateField(
    field: string,
    value: any,
    rules: ValidationRule[]
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

  function validate(
    form: Record<string, any>,
    schema: Record<string, ValidationRule[]>
  ): boolean {
    let valid = true;

    for (const field in schema) {
      markAsTouched(field);

      const fieldValid = validateField(
        field,
        form[field],
        schema[field]
      );

      if (!fieldValid) valid = false;
    }

    return valid;
  }

  return {
    errors,
    touched,
    getError,
    markAsTouched,
    clearErrors,
    validateField,
    validate,
  };
}