<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-vue-next";

import { DiscountsService } from "@/core/services/discountsService";
import { SelectService } from "@/core/services/selectService";

import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import DiscountActionMenu from "@/modules/discounts/components/DiscountActionMenu.vue";
import DiscountPolicyModal from "@/modules/discounts/components/DiscountPolicyModal.vue";
import DiscountApprovalRejectModal from "@/modules/discounts/components/DiscountApprovalRejectModal.vue";
import DiscountApprovalDetailsDrawer from "@/modules/discounts/components/DiscountApprovalDetailsDrawer.vue";
import DiscountHistoryDetailsDrawer from "@/modules/discounts/components/DiscountHistoryDetailsDrawer.vue";
import DiscountPolicyDetailsDrawer from "@/modules/discounts/components/DiscountPolicyDetailsDrawer.vue";
import DiscountStatsCards from "@/modules/discounts/components/DiscountStatsCards.vue";

import type {
  DiscountPolicy,
  DiscountApprovalRequest,
  DiscountHistoryItem,
} from "@/core/interfaces/discounts";
import type { SelectOption } from "@/core/interfaces/select";

type DiscountTab = "policies" | "approvals" | "history";

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const activeTab = ref<DiscountTab>("policies");

const policies = ref<DiscountPolicy[]>([]);
const approvals = ref<DiscountApprovalRequest[]>([]);
const history = ref<DiscountHistoryItem[]>([]);
const users = ref<SelectOption[]>([]);

const loadingPolicies = ref(false);
const loadingApprovals = ref(false);
const loadingHistory = ref(false);
const exporting = ref(false);

const policiesSearch = ref("");
const approvalsSearch = ref("");
const historySearch = ref("");

const policyStatusFilter = ref<"all" | "active" | "inactive">("all");
const approvalStatusFilter = ref("all");
const historyUserFilter = ref("");
const historyFromUtc = ref("");
const historyToUtc = ref("");

const policyPage = ref(1);
const approvalPage = ref(1);
const historyPage = ref(1);

const pageSize = ref(10);
const MAX_PAGE = 100;

const filteredPolicies = computed(() => {
  let result = policies.value;

  if (policyStatusFilter.value === "active") {
    result = result.filter((policy) => policy.isActive);
  } else if (policyStatusFilter.value === "inactive") {
    result = result.filter((policy) => !policy.isActive);
  }

  if (policiesSearch.value.trim()) {
    const query = policiesSearch.value.toLowerCase().trim();
    result = result.filter(
      (policy) =>
        String(policy.name ?? "").toLowerCase().includes(query) ||
        String(policy.maxDiscountPercentage ?? "").includes(query),
    );
  }

  return result;
});

const filteredApprovals = computed(() => {
  let result = approvals.value;

  if (approvalStatusFilter.value !== "all") {
    result = result.filter(
      (approval) =>
        String(approval.status).toLowerCase() === approvalStatusFilter.value.toLowerCase(),
    );
  }

  if (approvalsSearch.value.trim()) {
    const query = approvalsSearch.value.toLowerCase().trim();
    result = result.filter(
      (approval) =>
        String(approval.salesOrderCode ?? "").toLowerCase().includes(query) ||
        String(approval.requestedByUserName ?? "").toLowerCase().includes(query) ||
        String(approval.reason ?? "").toLowerCase().includes(query),
    );
  }

  return result;
});

const filteredHistory = computed(() => {
  let result = history.value;

  if (historyUserFilter.value.trim()) {
    result = result.filter((item) => item.userId === historyUserFilter.value);
  }

  if (historyFromUtc.value) {
    const fromDate = new Date(historyFromUtc.value).getTime();
    result = result.filter(
      (item) => new Date(item.eventDateUtc).getTime() >= fromDate,
    );
  }

  if (historyToUtc.value) {
    const toDate = new Date(historyToUtc.value).getTime();
    result = result.filter(
      (item) => new Date(item.eventDateUtc).getTime() <= toDate,
    );
  }

  if (historySearch.value.trim()) {
    const query = historySearch.value.toLowerCase().trim();
    result = result.filter(
      (item) =>
        String(item.salesOrderCode ?? "").toLowerCase().includes(query) ||
        String(item.userName ?? "").toLowerCase().includes(query) ||
        String(item.reason ?? "").toLowerCase().includes(query) ||
        String(item.scope ?? "").toLowerCase().includes(query) ||
        String(item.action ?? "").toLowerCase().includes(query),
    );
  }

  return result;
});

