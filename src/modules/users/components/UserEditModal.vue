<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useModalStore } from "@/core/stores/modalStore";
import { UsersService } from "@/core/services/usersService";
import { SelectService } from "@/core/services/selectService";
import type { User } from "@/core/interfaces/users";

interface RoleOption {
  roleId: string;
  name: string;
}

const props = defineProps<{
  userId: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const loading = ref(false);
const saving = ref(false);
const loadingRoles = ref(false);

const user = ref<User | null>(null);
const roleOptions = ref<RoleOption[]>([]);

// ← CAMBIO: Array de roleIds en lugar de string único
const selectedRoleIds = ref<string[]>([]);

const username = ref("");
const email = ref("");
const isActive = ref(true);
const lastLogin = ref<string | null>(null);
const mustChangePassword = ref(false);
const failedAttempts = ref(0);
const lockedUntil = ref<string | null>(null);

function closeModal() {
  modalStore.close();
}

function normalizeSelectId(option: any): string {
  return String(option?.id ?? "").trim();
}

function normalizeSelectLabel(option: any): string {
  return String(option?.label ?? "").trim();
}

async function loadRoles() {
  loadingRoles.value = true;

  try {
    const response = await SelectService.selectRoles({
      onlyActive: true,
    });

    roleOptions.value = (response ?? [])
      .map((option: any) => ({
        roleId: normalizeSelectId(option),
        name: normalizeSelectLabel(option),
      }))
      .filter((role: RoleOption) => role.roleId.length > 0);
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("users.messages.rolesLoadError"),
    });
  } finally {
    loadingRoles.value = false;
  }
}

async function loadUser() {
  loading.value = true;

  try {
    const response = await UsersService.readById(props.userId);
    user.value = response;

    username.value = response.username ?? "";
    email.value = response.email ?? "";
    isActive.value = response.isActive ?? true;
    lastLogin.value = response.lastLogin ?? null;
    mustChangePassword.value = response.mustChangePassword ?? false;
    failedAttempts.value = response.failedAttempts ?? 0;
    lockedUntil.value = response.lockedUntil ?? null;

    // ← CAMBIO: Cargar TODOS los roleIds del usuario
    selectedRoleIds.value = (response.roles ?? [])
      .map((role) => String(role.roleId ?? "").trim())
      .filter((id) => id.length > 0);
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("users.messages.readError"),
    });
  } finally {
    loading.value = false;
  }
}

// ← NUEVA FUNCIÓN: Sincronizar múltiples roles
// ← NUEVA FUNCIÓN: Sincronizar múltiples roles
async function syncRoles() {
  if (!user.value) {
    return;
  }

  // Roles actuales del usuario
  const currentRoleIds = (user.value.roles ?? [])
    .map((role) => String(role.roleId ?? "").trim())
    .filter((id) => id.length > 0)
    .sort();

  // Roles seleccionados en el formulario
  const nextRoleIds = selectedRoleIds.value
    .map((id) => String(id ?? "").trim())
    .filter((id) => id.length > 0)
    .sort();

  // Roles a eliminar (están en current pero NO en next)
  const rolesToRemove = currentRoleIds.filter((id) => !nextRoleIds.includes(id));

  // Roles a agregar (están en next pero NO en current)
  const rolesToAdd = nextRoleIds.filter((id) => !currentRoleIds.includes(id));

  console.log("🔍 syncRoles DEBUG:");
  console.log("  currentRoleIds:", currentRoleIds);
  console.log("  nextRoleIds:", nextRoleIds);
  console.log("  rolesToRemove:", rolesToRemove);
  console.log("  rolesToAdd:", rolesToAdd);

  // Eliminar roles uno por uno
  for (const roleId of rolesToRemove) {
    console.log(`  → Removing role: ${roleId}`);
    await UsersService.removeRole(user.value.userId, roleId);
  }

  // Agregar roles uno por uno
  for (const roleId of rolesToAdd) {
    console.log(`  → Adding role: ${roleId} with replaceExisting: false`);
    await UsersService.modifyRole(user.value.userId, {
      roleId: roleId,
      replaceExisting: false, // ← NO reemplazar, solo agregar
    });
  }
}

