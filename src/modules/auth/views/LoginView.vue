<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import { useAuthStore } from "@/core/stores/authStore";
import { useToastStore } from "@/core/stores/toastStore";

import type { LoginRequest } from "@/core/interfaces/auth";

const router = useRouter();
const { t } = useI18n();

const authStore = useAuthStore();
const toastStore = useToastStore();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);

async function login() {
  const normalizedEmail = email.value.trim();
  const normalizedPassword = password.value.trim();

  if (!normalizedEmail || !normalizedPassword) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("auth.errors.requiredFields"),
    });
    return;
  }

  loading.value = true;

  try {
    const payload: LoginRequest = {
      usernameOrEmail: normalizedEmail,
      password: normalizedPassword,
    };

    await authStore.login(payload);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("auth.messages.loginSuccess"),
    });

    router.push("/home");
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("auth.errors.loginFailed"),
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-bt-primary-700 to-bt-primary-900"
  >
    <div
      class="w-full max-w-md bg-bt-primary-600/90 backdrop-blur rounded-l shadow-bt-elevation-400 p-bt-spacing-32 border border-bt-primary-400"
    >
      <!-- header -->

      <div class="text-center mb-bt-spacing-32">
        <h1 class="text-3xl font-bt-bold text-bt-white">
          {{ $t("businessName") }}
        </h1>

        <p class="text-bt-grey-300 mt-bt-spacing-8">
          {{ $t("acceso") }}
        </p>
      </div>

      <!-- form -->

      <form @submit.prevent="login" class="space-y-bt-spacing-24">
        <!-- email -->

        <div>
          <label class="block text-sm text-bt-grey-200 mb-bt-spacing-8">
            {{ $t("email") }}
          </label>

          <input
            v-model="email"
            type="text"
            placeholder="admin@system.local"
            :disabled="loading"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-800 border border-bt-primary-400 text-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <!-- password -->

        <div class="relative">
          <label class="block text-sm text-bt-grey-200 mb-bt-spacing-8">
            {{ $t("password") }}
          </label>

          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :disabled="loading"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 pr-12 rounded-m bg-bt-primary-800 border border-bt-primary-400 text-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />

          <!-- toggle -->

          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-9 text-bt-grey-400 hover:text-bt-white"
          >
            <span v-if="showPassword">🙈</span>
            <span v-else>👁</span>
          </button>
        </div>

        <!-- button -->

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-bt-spacing-12 rounded-m font-bt-semibold bg-bt-accent-500 hover:bg-bt-accent-600 transition-colors text-bt-white disabled:bg-bt-disabled disabled:cursor-not-allowed"
        >
          <span v-if="!loading">
            {{ $t("login") }}
          </span>

          <span v-else>
            {{ $t("common.loading") }}
          </span>
        </button>
      </form>

      <!-- footer -->

      <div class="text-center text-xs text-bt-grey-400 mt-bt-spacing-32">
        {{ $t("copyRigth") }}
      </div>
    </div>
  </div>
</template>
