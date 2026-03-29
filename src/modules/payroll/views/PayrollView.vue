<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  Calculator,
  Clock3,
  HandCoins,
  MoreHorizontal,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";

import { PayrollService } from "@/core/services/payrollService";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import PayrollCreateModal from "@/modules/payroll/components/PayrollCreateModal.vue";
import PayrollOvertimeModal from "@/modules/payroll/components/PayrollOvertimeModal.vue";
import PayrollDetailsDrawer from "@/modules/payroll/components/PayrollDetailsDrawer.vue";
import PayrollRowActionMenu from "@/modules/payroll/components/PayrollRowActionMenu.vue";

import type { Payroll } from "@/core/interfaces/payroll";

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const loading = ref(false);
const payrolls = ref<Payroll[]>([]);
const page = ref(1);
const pageSize = ref(10);

const searchPeriodCode = ref("");
const searchStatus = ref("");
const searchFromUtc = ref("");
const searchToUtc = ref("");

const MAX_PAGE = 100;

const filteredPayrolls = computed(() => {
  let result = payrolls.value;

  const periodTerm = searchPeriodCode.value.trim().toLowerCase();
  if (periodTerm) {
    result = result.filter((p) =>
      (p.periodCode ?? "").toLowerCase().includes(periodTerm),
    );
  }

  const statusTerm = searchStatus.value.trim().toLowerCase();
  if (statusTerm) {
    result = result.filter((p) =>
      (p.status ?? "").toLowerCase().includes(statusTerm),
    );
  }

  return result;
});

const pageNumbers = computed(() => {
  const current = page.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);
  const pages: number[] = [];
  for (let index = start; index <= end; index += 1) pages.push(index);
  return pages;
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < MAX_PAGE);

const summary = computed(() => {
  const totalPayrolls = payrolls.value.length;

  const uniqueEmployeeIds = new Set(
    payrolls.value.flatMap((p) => (p.details ?? []).map((d) => d.employeeId)),
  );

  const totalNet = payrolls.value.reduce((acc, p) => acc + totalNetSalary(p), 0);

  const totalCommissions = payrolls.value.reduce((acc, p) => {
    return (
      acc +
      (p.details ?? []).reduce(
        (detailAcc, d) => detailAcc + Number(d.commissionAmount ?? 0),
        0,
      )
    );
  }, 0);

  return { totalPayrolls, totalEmployees: uniqueEmployeeIds.size, totalNet, totalCommissions };
});

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CR");
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CR");
}

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function countEmployees(payroll: Payroll): number {
  return payroll.details?.length ?? 0;
}

function totalNetSalary(payroll: Payroll): number {
  return (payroll.details ?? []).reduce(
    (acc, item) => acc + Number(item.netSalary ?? 0),
    0,
  );
}

function totalGrossSalary(payroll: Payroll): number {
  return (payroll.details ?? []).reduce(
    (acc, item) => acc + Number(item.grossSalary ?? 0),
    0,
  );
}

async function loadPayrolls() {
  loading.value = true;
  try {
    payrolls.value = await PayrollService.getPayrolls({
      fromtUtc: searchFromUtc.value || undefined,
      toUtc: searchToUtc.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
    });
  } catch {
    payrolls.value = [];
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("payroll.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

async function onSearch() {
  page.value = 1;
  await loadPayrolls();
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) return;
  page.value = targetPage;
  await loadPayrolls();
}

async function goPrevious() {
  if (!canGoPrevious.value) return;
  await goToPage(page.value - 1);
}

async function goNext() {
  if (!canGoNext.value) return;
  await goToPage(page.value + 1);
}

function openCreatePayrollModal() {
  modalStore.open({
    component: PayrollCreateModal,
    props: {},
    onSuccess: async () => {
      toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("payroll.messages.createSuccess") });
      await loadPayrolls();
    },
    onError: (error) => {
      toastStore.addToast({ severity: "error", title: t("toast.error"), message: error?.message ?? t("payroll.messages.createError") });
    },
  });
}

function openOvertimeModal() {
  modalStore.open({
    component: PayrollOvertimeModal,
    props: {},
    onSuccess: async () => {
      toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("payroll.overtime.messages.createSuccess") });
      await loadPayrolls();
    },
    onError: (error) => {
      toastStore.addToast({ severity: "error", title: t("toast.error"), message: error?.message ?? t("payroll.overtime.messages.createError") });
    },
  });
}

