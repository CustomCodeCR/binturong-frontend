// src/modules/roles/composables/useRoleList.ts

import { ref, computed } from "vue";
import { RolesService } from "@/core/services/rolesService";
import { useToastStore } from "@/core/stores/toastStore";
import type { Role } from "@/core/interfaces/roles";

export function useRoleList() {
  const roles = ref<Role[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const toastStore = useToastStore();

  // Filters
  const searchQuery = ref("");
  const statusFilter = ref<"all" | "active" | "inactive">("all");

  // Filtered roles
  const filteredRoles = computed(() => {
    return roles.value.filter((role) => {
      const matchesSearch =
        role.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        role.description
          ?.toLowerCase()
          .includes(searchQuery.value.toLowerCase());

      const matchesStatus =
        statusFilter.value === "all" ||
        (statusFilter.value === "active" ? role.isActive : !role.isActive);

      return matchesSearch && matchesStatus;
    });
  });

  async function fetchRoles() {
    isLoading.value = true;
    error.value = null;

    try {
      roles.value = await RolesService.browse();
    } catch (err: any) {
      const message = err?.message || "Error al cargar roles";
      error.value = message;

      toastStore.addToast({
        severity: "error",
        title: "Error",
        message,
        duration: 3000,
      });
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteRole(id: string) {
    try {
      await RolesService.delete(id);
      roles.value = roles.value.filter((r) => r.id !== id);

      toastStore.addToast({
        severity: "success",
        title: "Rol eliminado",
        message: "El rol se eliminó correctamente",
        duration: 3000,
      });
    } catch (err: any) {
      toastStore.addToast({
        severity: "error",
        title: "Error",
        message: "No se pudo eliminar el rol",
        duration: 3000,
      });
      throw err;
    }
  }

  return {
    roles,
    filteredRoles,
    isLoading,
    error,
    searchQuery,
    statusFilter,
    fetchRoles,
    deleteRole,
  };
}

