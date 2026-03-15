// src/modules/roles/composables/useRoleForm.ts

import { ref } from "vue";
import { RolesService } from "@/core/services/rolesService";
import { useFormValidation } from "@/shared/composables/useFormValidation";
import { required, minLength } from "@/shared/validation/rules";
import { useToastStore } from "@/core/stores/toastStore";
import type {
  Role,
  RoleCreateRequest,
  RoleUpdateRequest,
} from "@/core/interfaces/roles";

interface RoleFormData {
  name: string;
  description: string;
  isActive: boolean;
}

export function useRoleForm() {
  const isSubmitting = ref(false);
  const toastStore = useToastStore();

  const { validate, getError, markAsTouched, clearErrors } =
    useFormValidation();

  const formData = ref<RoleFormData>({
    name: "",
    description: "",
    isActive: true,
  });

  // Validation schema
  const validationSchema = {
    name: [required("Nombre del rol"), minLength(3, "Nombre del rol")],
    description: [required("Descripción")],
  };

  function validateForm(): boolean {
    return validate(formData.value, validationSchema);
  }

  async function createRole(): Promise<boolean> {
    if (!validateForm()) {
      toastStore.addToast({
        severity: "error",
        title: "Error de validación",
        message: "Por favor corrija los errores del formulario",
        duration: 3000,
      });
      return false;
    }

    isSubmitting.value = true;

    try {
      const payload: RoleCreateRequest = {
        name: formData.value.name,
        description: formData.value.description,
        isActive: formData.value.isActive,
      };

      await RolesService.create(payload);

      toastStore.addToast({
        severity: "success",
        title: "Rol creado",
        message: "El rol se creó correctamente",
        duration: 3000,
      });

      return true;
    } catch (err: any) {
      toastStore.addToast({
        severity: "error",
        title: "Error",
        message: err?.message || "No se pudo crear el rol",
        duration: 3000,
      });
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function updateRole(id: string): Promise<boolean> {
    if (!validateForm()) {
      toastStore.addToast({
        severity: "error",
        title: "Error de validación",
        message: "Por favor corrija los errores del formulario",
        duration: 3000,
      });
      return false;
    }

    isSubmitting.value = true;

    try {
      const payload: RoleUpdateRequest = {
        name: formData.value.name,
        description: formData.value.description,
        isActive: formData.value.isActive,
      };

      await RolesService.update(id, payload);

      toastStore.addToast({
        severity: "success",
        title: "Rol actualizado",
        message: "El rol se actualizó correctamente",
        duration: 3000,
      });

      return true;
    } catch (err: any) {
      toastStore.addToast({
        severity: "error",
        title: "Error",
        message: err?.message || "No se pudo actualizar el rol",
        duration: 3000,
      });
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  function resetForm() {
    formData.value = {
      name: "",
      description: "",
      isActive: true,
    };
    clearErrors();
  }

  function loadRole(role: Role) {
    formData.value = {
      name: role.name,
      description: role.description,
      isActive: role.isActive,
    };
    clearErrors();
  }

  return {
    formData,
    isSubmitting,
    validateForm,
    createRole,
    updateRole,
    resetForm,
    loadRole,
    getError,
    markAsTouched,
  };
}

