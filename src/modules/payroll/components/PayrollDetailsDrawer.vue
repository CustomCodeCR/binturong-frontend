<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { PayrollService } from "@/core/services/payrollService";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import type {
  Payroll,
  PayrollDetail,
  PayrollEmployeeHistoryItem,
} from "@/core/interfaces/payroll";

const props = defineProps<{
  payrollId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const activeTab = ref<"details" | "history">("details");

const loadingPayroll = ref(false);
const loadingHistory = ref(false);

const payroll = ref<Payroll | null>(null);
const selectedEmployeeId = ref("");
const employeeHistory = ref<PayrollEmployeeHistoryItem[]>([]);

const historyFromUtc = ref("");
const historyToUtc = ref("");

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return Number(value).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

function totalNetSalary(): number {
  return (payroll.value?.details ?? []).reduce(
    (acc, item) => acc + Number(item.netSalary ?? 0),
    0,
  );
}

async function loadPayroll() {
  loadingPayroll.value = true;

  try {
    payroll.value = await PayrollService.getPayrollById(props.payrollId);

    if (!selectedEmployeeId.value && payroll.value.details.length) {
      selectedEmployeeId.value = payroll.value.details[0].employeeId;
    }
  } catch {
    payroll.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("payroll.messages.loadDetailError"),
    });
  } finally {
    loadingPayroll.value = false;
  }
}

async function loadHistory() {
  if (!selectedEmployeeId.value) {
    employeeHistory.value = [];
    return;
  }

  loadingHistory.value = true;

  try {
    employeeHistory.value = await PayrollService.historyEmployeePayroll(
      selectedEmployeeId.value,
      {
        fromUtc: historyFromUtc.value || undefined,
        toUtc: historyToUtc.value || undefined,
      },
    );
  } catch {
    employeeHistory.value = [];

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("payroll.history.messages.loadError"),
    });
  } finally {
    loadingHistory.value = false;
  }
}

async function sendPayslip(employeeId: string) {
  if (!payroll.value) return;

  try {
    await PayrollService.sendPayrollEmail(payroll.value.payrollId, employeeId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("payroll.messages.sendEmailSuccess"),
    });
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("payroll.messages.sendEmailError"),
    });
  }
}

async function generatePayslip(employeeId: string) {
  if (!payroll.value) return;

  try {
    await PayrollService.generatePayrollPdf(
      payroll.value.payrollId,
      employeeId,
    );

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("payroll.messages.generatePdfSuccess"),
    });
  } catch {
    toastStore.addToast({
      severity: "warning",
      title: t("toast.warning"),
      message: t("payroll.messages.generatePdfWarning"),
    });
  }
}

onMounted(async () => {
  await loadPayroll();
});

watch(
  () => props.payrollId,
  async () => {
    await loadPayroll();
  },
);

