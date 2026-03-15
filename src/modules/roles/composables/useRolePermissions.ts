// src/modules/roles/composables/useRolePermissions.ts

import { ref, computed } from "vue";
import { RolesService } from "@/core/services/rolesService";
import { ScopesService } from "@/core/services/scopesService";
import { useToastStore } from "@/core/stores/toastStore";
import type { Scope } from "@/core/interfaces/roles"; // ← CAMBIO: importar de roles

export function useRolePermissions() {
  const availableScopes = ref<Scope[]>([]);
  const selectedScopeIds = ref<string[]>([]);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const toastStore = useToastStore();

  // Group scopes by module
  const scopesByModule = computed(() => {
    const grouped: Record<string, Scope[]> = {};

    availableScopes.value.forEach((scope) => {
      // Extract module from scope code (e.g., "users:read" -> "users")
      const parts = scope.code.split(":");
      const module = parts[0] || "General";

      if (!grouped[module]) {
        grouped[module] = [];
      }

      grouped[module].push(scope);
    });

    return grouped;
  });

  async function fetchAvailableScopes() {
    isLoading.value = true;

    try {
      availableScopes.value = await ScopesService.browse();
    } catch (err) {
      toastStore.addToast({
        severity: "error",
        title: "Error",
        message: "No se pudieron cargar los permisos disponibles",
        duration: 3000,
      });
    } finally {
      isLoading.value = false;
    }
  }

  function loadRoleScopes(roleScopes: Scope[]) {
    // Filter out nulls from id field and map to scopeId
    selectedScopeIds.value = roleScopes
      .filter((s) => s.scopeId) // ← Asegurarse que existe scopeId
      .map((s) => s.scopeId);
  }

  function toggleScope(scopeId: string) {
    const index = selectedScopeIds.value.indexOf(scopeId);

    if (index > -1) {
      selectedScopeIds.value.splice(index, 1);
    } else {
      selectedScopeIds.value.push(scopeId);
    }
  }

  function isScopeSelected(scopeId: string): boolean {
    return selectedScopeIds.value.includes(scopeId);
  }

  async function saveRoleScopes(roleId: string): Promise<boolean> {
    isSaving.value = true;

    try {
      await RolesService.addScopes(roleId, {
        scopeIds: selectedScopeIds.value,
      });

      toastStore.addToast({
        severity: "success",
        title: "Permisos actualizados",
        message: "Los permisos del rol se actualizaron correctamente",
        duration: 3000,
      });

      return true;
    } catch (err: any) {
      toastStore.addToast({
        severity: "error",
        title: "Error",
        message: "No se pudieron actualizar los permisos",
        duration: 3000,
      });
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  return {
    availableScopes,
    selectedScopeIds,
    scopesByModule,
    isLoading,
    isSaving,
    fetchAvailableScopes,
    loadRoleScopes,
    toggleScope,
    isScopeSelected,
    saveRoleScopes,
  };
}

