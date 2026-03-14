import type { ValidationRule } from "@/shared/composables/useFormValidation";

export function required(label: string): ValidationRule {
  return (value) => {
    if (!value || value.toString().trim() === "") {
      return `${label} es requerido`;
    }
    return null;
  };
}

export function email(): ValidationRule {
  return (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(value)) {
      return "Email inválido";
    }

    return null;
  };
}

export function minLength(length: number, label: string): ValidationRule {
  return (value) => {
    if (!value || value.length < length) {
      return `${label} debe tener al menos ${length} caracteres`;
    }

    return null;
  };
}

export function arrayRequired(label: string): ValidationRule {
  return (value) => {
    if (!value || value.length === 0) {
      return `${label} es requerido`;
    }

    return null;
  };
}