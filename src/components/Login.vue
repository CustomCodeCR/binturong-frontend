<script setup lang="ts">
import { ref } from "vue";
import BTInput from "@/components/ui/BTInput.vue";
import BTButton from "@/components/ui/BTButton.vue";

const email = ref("");
const password = ref("");
const rememberMe = ref(false);

const handleLogin = () => {
  console.log("Datos de login:", {
    email: email.value,
    password: password.value,
    remember: rememberMe.value,
  });
};
</script>

<template>
  <section class="min-h-screen flex items-center justify-center bg-bt-grey-100">
    <div class="w-full max-w-md">
      <!-- Card -->
      <div class="rounded-l bg-bt-white shadow-bt-elevation-300 px-8 py-10">
        <!-- Header -->
        <div class="mb-8 text-center">
          <h1 class="bt-text-heading-4 text-bt-grey-900">
            Sign in to your account
          </h1>
          <p class="bt-text-body-s text-bt-grey-600 mt-1">
            Access the Binturong platform
          </p>
        </div>

        <!-- Form -->
        <form class="flex flex-col gap-5" @submit.prevent="handleLogin">
          <!-- Email -->
          <BTInput
            v-model:inputValue="email"
            input-id="email"
            input-type="email"
            input-placeholder="name@company.com"
          >
            <template #label>Your email</template>
          </BTInput>

          <!-- Password -->
          <BTInput
            v-model:inputValue="password"
            input-id="password"
            input-type="password"
            input-placeholder="••••••••"
          >
            <template #label>Password</template>
          </BTInput>

          <!-- Remember + Forgot -->
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="rememberMe"
                type="checkbox"
                class="h-4 w-4 rounded-s border-bt-grey-400 text-bt-primary-500 focus:ring-bt-focus"
              />
              <span class="bt-text-body-s text-bt-grey-600"> Remember me </span>
            </label>

            <router-link
              to="/forgot-password"
              class="bt-text-body-s text-bt-primary-500 hover:underline"
            >
              Forgot password?
            </router-link>
          </div>

          <!-- Submit -->
          <BTButton type="submit" variant="primary" size="lg">
            Sign in
          </BTButton>

          <!-- Footer -->
          <p class="bt-text-body-s text-bt-grey-600 text-center">
            Don’t have an account yet?
            <router-link
              to="/signup"
              class="text-bt-primary-500 font-bt-semibold hover:underline ml-1"
            >
              Sign up
            </router-link>
          </p>
        </form>
      </div>
    </div>
  </section>
</template>