async function submit() {
  if (!user.value) {
    return;
  }

  if (!username.value.trim() || !email.value.trim()) {
    modalStore.onError?.({
      code: 400,
      message: t("users.validation.requiredUpdate"),
    });
    return;
  }

  saving.value = true;

  try {
    // 1. Actualizar datos del usuario
    await UsersService.update(user.value.userId, {
      username: username.value.trim(),
      email: email.value.trim(),
      isActive: isActive.value,
      lastLogin: lastLogin.value,
      mustChangePassword: mustChangePassword.value,
      failedAttempts: failedAttempts.value,
      lockedUntil: lockedUntil.value,
    });

    // 2. Sincronizar roles
    await syncRoles();

    // 3. Preparar payload de éxito con los roles seleccionados
    const selectedRoles = roleOptions.value.filter((role) =>
      selectedRoleIds.value.includes(role.roleId),
    );

    modalStore.onSuccess?.({
      userId: user.value.userId,
      username: username.value.trim(),
      email: email.value.trim(),
      isActive: isActive.value,
      lastLogin: lastLogin.value,
      mustChangePassword: mustChangePassword.value,
      failedAttempts: failedAttempts.value,
      lockedUntil: lockedUntil.value,
      roles: selectedRoles.map((role) => ({
        roleId: role.roleId,
        name: role.name,
      })),
    });

    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("users.messages.updateError"),
    });
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadRoles(), loadUser()]);
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-2xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("users.modal.editTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("users.modal.editDescription") }}
      </p>
    </div>

    <div v-if="loading" class="py-bt-spacing-24 text-center text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("users.fields.username") }}
        </label>
        <input
          v-model="username"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("users.fields.email") }}
        </label>
        <input
          v-model="email"
          type="email"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <!-- ← CAMBIO: Checkboxes para múltiples roles -->
      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("users.fields.roles") }}
        </label>

        <div
          v-if="loadingRoles"
          class="py-bt-spacing-12 text-center text-bt-grey-500"
        >
          {{ $t("users.validation.loadingRoles") }}
        </div>

        <div
          v-else
          class="space-y-bt-spacing-8 max-h-48 overflow-y-auto border border-bt-grey-300 rounded-m p-bt-spacing-12 bg-bt-grey-50"
        >
          <label
            v-for="role in roleOptions"
            :key="role.roleId"
            class="flex items-center gap-bt-spacing-8 p-bt-spacing-8 hover:bg-bt-white rounded cursor-pointer transition"
          >
            <input
              type="checkbox"
              :value="role.roleId"
              v-model="selectedRoleIds"
              class="rounded border-bt-grey-300 text-bt-accent-500 focus:ring-bt-accent-500"
            />
            <span class="text-bt-primary-700">{{ role.name }}</span>
          </label>

          <div
            v-if="!roleOptions.length"
            class="text-center text-bt-grey-500 py-bt-spacing-12"
          >
            {{ $t("users.validation.noRolesAvailable") }}
          </div>
        </div>

        <p class="mt-bt-spacing-8 text-xs text-bt-grey-500">
          {{ $t("users.validation.selectMultipleRoles") }}
        </p>
      </div>

      <div class="flex items-center gap-bt-spacing-8">
        <input v-model="isActive" type="checkbox" />
        <span class="text-bt-primary-700">
          {{ $t("users.fields.isActive") }}
        </span>
      </div>

      <div class="flex items-center gap-bt-spacing-8">
        <input v-model="mustChangePassword" type="checkbox" />
        <span class="text-bt-primary-700">
          {{ $t("users.fields.mustChangePassword") }}
        </span>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("users.fields.failedAttempts") }}
        </label>
        <input
          v-model.number="failedAttempts"
          type="number"
          min="0"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("users.fields.lockedUntil") }}
        </label>
        <input
          v-model="lockedUntil"
          type="text"
          placeholder="2026-03-14T10:00:00Z"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>
    </div>

    <div class="mt-bt-spacing-24 flex justify-end gap-bt-spacing-12">
      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeModal"
      >
        {{ $t("common.cancel") }}
      </button>

      <button
        type="button"
        :disabled="saving"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ saving ? $t("common.loading") : $t("users.actions.saveChanges") }}
      </button>
    </div>
  </div>
</template>