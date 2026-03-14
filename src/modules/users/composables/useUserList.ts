// src/modules/users/composables/useUserList.ts

import { ref, computed } from 'vue';
import { UsersService } from '@/core/services/usersService';
import { useToastStore } from '@/core/stores/toast';
import type { User } from '@/core/interfaces/users';

export function useUserList() {
  const users = ref<User[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const toastStore = useToastStore();

  // Filtros
  const searchQuery = ref('');
  const statusFilter = ref<'all' | 'active' | 'inactive'>('all');
  const roleFilter = ref<string>('all');

  // Usuarios filtrados
  const filteredUsers = computed(() => {
    return users.value.filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.value.toLowerCase());
      
      const matchesStatus =
        statusFilter.value === 'all' ||
        (statusFilter.value === 'active' ? user.isActive : !user.isActive);
      
      const matchesRole =
        roleFilter.value === 'all' ||
        user.roles?.some((r) => r.name === roleFilter.value);
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  });

  async function fetchUsers() {
    isLoading.value = true;
    error.value = null;

    try {
      users.value = await UsersService.browse();
    } catch (err: any) {
      const message = err?.message || 'Error al cargar usuarios';
      error.value = message;

      toastStore.addToast({
        severity: 'error',
        title: 'Error',
        message,
        duration: 3000,
      });
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteUser(id: string) {
    try {
      await UsersService.delete(id);
      users.value = users.value.filter((u) => u.id !== id);

      toastStore.addToast({
        severity: 'success',
        title: 'Usuario eliminado',
        message: 'El usuario se eliminó correctamente',
        duration: 3000,
      });
    } catch (err: any) {
      toastStore.addToast({
        severity: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el usuario',
        duration: 3000,
      });
      throw err;
    }
  }

  async function toggleUserStatus(user: User) {
    try {
      await UsersService.update(user.id, {
        username: user.username,
        email: user.email,
        isActive: !user.isActive,
        lastLogin: user.lastLogin,
        mustChangePassword: user.mustChangePassword,
        failedAttempts: user.failedAttempts,
        lockedUntil: user.lockedUntil,
      });

      // Actualizar en la lista
      const index = users.value.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        users.value[index].isActive = !user.isActive;
      }

      toastStore.addToast({
        severity: 'success',
        title: !user.isActive ? 'Usuario activado' : 'Usuario desactivado',
        message: 'El estado del usuario se actualizó correctamente',
        duration: 3000,
      });
    } catch (err: any) {
      toastStore.addToast({
        severity: 'error',
        title: 'Error',
        message: 'No se pudo cambiar el estado del usuario',
        duration: 3000,
      });
      throw err;
    }
  }

  return {
    users,
    filteredUsers,
    isLoading,
    error,
    searchQuery,
    statusFilter,
    roleFilter,
    fetchUsers,
    deleteUser,
    toggleUserStatus,
  };
}