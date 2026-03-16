<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { EmployeesService } from "@/core/services/employeesService";
import { SelectService } from "@/core/services/selectService";

import type { SelectOption } from "@/core/interfaces/select";

const { t } = useI18n();
const modalStore = useModalStore();

const branches = ref<SelectOption[]>([]);
const users = ref<SelectOption[]>([]);

const loadingCatalogs = ref(false);
const loading = ref(false);

const userId = ref("");
const branchId = ref("");
const fullName = ref("");
const nationalId = ref("");
const jobTitle = ref("");
const email = ref("");
const baseSalary = ref<number | null>(null);
const hireDate = ref("");
const terminationDate = ref("");
const isActive = ref(true);

function closeModal() {
  modalStore.close();
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const [branchesResponse, usersResponse] = await Promise.all([
      SelectService.selectBranches({ onlyActive: true }),
      SelectService.selectUsers({ onlyActive: true }),
    ]);

    branches.value = branchesResponse;
    users.value = usersResponse;
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  if (
    !userId.value.trim() ||
    !branchId.value ||
    !fullName.value.trim() ||
    !nationalId.value.trim() ||
    !jobTitle.value.trim() ||
    !email.value.trim() ||
    baseSalary.value === null ||
    !hireDate.value
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("employees.validation.requiredCreate"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await EmployeesService.create({
      userId: userId.value.trim(),
      branchId: branchId.value,
      fullName: fullName.value.trim(),
      nationalId: nationalId.value.trim(),
      jobTitle: jobTitle.value.trim(),
      email: email.value.trim(),
      baseSalary: Number(baseSalary.value),
      hireDate: hireDate.value,
      terminationDate: terminationDate.value || "",
      isActive: isActive.value,
    });

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("employees.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadCatalogs();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-4xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("employees.modal.createTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("employees.modal.createDescription") }}
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.userId") }}
        </label>
        <select
          v-model="userId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("employees.placeholders.selectUser") }}
          </option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.branch") }}
        </label>
        <select
          v-model="branchId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("employees.placeholders.selectBranch") }}
          </option>
          <option
            v-for="branch in branches"
            :key="branch.id"
            :value="branch.id"
          >
            {{ branch.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.fullName") }}
        </label>
        <input
          v-model="fullName"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.nationalId") }}
        </label>
        <input
          v-model="nationalId"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.email") }}
        </label>
        <input
          v-model="email"
          type="email"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.jobTitle") }}
        </label>
        <input
          v-model="jobTitle"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.baseSalary") }}
        </label>
        <input
          v-model.number="baseSalary"
          type="number"
          min="0"
          step="0.01"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.hireDate") }}
        </label>
        <input
          v-model="hireDate"
          type="date"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.terminationDate") }}
        </label>
        <input
          v-model="terminationDate"
          type="date"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="flex items-center gap-bt-spacing-8 pt-bt-spacing-32">
        <input v-model="isActive" type="checkbox" />
        <span class="text-bt-primary-700">
          {{ $t("employees.fields.isActive") }}
        </span>
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
