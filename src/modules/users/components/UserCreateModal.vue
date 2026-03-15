<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useModalStore } from "@/core/stores/modalStore";
import { UsersService } from "@/core/services/usersService";
import { SelectService } from "@/core/services/selectService";

interface RoleOption {
  roleId: string;
  name: string;
}

const modalStore = useModalStore();

const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const isActive = ref(true);

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const roles = ref<RoleOption[]>([]);
const selectedRoleId = ref("");

const loading = ref(false);
const loadingRoles = ref(false);

const passwordMismatch = computed(() => {
  return (
    confirmPassword.value.length > 0 && password.value !== confirmPassword.value
  );
});

function closeModal() {
  modalStore.close();
}

function normalizeSelectId(option: any): string {
  return String(option?.id ?? "").trim();
}

function normalizeSelectLabel(option: any): string {
  return String(option?.label ?? "").trim();
}

function normalizeCreatedUserId(created: any): string {
  return String(created?.userId ?? "").trim();
}

async function loadRoles() {
  loadingRoles.value = true;

  try {
    const response = await SelectService.selectRoles({
      onlyActive: true,
    });

    roles.value = (response ?? [])
      .map((option: any) => ({
        roleId: normalizeSelectId(option),
        name: normalizeSelectLabel(option),
      }))
      .filter((role: RoleOption) => role.roleId.length > 0);
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? "Failed to load roles.",
    });
  } finally {
    loadingRoles.value = false;
  }
}

async function submit() {
  if (!username.value.trim() || !email.value.trim() || !password.value.trim()) {
    modalStore.onError?.({
      code: 400,
      message: "All fields are required.",
    });
    return;
  }

  if (!selectedRoleId.value.trim()) {
    modalStore.onError?.({
      code: 400,
      message: "A role is required.",
    });
    return;
  }

  if (password.value !== confirmPassword.value) {
    modalStore.onError?.({
      code: 400,
      message: "Password and confirm password must match.",
    });
    return;
  }

  loading.value = true;

  try {
    const created = await UsersService.create({
      username: username.value.trim(),
      email: email.value.trim(),
      password: password.value,
      isActive: isActive.value,
    });

    const userId = normalizeCreatedUserId(created);

    if (!userId) {
      throw new Error("User was created but no valid userId was returned.");
    }

    await UsersService.modifyRole(userId, {
      roleId: selectedRoleId.value.trim(),
      replaceExisting: true,
    });

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? "User creation failed.",
    });
  } finally {
    loading.value = false;
  }
}

onMounted(loadRoles);
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-2xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">Create user</h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        Complete the form to register a new user.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          Username
        </label>
        <input
          v-model="username"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          Email
        </label>
        <input
          v-model="email"
          type="email"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          Password
        </label>
        <div class="relative">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="w-full pr-24 px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-bt-primary-700"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? "Hide" : "Show" }}
          </button>
        </div>
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          Confirm password
        </label>
        <div class="relative">
          <input
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="w-full pr-24 px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            :class="
              passwordMismatch ? 'border-bt-danger-500' : 'border-bt-grey-300'
            "
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-bt-primary-700"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            {{ showConfirmPassword ? "Hide" : "Show" }}
          </button>
        </div>

        <p v-if="passwordMismatch" class="mt-bt-spacing-8 text-sm text-red-600">
          Passwords do not match.
        </p>
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          Role
        </label>
        <select
          v-model="selectedRoleId"
          :disabled="loadingRoles"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500 disabled:bg-bt-grey-100"
        >
          <option value="" disabled>Select a role</option>
          <option v-for="role in roles" :key="role.roleId" :value="role.roleId">
            {{ role.name }}
          </option>
        </select>

        <div v-if="loadingRoles" class="mt-bt-spacing-8 text-bt-grey-500">
          Loading roles...
        </div>
      </div>

      <div class="md:col-span-2">
        <label class="flex items-center gap-bt-spacing-8 text-bt-primary-700">
          <input v-model="isActive" type="checkbox" />
          Active user
        </label>
      </div>
    </div>

    <div class="mt-bt-spacing-24 flex justify-end gap-bt-spacing-12">
      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeModal"
      >
        Cancel
      </button>

      <button
        type="button"
        :disabled="loading || passwordMismatch"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ loading ? "Saving..." : "Save" }}
      </button>
    </div>
  </div>
</template>
