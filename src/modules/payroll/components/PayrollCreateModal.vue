<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { PayrollService } from "@/core/services/payrollService";
import { useModalStore } from "@/core/stores/modalStore";

const { t } = useI18n();
const modalStore = useModalStore();

const loading = ref(false);

const mode = ref<"create" | "calculate">("calculate");

const periodCode = ref("");
const startDate = ref("");
const endDate = ref("");
const payrollType = ref("Biweekly");
const attendanceConfirmed = ref(false);

function closeModal() {
  modalStore.close();
}

function validate(): string | null {
  if (
    !periodCode.value.trim() ||
    !startDate.value.trim() ||
    !endDate.value.trim() ||
    !payrollType.value.trim()
  ) {
    return t("payroll.validation.required");
  }

  if (new Date(endDate.value).getTime() < new Date(startDate.value).getTime()) {
    return t("payroll.validation.invalidDateRange");
  }

  if (mode.value === "calculate" && !attendanceConfirmed.value) {
    return t("payroll.validation.attendanceRequired");
  }

  return null;
}

async function submit() {
  const validationMessage = validate();

  if (validationMessage) {
    modalStore.onError?.({
      code: 400,
      message: validationMessage,
    });
    return;
  }

  loading.value = true;

  try {
    if (mode.value === "create") {
      const created = await PayrollService.createPayroll({
        periodCode: periodCode.value.trim(),
        startDate: startDate.value.trim(),
        endDate: endDate.value.trim(),
        payrollType: payrollType.value.trim(),
      });

      modalStore.onSuccess?.(created);
      modalStore.close();
      return;
    }

    const calculated = await PayrollService.calculatePayroll({
      periodCode: periodCode.value.trim(),
      startDate: startDate.value.trim(),
      endDate: endDate.value.trim(),
      payrollType: payrollType.value.trim(),
      attendanceConfirmed: attendanceConfirmed.value,
    });

    modalStore.onSuccess?.(calculated);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("payroll.messages.calculateError"),
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-2xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("payroll.modal.title") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("payroll.modal.description") }}
      </p>
    </div>

    <div class="space-y-bt-spacing-24">
      <div class="flex flex-wrap gap-bt-spacing-8">
        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
          :class="
            mode === 'calculate'
              ? 'bg-bt-primary-500 text-bt-white'
              : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
          "
          @click="mode = 'calculate'"
        >
          {{ $t("payroll.modal.modes.calculate") }}
        </button>

        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
          :class="
            mode === 'create'
              ? 'bg-bt-primary-500 text-bt-white'
              : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
          "
          @click="mode = 'create'"
        >
          {{ $t("payroll.modal.modes.createDraft") }}
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payroll.fields.periodCode") }}
          </label>
          <input
            v-model="periodCode"
            type="text"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payroll.fields.payrollType") }}
          </label>
          <select
            v-model="payrollType"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="Weekly">{{ $t("payroll.types.weekly") }}</option>
            <option value="Biweekly">{{ $t("payroll.types.biweekly") }}</option>
            <option value="Monthly">{{ $t("payroll.types.monthly") }}</option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payroll.fields.startDate") }}
          </label>
          <input
            v-model="startDate"
            type="date"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payroll.fields.endDate") }}
          </label>
          <input
            v-model="endDate"
            type="date"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div
          v-if="mode === 'calculate'"
          class="md:col-span-2 rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
        >
          <label
            class="inline-flex items-center gap-bt-spacing-8 text-bt-primary-700"
          >
            <input v-model="attendanceConfirmed" type="checkbox" />
            <span>{{ $t("payroll.fields.attendanceConfirmed") }}</span>
          </label>

          <p class="text-sm text-bt-grey-600 mt-bt-spacing-8">
            {{ $t("payroll.fields.attendanceConfirmedHint") }}
          </p>
        </div>
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
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
          @click="submit"
        >
          {{
            loading
              ? $t("common.loading")
              : mode === "calculate"
                ? $t("payroll.actions.calculate")
                : $t("common.save")
          }}
        </button>
      </div>
    </div>
  </div>
</template>
