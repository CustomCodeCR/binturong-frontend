<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import BTButton from "@/components/ui/BTButton.vue";

const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const login = async () => {
  error.value = "";

  if (!email.value || !password.value) {
    error.value = "Todos los campos son obligatorios";
    return;
  }

  loading.value = true;

  // Simulación de login (luego lo conectás al backend)
  setTimeout(() => {
    loading.value = false;

    if (email.value === "admin@admin.com" && password.value === "123456") {
      router.push("/home");
    } else {
      error.value = "Credenciales incorrectas";
    }
  }, 1200);
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800"
  >
    <div
      class="w-full max-w-md bg-slate-900/90 backdrop-blur rounded-2xl shadow-2xl p-8 border border-slate-700"
    >
      <!-- Logo / Título -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white">Cerrajería Calderón</h1>
        <p class="text-slate-400 mt-2">Acceso al sistema</p>
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg p-3"
      >
        {{ error }}
      </div>

      <!-- Form -->
      <form @submit.prevent="login" class="space-y-5">
        <div>
          <label class="block text-sm text-slate-300 mb-1">{{
            $t("email")
          }}</label>
          <input
            v-model="email"
            type="email"
            class="w-full px-4 py-2 rounded-xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm text-slate-300 mb-1">{{
            $t("password")
          }}</label>
          <input
            v-model="password"
            type="password"
            class="w-full px-4 py-2 rounded-xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <BTButton variant="blue" size="cta" fullWidth type="submit">
          {{ $t("login") }}
        </BTButton>
      </form>

      <!-- Footer -->
      <div class="text-center text-xs text-slate-500 mt-6">
        {{ $t("copyRigth") }}
      </div>
    </div>
  </div>
</template>
