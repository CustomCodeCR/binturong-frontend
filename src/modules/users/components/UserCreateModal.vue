<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useModalStore } from "@/core/stores/modalStore";
import { UsersService } from "@/core/services/usersService";
import { SelectService } from "@/core/services/selectService";
import { useValidation } from "@/shared/composables/useValidation";
import BTFieldError from "@/shared/components/ui/BTFieldError.vue";

interface RoleOption {
  roleId: string;
  name: string;
}

const { t } = useI18n();
const modalStore = useModalStore();
const { rules, validate, getError, fieldClass, firstError } = useValidation();

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
      message: error?.message ?? t("users.messages.loadError"),
    });
  } finally {
    loadingRoles.value = false;
  }
}

function validateForm(): boolean {
  const usernameLabel = t("users.fields.username");
  const emailLabel = t("users.fields.email");
  const passwordLabel = t("users.fields.password");
  const roleLabel = t("users.fields.roles");
  const confirmLabel = t("users.fields.confirmPassword");

  return validate(
    {
      username: username.value,
      email: email.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
      roleId: selectedRoleId.value,
    },
    {
      username: [
        rules.required(usernameLabel),
        rules.minLength(3, usernameLabel),
        rules.maxLength(50, usernameLabel),
      ],
      email: [rules.required(emailLabel), rules.email(emailLabel)],
      password: [rules.required(passwordLabel), rules.password(passwordLabel)],
      confirmPassword: [
        rules.required(confirmLabel),
        rules.sameAs(() => password.value, confirmLabel, passwordLabel),
      ],
      roleId: [rules.required(roleLabel)],
    },
  );
}

async function submit() {
  if (!validateForm()) {
    modalStore.onError?.({ code: 400, message: firstError.value });
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
      message: error?.message ?? t("users.messages.createError"),
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
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("users.modal.createTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("users.modal.createDescription") }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("users.fields.username") }}
        </label>
        <input
          v-model="username"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('username')"
        />
        <BTFieldError :message="getError('username')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("users.fields.email") }}
        </label>
        <input
          v-model="email"
          type="email"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('email')"
        />
        <BTFieldError :message="getError('email')" />
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("users.fields.password") }}
        </label>
        <div class="relative">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="w-full pr-24 px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            :class="fieldClass('password')"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-bt-primary-700"
            @click="showPassword = !showPassword"
          >
            {{
              showPassword ? $t("users.actions.hide") : $t("users.actions.show")
            }}
          </button>
        </div>
        <p class="mt-bt-spacing-8 text-sm text-bt-grey-600">
          {{ $t("users.validation.passwordHint") }}
        </p>
        <BTFieldError :message="getError('password')" />
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("users.fields.confirmPassword") }}
        </label>
        <div class="relative">
          <input
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            class="w-full pr-24 px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            :class="
              passwordMismatch
                ? 'border-bt-error-500'
                : fieldClass('confirmPassword')
            "
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-bt-primary-700"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            {{
              showConfirmPassword
                ? $t("users.actions.hide")
                : $t("users.actions.show")
            }}
          </button>
        </div>

        <BTFieldError
          :message="
            passwordMismatch
              ? $t('users.validation.passwordMismatch')
              : getError('confirmPassword')
          "
        />
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("users.fields.roles") }}
        </label>
        <select
          v-model="selectedRoleId"
          :disabled="loadingRoles"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500 disabled:bg-bt-grey-100"
          :class="fieldClass('roleId')"
        >
          <option value="" disabled>{{ $t("common.selectOption") }}</option>
          <option v-for="role in roles" :key="role.roleId" :value="role.roleId">
            {{ role.name }}
          </option>
        </select>

        <div v-if="loadingRoles" class="mt-bt-spacing-8 text-bt-grey-500">
          {{ $t("users.validation.loadingRoles") }}
        </div>
        <BTFieldError :message="getError('roleId')" />
      </div>

      <div class="md:col-span-2">
        <label class="flex items-center gap-bt-spacing-8 text-bt-primary-700">
          <input v-model="isActive" type="checkbox" />
          {{ $t("users.fields.isActive") }}
        </label>
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
        :disabled="loading"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ loading ? $t("common.loading") : $t("common.save") }}
      </button>
    </div>
  </div>
</template>
