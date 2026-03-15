<!-- src/modules/roles/views/RolesView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BTButton from '@/shared/components/ui/BTButton.vue';
import BTHeader from '@/shared/components/ui/BTHeader.vue';
import BTModal from '@/shared/components/ui/BTModal.vue';
import BTInput from '@/shared/components/ui/BTInput.vue';
import BTTextArea from '@/shared/components/ui/BTTextArea.vue';
import BTCheckBox from '@/shared/components/ui/BTCheckBox.vue';

import { useRoleList } from '../composables/useRoleList';
import { useRoleForm } from '../composables/useRoleForm';
import { useRolePermissions } from '../composables/useRolePermissions';

import type { Role } from '@/core/interfaces/roles';

// Composables
const {
  filteredRoles,
  isLoading,
  searchQuery,
  statusFilter,
  fetchRoles,
  deleteRole,
} = useRoleList();

const {
  formData,
  isSubmitting,
  createRole,
  updateRole,
  resetForm,
  loadRole,
  getError,
  markAsTouched,
} = useRoleForm();

const {
  scopesByModule,
  isLoading: isLoadingScopes,
  isSaving: isSavingScopes,
  fetchAvailableScopes,
  loadRoleScopes,
  toggleScope,
  isScopeSelected,
  saveRoleScopes,
} = useRolePermissions();

// Local state
const showFormModal = ref(false);
const showPermissionsModal = ref(false);
const showDeleteModal = ref(false);
const isEditing = ref(false);
const selectedRoleId = ref<string | null>(null);
const roleToDelete = ref<string | null>(null);

// Init
onMounted(async () => {
  await Promise.all([fetchRoles(), fetchAvailableScopes()]);
});

// Actions - Form
function openCreate() {
  isEditing.value = false;
  selectedRoleId.value = null;
  resetForm();
  showFormModal.value = true;
}

function openEdit(role: Role) {
  isEditing.value = true;
  selectedRoleId.value = role.id;
  loadRole(role);
  showFormModal.value = true;
}

async function handleSubmit() {
  const success = isEditing.value
    ? await updateRole(selectedRoleId.value!)
    : await createRole();

  if (success) {
    showFormModal.value = false;
    await fetchRoles();
  }
}

// Actions - Permissions
function openPermissions(role: Role) {
  selectedRoleId.value = role.id;
  loadRoleScopes(role.scopes);
  showPermissionsModal.value = true;
}

async function handleSavePermissions() {
  if (!selectedRoleId.value) return;

  const success = await saveRoleScopes(selectedRoleId.value);

  if (success) {
    showPermissionsModal.value = false;
    await fetchRoles();
  }
}