function openPayrollDrawer(payrollId: string) {
  drawerStore.openDrawer({
    component: PayrollDetailsDrawer,
    title: t("payroll.drawer.title"),
    description: t("payroll.drawer.description"),
    direction: "right",
    size: "xl",
    props: { payrollId },
  });
}

async function handlePayrollUpdated() {
  await loadPayrolls();
}

watch(pageSize, async () => {
  page.value = 1;
  await loadPayrolls();
});

onMounted(async () => {
  window.addEventListener("payroll-updated", handlePayrollUpdated);
  await loadPayrolls();
});

onBeforeUnmount(() => {
  window.removeEventListener("payroll-updated", handlePayrollUpdated);
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("payroll.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("payroll.subtitle") }}
      </p>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-bt-spacing-16 mb-bt-spacing-24 shrink-0">
      <div class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
        <div class="flex items-center gap-bt-spacing-12">
          <div class="w-12 h-12 rounded-full bg-bt-primary-50 flex items-center justify-center text-bt-primary-600">
            <ReceiptText :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">{{ $t("payroll.summary.totalPayrolls") }}</div>
            <div class="text-2xl font-bt-bold text-bt-primary-700">{{ summary.totalPayrolls }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
        <div class="flex items-center gap-bt-spacing-12">
          <div class="w-12 h-12 rounded-full bg-bt-info-100 flex items-center justify-center text-bt-info-700">
            <Calculator :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">{{ $t("payroll.summary.totalEmployees") }}</div>
            <div class="text-2xl font-bt-bold text-bt-info-700">{{ summary.totalEmployees }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
        <div class="flex items-center gap-bt-spacing-12">
          <div class="w-12 h-12 rounded-full bg-bt-success-100 flex items-center justify-center text-bt-success-700">
            <HandCoins :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">{{ $t("payroll.summary.totalNet") }}</div>
            <div class="text-2xl font-bt-bold text-bt-success-700">{{ formatMoney(summary.totalNet) }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
        <div class="flex items-center gap-bt-spacing-12">
          <div class="w-12 h-12 rounded-full bg-bt-warning-100 flex items-center justify-center text-bt-warning-700">
            <Clock3 :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">{{ $t("payroll.summary.totalCommissions") }}</div>
            <div class="text-2xl font-bt-bold text-bt-warning-700">{{ formatMoney(summary.totalCommissions) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col">

      <!-- TOOLBAR: page size + create actions (right) -->
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-16 shrink-0"
      >
        <!-- Placeholder left (empty, filters are below) -->
        <div class="hidden lg:block" />

        <div class="flex flex-wrap items-center gap-bt-spacing-12 shrink-0">
          <select
            v-model.number="pageSize"
            class="px-bt-spacing-12 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700 transition font-bt-semibold"
            @click="openOvertimeModal"
          >
            {{ $t("payroll.actions.newOvertime") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 transition font-bt-semibold"
            @click="openCreatePayrollModal"
          >
            {{ $t("payroll.actions.newPayroll") }}
          </button>
        </div>
      </div>

      <!-- FILTER BAR fila 1: período + status + buscar + refresh -->
      <div
        class="flex flex-col sm:flex-row gap-bt-spacing-12 mb-bt-spacing-12 shrink-0"
      >
        <div class="flex flex-col sm:flex-row gap-bt-spacing-12 flex-1 lg:max-w-2xl">
          <input
            v-model="searchPeriodCode"
            type="text"
            :placeholder="$t('payroll.filters.periodCode')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="onSearch"
          />
          <input
            v-model="searchStatus"
            type="text"
            :placeholder="$t('payroll.filters.status')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="onSearch"
          />
          <!-- Primary query action -->
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="onSearch"
          >
            {{ $t("payroll.actions.search") }}
          </button>
          <!-- Secondary: no data impact -->
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadPayrolls"
          >
            {{ $t("payroll.actions.refresh") }}
          </button>
        </div>
      </div>

      <!-- FILTER BAR fila 2: fechas -->
      <div
        class="flex flex-col sm:flex-row gap-bt-spacing-12 mb-bt-spacing-24 shrink-0"
      >
        <div class="flex flex-col sm:flex-row gap-bt-spacing-12 flex-1 lg:max-w-2xl">
          <input
            v-model="searchFromUtc"
            type="datetime-local"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
          <input
            v-model="searchToUtc"
            type="datetime-local"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>
      </div>

      <!-- TABLE -->
      <div class="flex-1 min-h-0 overflow-auto">
        <div v-if="loading" class="py-bt-spacing-24 text-center text-bt-grey-500">
          {{ $t("common.loading") }}
        </div>

        <table v-else class="w-full border-collapse min-w-[1200px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("payroll.table.periodCode") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("payroll.table.startDate") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("payroll.table.endDate") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("payroll.table.payrollType") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("payroll.table.status") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("payroll.table.employees") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("payroll.table.grossTotal") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("payroll.table.totalNet") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("payroll.table.updatedAt") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20">{{ $t("payroll.table.options") }}</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="payroll in filteredPayrolls"
              :key="payroll.payrollId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold">
                {{ payroll.periodCode }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ formatDate(payroll.startDate) }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ formatDate(payroll.endDate) }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ payroll.payrollType }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  class="inline-flex px-bt-spacing-8 py-bt-spacing-4 rounded-full text-xs font-bt-semibold"
                  :class="
                    payroll.status?.toLowerCase().includes('draft')
                      ? 'bg-bt-warning-100 text-bt-warning-700'
                      : payroll.status?.toLowerCase().includes('calculated') || payroll.status?.toLowerCase().includes('closed')
                        ? 'bg-bt-success-100 text-bt-success-700'
                        : 'bg-bt-info-100 text-bt-info-700'
                  "
                >
                  {{ payroll.status }}
                </span>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ countEmployees(payroll) }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ formatMoney(totalGrossSalary(payroll)) }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold">{{ formatMoney(totalNetSalary(payroll)) }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ formatDateTime(payroll.updatedAtUtc) }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <PayrollRowActionMenu
                  :items="[{ label: t('payroll.actions.viewDetails'), action: () => openPayrollDrawer(payroll.payrollId) }]"
                >
                  <template #trigger>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center w-10 h-10 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 transition"
                    >
                      <MoreHorizontal :size="18" />
                    </button>
                  </template>
                </PayrollRowActionMenu>
              </td>
            </tr>

            <tr v-if="!filteredPayrolls.length && !loading">
              <td colspan="10" class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500">
                {{ $t("payroll.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0">
        <div class="text-sm text-bt-grey-600">
          {{ $t("pagination.page") }} {{ page }} {{ $t("pagination.of") }} {{ MAX_PAGE }}
          <span class="text-bt-grey-500">
            ({{ filteredPayrolls.length }} {{ $t("payroll.filtered") }})
          </span>
        </div>

        <div class="flex items-center gap-bt-spacing-8 flex-wrap">
          <button
            type="button"
            :disabled="!canGoPrevious"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
            @click="goPrevious"
          >
            <ChevronLeft :size="16" />
            <span>{{ $t("pagination.previous") }}</span>
          </button>

          <button v-if="pageNumbers[0] > 1" type="button" class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100" @click="goToPage(1)">1</button>
          <span v-if="pageNumbers[0] > 2" class="px-bt-spacing-8 text-bt-grey-500">...</span>

          <button
            v-for="pageNumber in pageNumbers"
            :key="pageNumber"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border transition"
            :class="pageNumber === page ? 'bg-bt-primary-500 border-bt-primary-500 text-bt-white' : 'border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100'"
            @click="goToPage(pageNumber)"
          >{{ pageNumber }}</button>

          <span v-if="pageNumbers[pageNumbers.length - 1] < MAX_PAGE - 1" class="px-bt-spacing-8 text-bt-grey-500">...</span>
          <button v-if="pageNumbers[pageNumbers.length - 1] < MAX_PAGE" type="button" class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100" @click="goToPage(MAX_PAGE)">{{ MAX_PAGE }}</button>

          <button
            type="button"
            :disabled="!canGoNext"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
            @click="goNext"
          >
            <span>{{ $t("pagination.next") }}</span>
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>