const currentPage = computed(() => {
  if (activeTab.value === "policies") return policyPage.value;
  if (activeTab.value === "approvals") return approvalPage.value;
  return historyPage.value;
});

const filteredCount = computed(() => {
  if (activeTab.value === "policies") return filteredPolicies.value.length;
  if (activeTab.value === "approvals") return filteredApprovals.value.length;
  return filteredHistory.value.length;
});

const canGoPrevious = computed(() => currentPage.value > 1);
const canGoNext = computed(() => currentPage.value < MAX_PAGE);

const pageNumbers = computed(() => {
  const current = currentPage.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);
  const pages: number[] = [];
  for (let index = start; index <= end; index += 1) {
    pages.push(index);
  }
  return pages;
});

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CR");
}

function formatPercent(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return `${Number(value).toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function loadPolicies() {
  loadingPolicies.value = true;
  try {
    policies.value = await DiscountsService.browsePolicies({
      page: policyPage.value,
      pageSize: pageSize.value,
      search: policiesSearch.value.trim() || undefined,
    });
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("discounts.policies.messages.loadError") });
  } finally {
    loadingPolicies.value = false;
  }
}

async function loadApprovals() {
  loadingApprovals.value = true;
  try {
    approvals.value = await DiscountsService.browseApprovalRequests({
      page: approvalPage.value,
      pageSize: pageSize.value,
      search: approvalsSearch.value.trim() || undefined,
      status: approvalStatusFilter.value === "all" ? undefined : approvalStatusFilter.value,
    });
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("discounts.approvals.messages.loadError") });
  } finally {
    loadingApprovals.value = false;
  }
}

async function loadHistory() {
  loadingHistory.value = true;
  try {
    history.value = await DiscountsService.browseHistory({
      page: historyPage.value,
      pageSize: pageSize.value,
      search: historySearch.value.trim() || undefined,
      userId: historyUserFilter.value || undefined,
      fromUtc: historyFromUtc.value || undefined,
      toUtc: historyToUtc.value || undefined,
    });
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("discounts.history.messages.loadError") });
  } finally {
    loadingHistory.value = false;
  }
}

async function loadUsers() {
  try {
    users.value = await SelectService.selectUsers({ onlyActive: false });
  } catch {
    users.value = [];
  }
}

async function loadActiveTab() {
  if (activeTab.value === "policies") { await loadPolicies(); return; }
  if (activeTab.value === "approvals") { await loadApprovals(); return; }
  await loadHistory();
}

async function onPoliciesSearch() {
  policyPage.value = 1;
  await loadPolicies();
}

async function onApprovalsSearch() {
  approvalPage.value = 1;
  await loadApprovals();
}

async function onHistorySearch() {
  historyPage.value = 1;
  await loadHistory();
}

function openCreatePolicyModal() {
  modalStore.open({
    component: DiscountPolicyModal,
    props: { policy: null },
    onSuccess: async () => {
      toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("discounts.policies.messages.createSuccess") });
      await loadPolicies();
    },
    onError: (error) => {
      toastStore.addToast({ severity: "error", title: t("toast.error"), message: error?.message ?? t("discounts.policies.messages.createError") });
    },
  });
}

function openEditPolicyModal(policy: DiscountPolicy) {
  modalStore.open({
    component: DiscountPolicyModal,
    props: { policy },
    onSuccess: async () => {
      toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("discounts.policies.messages.updateSuccess") });
      await loadPolicies();
    },
    onError: (error) => {
      toastStore.addToast({ severity: "error", title: t("toast.error"), message: error?.message ?? t("discounts.policies.messages.updateError") });
    },
  });
}

function openPolicyDetailsDrawer(policy: DiscountPolicy) {
  drawerStore.openDrawer({
    component: DiscountPolicyDetailsDrawer,
    props: { policy },
    title: t("discounts.policies.drawer.title"),
    description: t("discounts.policies.drawer.description", { name: policy.name || "-" }),
    direction: "right",
    size: "lg",
  });
}

async function togglePolicyStatus(policy: DiscountPolicy) {
  const nextIsActive = !policy.isActive;
  try {
    await DiscountsService.updatePolicy(policy.policyId, {
      name: policy.name,
      maxDiscountPercentage: policy.maxDiscountPercentage,
      requiresApprovalAboveLimit: policy.requiresApprovalAboveLimit,
      isActive: nextIsActive,
    });
    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: nextIsActive ? t("discounts.policies.messages.activated") : t("discounts.policies.messages.deactivated"),
    });
    await loadPolicies();
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("discounts.policies.messages.updateError") });
  }
}

async function approveRequest(item: DiscountApprovalRequest) {
  try {
    await DiscountsService.approveApprovalRequest(item.approvalRequestId);
    toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("discounts.approvals.messages.approveSuccess") });
    await loadApprovals();
    await loadHistory();
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("discounts.approvals.messages.approveError") });
  }
}

function openRejectApprovalModal(item: DiscountApprovalRequest) {
  modalStore.open({
    component: DiscountApprovalRejectModal,
    props: { approvalRequestId: item.approvalRequestId },
    onSuccess: async () => {
      toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("discounts.approvals.messages.rejectSuccess") });
      await loadApprovals();
      await loadHistory();
    },
    onError: (error) => {
      toastStore.addToast({ severity: "error", title: t("toast.error"), message: error?.message ?? t("discounts.approvals.messages.rejectError") });
    },
  });
}

function openApprovalDetailsDrawer(item: DiscountApprovalRequest) {
  drawerStore.openDrawer({
    component: DiscountApprovalDetailsDrawer,
    props: { approval: item },
    title: t("discounts.approvals.drawer.title"),
    description: t("discounts.approvals.drawer.description", { code: item.salesOrderCode || "-" }),
    direction: "right",
    size: "xl",
  });
}

function openHistoryDetailsDrawer(item: DiscountHistoryItem) {
  drawerStore.openDrawer({
    component: DiscountHistoryDetailsDrawer,
    props: { historyItem: item },
    title: t("discounts.history.drawer.title"),
    description: t("discounts.history.drawer.description", { code: item.salesOrderCode || "-" }),
    direction: "right",
    size: "xl",
  });
}

async function exportHistory() {
  exporting.value = true;
  try {
    const blob = await DiscountsService.exportHistory({
      page: historyPage.value,
      pageSize: pageSize.value,
      search: historySearch.value.trim() || undefined,
      userId: historyUserFilter.value || undefined,
      fromUtc: historyFromUtc.value || undefined,
      toUtc: historyToUtc.value || undefined,
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "discount-history.xlsx";
    anchor.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("discounts.history.messages.exportError") });
  } finally {
    exporting.value = false;
  }
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === currentPage.value) return;

  if (activeTab.value === "policies") {
    policyPage.value = targetPage;
  } else if (activeTab.value === "approvals") {
    approvalPage.value = targetPage;
  } else {
    historyPage.value = targetPage;
  }

  await loadActiveTab();
}

async function goPrevious() {
  if (!canGoPrevious.value) return;
  await goToPage(currentPage.value - 1);
}

async function goNext() {
  if (!canGoNext.value) return;
  await goToPage(currentPage.value + 1);
}

watch(pageSize, async () => {
  policyPage.value = 1;
  approvalPage.value = 1;
  historyPage.value = 1;
  await loadActiveTab();
});

watch(activeTab, async () => {
  await loadActiveTab();
});

onMounted(async () => {
  await Promise.all([loadUsers(), loadPolicies(), loadApprovals(), loadHistory()]);
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <!-- HEADER -->
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("discounts.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("discounts.subtitle") }}
      </p>
    </div>

    <DiscountStatsCards
      :policies="policies"
      :approvals="approvals"
      :history="history"
    />

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <!-- TOOLBAR: tabs (left) + page size + create/export (right) -->
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <div class="flex flex-wrap gap-bt-spacing-8">
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
            :class="activeTab === 'policies' ? 'bg-bt-primary-500 text-bt-white' : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'"
            @click="activeTab = 'policies'"
          >
            {{ $t("discounts.tabs.policies") }}
          </button>
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
            :class="activeTab === 'approvals' ? 'bg-bt-primary-500 text-bt-white' : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'"
            @click="activeTab = 'approvals'"
          >
            {{ $t("discounts.tabs.approvals") }}
          </button>
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
            :class="activeTab === 'history' ? 'bg-bt-primary-500 text-bt-white' : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'"
            @click="activeTab = 'history'"
          >
            {{ $t("discounts.tabs.history") }}
          </button>
        </div>

        <div class="flex items-center gap-bt-spacing-12 shrink-0">
          <select
            v-model.number="pageSize"
            class="px-bt-spacing-12 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>

          <!-- New policy: bt-accent-500 + font-bt-semibold -->
          <button
            v-if="activeTab === 'policies'"
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 transition font-bt-semibold"
            @click="openCreatePolicyModal"
          >
            {{ $t("discounts.actions.newPolicy") }}
          </button>

          <!-- Export Excel history: bt-success-500 + font-bt-semibold -->
          <button
            v-if="activeTab === 'history'"
            type="button"
            :disabled="exporting"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-success-500 text-bt-white hover:bg-bt-success-700 transition font-bt-semibold disabled:bg-bt-disabled"
            @click="exportHistory"
          >
            {{ exporting ? $t("common.loading") : $t("discounts.actions.exportExcel") }}
          </button>
        </div>
      </div>

      <!-- ── POLICIES ── -->
      <template v-if="activeTab === 'policies'">
        <!-- Filter bar: row 1 -->
        <div
          class="flex flex-col sm:flex-row gap-bt-spacing-12 mb-bt-spacing-24 shrink-0"
        >
          <div class="flex flex-col sm:flex-row gap-bt-spacing-12 flex-1 lg:max-w-2xl">
            <input
              v-model="policiesSearch"
              type="text"
              :placeholder="$t('discounts.policies.searchPlaceholder')"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              @keyup.enter="onPoliciesSearch"
            />
            <select
              v-model="policyStatusFilter"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            >
              <option value="all">{{ $t("discounts.policies.filters.all") }}</option>
              <option value="active">{{ $t("discounts.policies.filters.active") }}</option>
              <option value="inactive">{{ $t("discounts.policies.filters.inactive") }}</option>
            </select>
            <button
              type="button"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
              @click="onPoliciesSearch"
            >
              {{ $t("common.search") }}
            </button>
            <button
              type="button"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
              @click="loadPolicies"
            >
              {{ $t("common.refresh") }}
            </button>
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-auto">
          <div v-if="loadingPolicies" class="py-bt-spacing-32 text-center text-bt-grey-500">
            {{ $t("common.loading") }}
          </div>

          <table v-else class="w-full border-collapse min-w-[900px]">
            <thead class="sticky top-0 z-10">
              <tr class="bg-bt-primary-50 text-left">
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.policies.table.name") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.policies.table.maxDiscount") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.policies.table.requiresApproval") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.policies.table.status") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20">{{ $t("common.actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="policy in filteredPolicies"
                :key="policy.policyId"
                class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
              >
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold">{{ policy.name }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ formatPercent(policy.maxDiscountPercentage) }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ policy.requiresApprovalAboveLimit ? $t("common.yes") : $t("common.no") }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <span
                    :class="[
                      'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                      policy.isActive ? 'bg-bt-success-100 text-bt-success-700' : 'bg-bt-error-100 text-bt-error-700',
                    ]"
                  >
                    {{ policy.isActive ? $t("common.active") : $t("common.inactive") }}
                  </span>
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <DiscountActionMenu
                    :items="[
                      { label: t('common.viewDetails'), action: () => openPolicyDetailsDrawer(policy) },
                      { label: t('common.edit'), action: () => openEditPolicyModal(policy) },
                      {
                        label: policy.isActive ? t('common.deactivate') : t('common.activate'),
                        action: () => togglePolicyStatus(policy),
                        danger: policy.isActive,
                      },
                    ]"
                  >
                    <template #trigger>
                      <button
                        type="button"
                        class="inline-flex items-center justify-center w-10 h-10 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 transition"
                      >
                        <MoreHorizontal :size="18" />
                      </button>
                    </template>
                  </DiscountActionMenu>
                </td>
              </tr>
              <tr v-if="!filteredPolicies.length && !loadingPolicies">
                <td colspan="5" class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500">
                  {{ $t("discounts.policies.empty") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ── APPROVALS ── -->
      <template v-else-if="activeTab === 'approvals'">
        <!-- Filter bar -->
        <div
          class="flex flex-col sm:flex-row gap-bt-spacing-12 mb-bt-spacing-24 shrink-0"
        >
          <div class="flex flex-col sm:flex-row gap-bt-spacing-12 flex-1 lg:max-w-2xl">
            <input
              v-model="approvalsSearch"
              type="text"
              :placeholder="$t('discounts.approvals.searchPlaceholder')"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              @keyup.enter="onApprovalsSearch"
            />
            <select
              v-model="approvalStatusFilter"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            >
              <option value="all">{{ $t("discounts.approvals.filters.all") }}</option>
              <option value="pending">{{ $t("discounts.approvals.filters.pending") }}</option>
              <option value="approved">{{ $t("discounts.approvals.filters.approved") }}</option>
              <option value="rejected">{{ $t("discounts.approvals.filters.rejected") }}</option>
            </select>
            <button
              type="button"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
              @click="onApprovalsSearch"
            >
              {{ $t("common.search") }}
            </button>
            <button
              type="button"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
              @click="loadApprovals"
            >
              {{ $t("common.refresh") }}
            </button>
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-auto">
          <div v-if="loadingApprovals" class="py-bt-spacing-32 text-center text-bt-grey-500">
            {{ $t("common.loading") }}
          </div>

          <table v-else class="w-full border-collapse min-w-[1200px]">
            <thead class="sticky top-0 z-10">
              <tr class="bg-bt-primary-50 text-left">
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.approvals.table.salesOrder") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.approvals.table.scope") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.approvals.table.percentage") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.approvals.table.amount") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.approvals.table.requestedBy") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.approvals.table.status") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.approvals.table.requestedAt") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20">{{ $t("common.actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="approval in filteredApprovals"
                :key="approval.approvalRequestId"
                class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
              >
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold">{{ approval.salesOrderCode || "-" }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ approval.scope }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ formatPercent(approval.requestedPercentage) }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ formatMoney(approval.requestedAmount) }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ approval.requestedByUserName || "-" }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <span
                    :class="[
                      'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                      String(approval.status).toLowerCase() === 'approved'
                        ? 'bg-bt-success-100 text-bt-success-700'
                        : String(approval.status).toLowerCase() === 'rejected'
                          ? 'bg-bt-error-100 text-bt-error-700'
                          : 'bg-bt-warning-100 text-bt-warning-700',
                    ]"
                  >
                    {{ approval.status }}
                  </span>
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ formatDateTime(approval.requestedAtUtc) }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <DiscountActionMenu
                    :items="[
                      {
                        label: t('discounts.actions.approve'),
                        action: String(approval.status).toLowerCase() === 'pending' ? () => approveRequest(approval) : undefined,
                      },
                      {
                        label: t('discounts.actions.reject'),
                        action: String(approval.status).toLowerCase() === 'pending' ? () => openRejectApprovalModal(approval) : undefined,
                        danger: true,
                      },
                      { label: t('common.viewDetails'), action: () => openApprovalDetailsDrawer(approval) },
                    ]"
                  >
                    <template #trigger>
                      <button
                        type="button"
                        class="inline-flex items-center justify-center w-10 h-10 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 transition"
                      >
                        <MoreHorizontal :size="18" />
                      </button>
                    </template>
                  </DiscountActionMenu>
                </td>
              </tr>
              <tr v-if="!filteredApprovals.length && !loadingApprovals">
                <td colspan="8" class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500">
                  {{ $t("discounts.approvals.empty") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ── HISTORY ── -->
      <template v-else>
        <!-- Filter bar: fila 1 — search + buscar + refresh -->
        <div
          class="flex flex-col sm:flex-row gap-bt-spacing-12 mb-bt-spacing-12 shrink-0"
        >
          <div class="flex flex-col sm:flex-row gap-bt-spacing-12 flex-1 lg:max-w-2xl">
            <input
              v-model="historySearch"
              type="text"
              :placeholder="$t('discounts.history.searchPlaceholder')"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              @keyup.enter="onHistorySearch"
            />
            <button
              type="button"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
              @click="onHistorySearch"
            >
              {{ $t("common.search") }}
            </button>
            <button
              type="button"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
              @click="loadHistory"
            >
              {{ $t("common.refresh") }}
            </button>
          </div>
        </div>

        <!-- Filter bar: fila 2 — usuario + fecha desde + fecha hasta -->
        <div
          class="flex flex-col sm:flex-row gap-bt-spacing-12 mb-bt-spacing-24 shrink-0"
        >
          <div class="flex flex-col sm:flex-row gap-bt-spacing-12 flex-1 lg:max-w-2xl">
            <select
              v-model="historyUserFilter"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            >
              <option value="">{{ $t("discounts.history.filters.allUsers") }}</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.label }}
              </option>
            </select>
            <input
              v-model="historyFromUtc"
              type="datetime-local"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />
            <input
              v-model="historyToUtc"
              type="datetime-local"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-auto">
          <div v-if="loadingHistory" class="py-bt-spacing-32 text-center text-bt-grey-500">
            {{ $t("common.loading") }}
          </div>

          <table v-else class="w-full border-collapse min-w-[1300px]">
            <thead class="sticky top-0 z-10">
              <tr class="bg-bt-primary-50 text-left">
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.history.table.salesOrder") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.history.table.scope") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.history.table.action") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.history.table.percentage") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.history.table.amount") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.history.table.reason") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.history.table.user") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("discounts.history.table.eventDate") }}</th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20">{{ $t("common.actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in filteredHistory"
                :key="item.historyId"
                class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
              >
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold">{{ item.salesOrderCode || "-" }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ item.scope }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ item.action }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ formatPercent(item.discountPercentage) }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ formatMoney(item.discountAmount) }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ item.reason || item.rejectionReason || "-" }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ item.userName || "-" }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ formatDateTime(item.eventDateUtc) }}</td>
                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <DiscountActionMenu
                    :items="[{ label: t('common.viewDetails'), action: () => openHistoryDetailsDrawer(item) }]"
                  >
                    <template #trigger>
                      <button
                        type="button"
                        class="inline-flex items-center justify-center w-10 h-10 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 transition"
                      >
                        <MoreHorizontal :size="18" />
                      </button>
                    </template>
                  </DiscountActionMenu>
                </td>
              </tr>
              <tr v-if="!filteredHistory.length && !loadingHistory">
                <td colspan="9" class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500">
                  {{ $t("discounts.history.empty") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- PAGINATION -->
      <div
        class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0"
      >
        <div class="text-sm text-bt-grey-600">
          {{ $t("pagination.page") }} {{ currentPage }} {{ $t("pagination.of") }} {{ MAX_PAGE }}
          <span class="text-bt-grey-500">
            ({{ filteredCount }} {{ $t("discounts.filtered") }})
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

          <button
            v-if="pageNumbers[0] > 1"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
            @click="goToPage(1)"
          >
            1
          </button>

          <span v-if="pageNumbers[0] > 2" class="px-bt-spacing-8 text-bt-grey-500">...</span>

          <button
            v-for="pageNumber in pageNumbers"
            :key="pageNumber"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border transition"
            :class="
              pageNumber === currentPage
                ? 'bg-bt-primary-500 border-bt-primary-500 text-bt-white'
                : 'border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100'
            "
            @click="goToPage(pageNumber)"
          >
            {{ pageNumber }}
          </button>

          <span
            v-if="pageNumbers[pageNumbers.length - 1] < MAX_PAGE - 1"
            class="px-bt-spacing-8 text-bt-grey-500"
          >...</span>

          <button
            v-if="pageNumbers[pageNumbers.length - 1] < MAX_PAGE"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
            @click="goToPage(MAX_PAGE)"
          >
            {{ MAX_PAGE }}
          </button>

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