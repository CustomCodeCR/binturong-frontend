<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { PayrollService } from "@/core/services/payrollService";
import { SelectService } from "@/core/services/selectService";
import { useModalStore } from "@/core/stores/modalStore";

import type { SelectOption } from "@/core/interfaces/select";

const { t } = useI18n();
const modalStore = useModalStore();

const loadingCatalogs = ref(false);
const loading = ref(false);

const employees = ref<SelectOption[]>([]);

const employeeId = ref("");
const workDate = ref("");
const hours = ref<number | null>(null);
const notes = ref("");

function closeModal() {
  modalStore.close();
}

async function loadEmployees() {
  loadingCatalogs.value = true;

  try {
    employees.value = await SelectService.selectEmployees({ onlyActive: true });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  if (!employeeId.value.trim() || !workDate.value.trim() || !hours.value) {
    modalStore.onError?.({
      code: 400,
      message: t("payroll.overtime.validation.required"),
    });
    return;
  }

  if (Number(hours.value) <= 0 || Number(hours.value) > 16) {
    modalStore.onError?.({
      code: 400,
      message: t("payroll.overtime.validation.invalidHours"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await PayrollService.createOvertimePayroll({
      employeeId: employeeId.value.trim(),
      workDate: workDate.value.trim(),
      hours: Number(hours.value),
      notes: notes.value.trim(),
    });

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("payroll.overtime.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadEmployees();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-2xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("payroll.overtime.modal.title") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("payroll.overtime.modal.description") }}
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="space-y-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("payroll.overtime.fields.employee") }}
        </label>
        <select
          v-model="employeeId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("payroll.overtime.placeholders.selectEmployee") }}
          </option>
          <option
            v-for="employee in employees"
            :key="employee.id"
            :value="employee.id"
          >
            {{ employee.label }}
          </option>
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payroll.overtime.fields.workDate") }}
          </label>
          <input
            v-model="workDate"
            type="date"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payroll.overtime.fields.hours") }}
          </label>
          <input
            v-model.number="hours"
            type="number"
            min="0"
            step="0.5"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("payroll.overtime.fields.notes") }}
        </label>
        <textarea
          v-model="notes"
          rows="3"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="flex justify-end gap-bt-spacing-12">
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
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700 disabled:bg-bt-disabled"
          @click="submit"
        >
          {{ loading ? $t("common.loading") : $t("common.save") }}
        </button>
      </div>
    </div>
  </div>
</template>