watch(activeTab, async (value) => {
  if (value === "history") {
    await loadHistory();
  }
});
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("payroll.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{ $t("payroll.drawer.description") }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("common.close") }}
      </button>
    </div>

    <div class="flex flex-wrap gap-bt-spacing-8 mb-bt-spacing-24">
      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
        :class="
          activeTab === 'details'
            ? 'bg-bt-primary-500 text-bt-white'
            : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
        "
        @click="activeTab = 'details'"
      >
        {{ $t("payroll.drawer.tabs.details") }}
      </button>

      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
        :class="
          activeTab === 'history'
            ? 'bg-bt-primary-500 text-bt-white'
            : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
        "
        @click="activeTab = 'history'"
      >
        {{ $t("payroll.drawer.tabs.history") }}
      </button>
    </div>

    <div v-if="loadingPayroll" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <template v-else-if="payroll">
      <div v-if="activeTab === 'details'" class="space-y-bt-spacing-24">
        <div
          class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-bt-spacing-16"
        >
          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("payroll.fields.periodCode") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ payroll.periodCode }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("payroll.fields.startDate") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ formatDate(payroll.startDate) }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("payroll.fields.endDate") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ formatDate(payroll.endDate) }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("payroll.fields.status") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ payroll.status }}
            </div>
          </div>
        </div>

        <div
          class="rounded-m border border-bt-grey-200 bg-bt-primary-700 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-grey-200">
            {{ $t("payroll.summary.totalNet") }}
          </div>
          <div class="text-3xl font-bt-bold text-bt-accent-300 mt-bt-spacing-8">
            {{ formatMoney(totalNetSalary()) }}
          </div>
        </div>

        <div class="rounded-m border border-bt-grey-200 overflow-hidden">
          <div
            class="px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
          >
            <h3 class="font-bt-semibold text-bt-primary-700">
              {{ $t("payroll.drawer.employeeBreakdown") }}
            </h3>
          </div>

          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-bt-grey-50 text-left">
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("payroll.detail.employeeName") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("payroll.detail.grossSalary") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("payroll.detail.overtimeHours") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("payroll.detail.commissionAmount") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("payroll.detail.netSalary") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("payroll.detail.actions") }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="detail in payroll.details"
                :key="detail.payrollDetailId"
                class="border-t border-bt-grey-200"
              >
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ detail.employeeName }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ formatMoney(detail.grossSalary) }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ detail.overtimeHours }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ formatMoney(detail.commissionAmount) }}
                </td>
                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-success-700 font-bt-semibold"
                >
                  {{ formatMoney(detail.netSalary) }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <div class="flex flex-wrap gap-bt-spacing-8">
                    <button
                      type="button"
                      class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-info-100 text-bt-info-700 hover:bg-bt-info-300"
                      @click="generatePayslip(detail.employeeId)"
                    >
                      {{ $t("payroll.actions.generatePayslip") }}
                    </button>

                    <button
                      type="button"
                      class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-primary-100 text-bt-primary-700 hover:bg-bt-primary-200"
                      @click="sendPayslip(detail.employeeId)"
                    >
                      {{ $t("payroll.actions.sendPayslip") }}
                    </button>

                    <button
                      type="button"
                      class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
                      @click="
                        selectedEmployeeId = detail.employeeId;
                        activeTab = 'history';
                      "
                    >
                      {{ $t("payroll.actions.viewHistory") }}
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="!payroll.details.length">
                <td
                  colspan="6"
                  class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                >
                  {{ $t("payroll.drawer.emptyDetails") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="space-y-bt-spacing-24">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-16">
          <div>
            <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
              {{ $t("payroll.history.fields.employee") }}
            </label>
            <select
              v-model="selectedEmployeeId"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            >
              <option value="">
                {{ $t("payroll.history.placeholders.selectEmployee") }}
              </option>
              <option
                v-for="detail in payroll.details"
                :key="detail.employeeId"
                :value="detail.employeeId"
              >
                {{ detail.employeeName }}
              </option>
            </select>
          </div>

          <div>
            <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
              {{ $t("payroll.history.fields.from") }}
            </label>
            <input
              v-model="historyFromUtc"
              type="datetime-local"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />
          </div>

          <div>
            <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
              {{ $t("payroll.history.fields.to") }}
            </label>
            <input
              v-model="historyToUtc"
              type="datetime-local"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />
          </div>
        </div>

        <div class="flex gap-bt-spacing-12">
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
            @click="loadHistory"
          >
            {{ $t("payroll.actions.loadHistory") }}
          </button>
        </div>

        <div v-if="loadingHistory" class="text-bt-grey-500">
          {{ $t("common.loading") }}
        </div>

        <div v-else class="rounded-m border border-bt-grey-200 overflow-hidden">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-bt-primary-50 text-left">
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("payroll.history.table.periodCode") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("payroll.history.table.startDate") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("payroll.history.table.endDate") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("payroll.history.table.status") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("payroll.history.table.commission") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("payroll.history.table.netSalary") }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in employeeHistory"
                :key="`${item.payrollId}-${item.periodCode}`"
                class="border-t border-bt-grey-200"
              >
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ item.periodCode }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ formatDate(item.startDateUtc) }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ formatDate(item.endDateUtc) }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ item.status }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ formatMoney(item.commissionAmount) }}
                </td>
                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-success-700 font-bt-semibold"
                >
                  {{ formatMoney(item.netSalary) }}
                </td>
              </tr>

              <tr v-if="!employeeHistory.length">
                <td
                  colspan="6"
                  class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                >
                  {{ $t("payroll.history.empty") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
