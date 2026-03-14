// src/modules/users/composables/useRoles.ts

import { ref } from 'vue';
import { RolesService } from '@/core/services/rolesService';

export function useRoles() {
  const roles = ref<any[]>([]);
  const isLoading = ref(false);

  async function fetchRoles() {
    isLoading.value = true;
    try {
      roles.value = await RolesService.browse();
    } catch (err) {
      console.error('Error loading roles:', err);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    roles,
    isLoading,
    fetchRoles,
  };
}