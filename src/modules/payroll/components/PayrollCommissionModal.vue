<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { PayrollService } from "@/core/services/payrollService";
import { useModalStore } from "@/core/stores/modalStore";

const props = defineProps<{
  payrollId: string;
  payrollDetailId: string;
  employeeId: string;
  employeeName: string;
  currentCommissionAmount: number;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const loading = ref(false);
const commissionAmount = ref<number>(
  Number(props.currentCommissionAmount ?? 0),
);

function closeModal() {
  modalStore.close();
}

async function submit() {
  if (
    Number.isNaN(Number(commissionAmount.value)) ||
    Number(commissionAmount.value) < 0
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("payroll.commissions.validation.invalidAmount"),
    });
    return;
  }

  loading.value = true;

  try {
    await PayrollService.addCommisionPayroll(
      props.payrollId,
      props.payrollDetailId,
      {
        commissionAmount: Number(commissionAmount.value),
      },
    );

    modalStore.onSuccess?.({
      payrollId: props.payrollId,
      payrollDetailId: props.payrollDetailId,
      employeeId: props.employeeId,
    });

    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("payroll.commissions.messages.updateError"),
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("payroll.commissions.modal.title") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{
          $t("payroll.commissions.modal.description", {
            employee: employeeName,
          })
        }}
      </p>
    </div>

    <div class="space-y-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("payroll.commissions.fields.amount") }}
        </label>
        <input
          v-model.number="commissionAmount"
          type="number"
          min="0"
          step="0.01"
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
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-info-500 text-bt-white hover:bg-bt-info-700 disabled:bg-bt-disabled"
          @click="submit"
        >
          {{ loading ? $t("common.loading") : $t("common.save") }}
        </button>
      </div>
    </div>
  </div>
</template>
