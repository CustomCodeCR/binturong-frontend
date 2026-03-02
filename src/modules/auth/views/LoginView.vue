<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import BTButton from "@/shared/components/ui/BTButton.vue";
import BTInput from "@/shared/components/ui/BTInput.vue";
import { AuthService } from "@/core/services/authService";
import type { LoginRequest } from "@/core/interfaces/auth";

const router = useRouter();
const auth = AuthService;

const email = ref("admin@system.local");
const password = ref("Admin123!");
const loading = ref(false);
const error = ref("");

const login = async () => {
  error.value = "";

  if (!email.value || !password.value) {
    error.value = "Todos los campos son obligatorios";
    return;
  }

  loading.value = true;
  try {
    const payload: LoginRequest = {
      usernameOrEmail: email.value,
      password: password.value,
    };

    await auth.login(payload);

    router.push("/home");
  } catch (e: any) {
    error.value = e?.message ?? "No se pudo iniciar sesión";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800"
  >
    <div
      class="w-full max-w-md bg-slate-900/90 backdrop-blur rounded-2xl shadow-2xl p-8 border border-slate-700"
    >
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white">{{ $t("businessName") }}</h1>
        <p class="text-slate-400 mt-2">{{ $t("acceso") }}</p>
      </div>

      <div
        v-if="error"
        class="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg p-3"
      >
        {{ error }}
      </div>

      <form @submit.prevent="login" class="space-y-5">
        <div>
          <label class="block text-sm text-slate-300 mb-1">{{
            $t("email")
          }}</label>
          <BTInput
            v-model="email"
            type="text"
            variant="login"
            :disabled="loading"
            :error="!!error"
          />
        </div>

        <div>
          <label class="block text-sm text-slate-300 mb-1">{{
            $t("password")
          }}</label>
          <BTInput
            v-model="password"
            type="password"
            variant="login"
            :disabled="loading"
            :error="!!error"
          />
        </div>

        <BTButton
          variant="blue"
          size="cta"
          fullWidth
          type="submit"
          :disabled="loading"
        >
          <span v-if="!loading">{{ $t("login") }}</span>
          <span v-else>Cargando...</span>
        </BTButton>
      </form>

      <div class="text-center text-xs text-slate-500 mt-6">
        {{ $t("copyRigth") }}
      </div>
    </div>
  </div>
</template>