// Actions - Delete
function openDeleteConfirm(roleId: string) {
  roleToDelete.value = roleId;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!roleToDelete.value) return;

  try {
    await deleteRole(roleToDelete.value);
    showDeleteModal.value = false;
    roleToDelete.value = null;
  } catch (err) {
    // Error handled by composable
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- HEADER -->
    <BTHeader>
      <template #title>Control de Roles</template>
      <template #description>Administra roles y permisos del sistema</template>
      <template #action>
        <BTButton variant="blue" size="md" shape="rounded" @click="openCreate">
          + Nuevo Rol
        </BTButton>
      </template>
    </BTHeader>

    <!-- FILTERS -->
    <div class="bg-white p-4 rounded-xl border flex gap-4">
      <input
        v-model="searchQuery"
        placeholder="Buscar rol..."
        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <select
        v-model="statusFilter"
        class="px-4 py-2 border border-gray-300 rounded-lg"
      >
        <option value="all">Todos los estados</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
      </select>
    </div>

    <!-- LOADING -->
    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"
      />
    </div>

    <!-- EMPTY STATE -->
    <div
      v-else-if="filteredRoles.length === 0"
      class="text-center py-12 text-gray-500"
    >
      No se encontraron roles
    </div>

    <!-- ROLES GRID -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="role in filteredRoles"
        :key="role.id"
        class="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between mb-3">
          <h3 class="text-lg font-bold text-gray-900">{{ role.name }}</h3>
          <span
            :class="[
              'px-2 py-1 rounded text-xs font-semibold',
              role.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600',
            ]"
          >
            {{ role.isActive ? 'Activo' : 'Inactivo' }}
          </span>
        </div>

        <p class="text-sm text-gray-600 mb-4">
          {{ role.description || 'Sin descripción' }}
        </p>

        <div class="text-xs text-gray-500 mb-4">
          {{ role.scopes.length }} permiso(s) asignado(s)
        </div>

        <div class="flex gap-2">
          <button
            @click="openEdit(role)"
            class="text-blue-600 hover:text-blue-800 font-semibold text-sm"
          >
            Editar
          </button>
          <button
            @click="openPermissions(role)"
            class="text-violet-600 hover:text-violet-800 font-semibold text-sm"
          >
            Permisos
          </button>
          <button
            @click="openDeleteConfirm(role.id)"
            class="text-red-600 hover:text-red-800 font-semibold text-sm"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- FORM MODAL -->
    <BTModal
      v-model="showFormModal"
      :title="isEditing ? 'Editar Rol' : 'Nuevo Rol'"
      size="medium"
    >
      <template #default>
        <div class="space-y-4">
          <BTInput
            v-model:inputValue="formData.name"
            :error="!!getError('name')"
            :errorMsg="getError('name')"
            @blur="markAsTouched('name')"
          >
            <template #label>Nombre del rol</template>
          </BTInput>

          <BTTextArea
            v-model:textValue="formData.description"
            :error="!!getError('description')"
            :errorMsg="getError('description')"
            @blur="markAsTouched('description')"
            :rows="3"
          >
            <template #label>Descripción</template>
          </BTTextArea>

          <BTCheckBox v-model:checked="formData.isActive">
            <template #label>Rol activo</template>
          </BTCheckBox>
        </div>
      </template>

      <template #footer>
        <BTButton
          variant="secondary"
          size="md"
          shape="rounded"
          @click="showFormModal = false"
        >
          Cancelar
        </BTButton>

        <BTButton
          variant="blue"
          size="md"
          shape="rounded"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          {{ isEditing ? 'Actualizar' : 'Crear' }}
        </BTButton>
      </template>
    </BTModal>

    <!-- PERMISSIONS MODAL -->
    <BTModal
      v-model="showPermissionsModal"
      title="Configurar Permisos"
      size="large"
    >
      <template #default>
        <div v-if="isLoadingScopes" class="text-center py-8">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          />
        </div>

        <div v-else class="space-y-6">
          <div
            v-for="(scopes, module) in scopesByModule"
            :key="module"
            class="border rounded-lg p-4"
          >
            <h4 class="font-bold text-gray-900 mb-3 capitalize">
              {{ module }}
            </h4>

            <div class="space-y-2">
              <label
                v-for="scope in scopes"
                :key="scope.scopeId"
                class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  :checked="isScopeSelected(scope.scopeId)"
                  @change="toggleScope(scope.scopeId)"
                  class="rounded"
                />
                <div class="flex-1">
                  <div class="font-medium text-sm">{{ scope.code }}</div>
                  <div v-if="scope.description" class="text-xs text-gray-500">
                    {{ scope.description }}
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <BTButton
          variant="secondary"
          size="md"
          shape="rounded"
          @click="showPermissionsModal = false"
        >
          Cancelar
        </BTButton>

        <BTButton
          variant="blue"
          size="md"
          shape="rounded"
          :loading="isSavingScopes"
          :disabled="isSavingScopes"
          @click="handleSavePermissions"
        >
          Guardar Permisos
        </BTButton>
      </template>
    </BTModal>

    <!-- DELETE CONFIRMATION MODAL -->
    <BTModal
      v-model="showDeleteModal"
      title="Confirmar Eliminación"
      size="small"
    >
      <template #default>
        <p class="text-gray-700">
          ¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede
          deshacer.
        </p>
      </template>

      <template #footer>
        <BTButton
          variant="secondary"
          size="md"
          shape="rounded"
          @click="showDeleteModal = false"
        >
          Cancelar
        </BTButton>

        <BTButton
          variant="destructive"
          size="md"
          shape="rounded"
          @click="handleDelete"
        >
          Eliminar
        </BTButton>
      </template>
    </BTModal>
  </div>
</template>