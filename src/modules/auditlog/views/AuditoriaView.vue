<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-vue-next";

import { AuditService } from "@/core/services/auditService";
import { useToastStore } from "@/core/stores/toastStore";

import type { AuditLog, AuditBrowseQuery } from "@/core/interfaces/audit";

const { t } = useI18n();
const toastStore = useToastStore();

const logs = ref<AuditLog[]>([]);
const loading = ref(false);

const page = ref(1);
const itemsPerPage = 10;

const selectedLog = ref<AuditLog | null>(null);
const showDetailModal = ref(false);

const filters = ref({
  from: "",
  to: "",
  module: "",
  action: "",
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(logs.value.length / itemsPerPage)),
);

const paginatedLogs = computed(() => {
  const start = (page.value - 1) * itemsPerPage;
  return logs.value.slice(start, start + itemsPerPage);
});

const pageNumbers = computed(() => {
  const current = page.value;
  const total = totalPages.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < totalPages.value);

function formatToBackendDate(dateStr: string, isEndOfDay = false): string | undefined {
  if (!dateStr) return undefined;
  return isEndOfDay ? `${dateStr}T23:59:59Z` : `${dateStr}T00:00:00Z`;
}

async function fetchLogs() {
  loading.value = true;
  page.value = 1;

  try {
    const query: AuditBrowseQuery = {
      from: formatToBackendDate(filters.value.from),
      to: formatToBackendDate(filters.value.to, true),
      module: filters.value.module || undefined,
      action: filters.value.action || undefined,
    };

    const response = await AuditService.browse(query);
    logs.value = Array.isArray(response) ? response : [];
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("audit.messages.loadError"),
    });
    logs.value = [];
  } finally {
    loading.value = false;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString("es-CR");
}

function parseJson(data: string | null): string {
  if (!data) return t("audit.noData");
  try {
    if (typeof data === "object") return JSON.stringify(data, null, 2);
    return JSON.stringify(JSON.parse(data), null, 2);
  } catch {
    return String(data);
  }
}

function getActionClass(action?: string): string {
  const a = String(action ?? "").toLowerCase();
  if (a === "create") return "bg-bt-success-100 text-bt-success-700";
  if (a === "update") return "bg-bt-warning-100 text-bt-warning-700";
  if (a === "delete") return "bg-bt-error-100 text-bt-error-700";
  return "bg-bt-info-100 text-bt-info-700";
}

function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > totalPages.value) return;
  page.value = targetPage;
}

onMounted(fetchLogs);
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <!-- HEADER -->
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("audit.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("audit.subtitle") }}
      </p>
    </div>

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <!-- TOOLBAR -->
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <!-- Left: date range + module + action + Search + Refresh -->
        <div class="flex flex-col sm:flex-row flex-wrap gap-bt-spacing-12 flex-1">
          <input
            v-model="filters.from"
            type="date"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />

          <input
            v-model="filters.to"
            type="date"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />

          <select
            v-model="filters.module"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">{{ $t("audit.filters.allModules") }}</option>
            <option value="Taxes">{{ $t("audit.modules.taxes") }}</option>
            <option value="Products">{{ $t("audit.modules.products") }}</option>
            <option value="Auth">{{ $t("audit.modules.auth") }}</option>
            <option value="Inventory">{{ $t("audit.modules.inventory") }}</option>
            <option value="Usuarios">{{ $t("audit.modules.users") }}</option>
          </select>

          <select
            v-model="filters.action"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">{{ $t("audit.filters.allActions") }}</option>
            <option value="Create">{{ $t("audit.actions.create") }}</option>
            <option value="Update">{{ $t("audit.actions.update") }}</option>
            <option value="Delete">{{ $t("audit.actions.delete") }}</option>
          </select>

          <!-- Primary query action -->
          <button
            type="button"
            :disabled="loading"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition disabled:bg-bt-disabled disabled:cursor-not-allowed"
            @click="fetchLogs"
          >
            {{ loading ? $t("common.loading") : $t("audit.actions.search") }}
          </button>

          <!-- Secondary: refresh, no data impact -->
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="fetchLogs"
          >
            {{ $t("audit.actions.refresh") }}
          </button>
        </div>

        <!-- Right: Export PDF + Export Excel -->
        <div class="flex items-center gap-bt-spacing-12 shrink-0">
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700 transition font-bt-semibold"
          >
            {{ $t("audit.actions.exportPdf") }}
          </button>
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-success-500 text-bt-white hover:bg-bt-success-700 transition font-bt-semibold"
          >
            {{ $t("audit.actions.exportExcel") }}
          </button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="flex-1 min-h-0 overflow-auto">
        <div
          v-if="loading"
          class="py-bt-spacing-32 text-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <table v-else class="w-full border-collapse min-w-[900px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("audit.table.date") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("audit.table.module") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("audit.table.entity") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("audit.table.action") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("audit.table.user") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("audit.table.ip") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-24">
                {{ $t("common.actions") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!paginatedLogs.length">
              <td
                colspan="7"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("audit.empty") }}
              </td>
            </tr>

            <tr
              v-for="log in paginatedLogs"
              :key="log.auditId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 text-sm">
                {{ formatDate(log.eventDate) }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <div class="flex items-center gap-bt-spacing-8">
                  <div
                    class="w-8 h-8 rounded-full bg-bt-primary-50 flex items-center justify-center text-bt-primary-600 shrink-0"
                  >
                    <LayoutGrid :size="14" />
                  </div>
                  <span class="text-bt-primary-700 font-bt-semibold text-sm">
                    {{ log.module }}
                  </span>
                </div>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 text-sm">
                {{ log.entity }}
                <span v-if="log.entityId" class="text-bt-grey-400 text-xs ml-1">
                  #{{ log.entityId }}
                </span>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold"
                  :class="getActionClass(log.action)"
                >
                  {{ log.action }}
                </span>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 text-sm">
                {{ log.userId || "-" }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-500 text-sm font-mono">
                {{ log.ip || "-" }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <button
                  type="button"
                  class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 transition text-sm"
                  @click="selectedLog = log; showDetailModal = true"
                >
                  {{ $t("common.viewDetails") }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0"
      >
        <div class="text-sm text-bt-grey-600">
          {{ $t("pagination.page") }} {{ page }} {{ $t("pagination.of") }} {{ totalPages }}
          <span class="text-bt-grey-500">
            ({{ logs.length }} {{ $t("audit.filtered") }})
          </span>
        </div>

        <div class="flex items-center gap-bt-spacing-8 flex-wrap">
          <button
            type="button"
            :disabled="!canGoPrevious"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
            @click="goToPage(page - 1)"
          >
            <ChevronLeft :size="16" />
            <span>{{ $t("pagination.previous") }}</span>
          </button>

          <button
            v-if="pageNumbers[0] > 1"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
            @click="goToPage(1)"
          >1</button>
          <span v-if="pageNumbers[0] > 2" class="px-bt-spacing-8 text-bt-grey-500">...</span>

          <button
            v-for="pageNumber in pageNumbers"
            :key="pageNumber"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border transition"
            :class="
              pageNumber === page
                ? 'bg-bt-primary-500 border-bt-primary-500 text-bt-white'
                : 'border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100'
            "
            @click="goToPage(pageNumber)"
          >{{ pageNumber }}</button>

          <span
            v-if="pageNumbers[pageNumbers.length - 1] < totalPages - 1"
            class="px-bt-spacing-8 text-bt-grey-500"
          >...</span>
          <button
            v-if="pageNumbers[pageNumbers.length - 1] < totalPages"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
            @click="goToPage(totalPages)"
          >{{ totalPages }}</button>

          <button
            type="button"
            :disabled="!canGoNext"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
            @click="goToPage(page + 1)"
          >
            <span>{{ $t("pagination.next") }}</span>
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- DETAIL MODAL -->
    <Teleport to="body">
      <div
        v-if="showDetailModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-bt-spacing-24 bg-bt-primary-700/60"
        @click.self="showDetailModal = false"
      >
        <div
          class="bg-bt-white rounded-l shadow-bt-elevation-200 w-full max-w-4xl max-h-[85vh] flex flex-col"
        >
          <!-- Modal header -->
          <div
            class="flex items-center justify-between px-bt-spacing-24 py-bt-spacing-16 border-b border-bt-grey-200 shrink-0"
          >
            <h3 class="text-lg font-bt-bold text-bt-primary-700">
              {{ $t("audit.modal.title") }}
            </h3>
            <button
              type="button"
              class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
              @click="showDetailModal = false"
            >
              {{ $t("common.close") }}
            </button>
          </div>

          <!-- Modal meta chips -->
          <div
            class="px-bt-spacing-24 py-bt-spacing-16 border-b border-bt-grey-200 shrink-0"
          >
            <div class="grid grid-cols-2 md:grid-cols-4 gap-bt-spacing-12">
              <div class="p-bt-spacing-12 rounded-m border border-bt-grey-200 bg-bt-grey-50">
                <div class="text-xs text-bt-grey-500 mb-bt-spacing-4">
                  {{ $t("audit.table.module") }}
                </div>
                <div class="text-bt-primary-700 font-bt-semibold text-sm">
                  {{ selectedLog?.module || "-" }}
                </div>
              </div>
              <div class="p-bt-spacing-12 rounded-m border border-bt-grey-200 bg-bt-grey-50">
                <div class="text-xs text-bt-grey-500 mb-bt-spacing-4">
                  {{ $t("audit.table.entity") }}
                </div>
                <div class="text-bt-primary-700 font-bt-semibold text-sm">
                  {{ selectedLog?.entity || "-" }}
                  <span v-if="selectedLog?.entityId" class="text-bt-grey-400 text-xs ml-1">
                    #{{ selectedLog.entityId }}
                  </span>
                </div>
              </div>
              <div class="p-bt-spacing-12 rounded-m border border-bt-grey-200 bg-bt-grey-50">
                <div class="text-xs text-bt-grey-500 mb-bt-spacing-4">
                  {{ $t("audit.table.action") }}
                </div>
                <span
                  class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold"
                  :class="getActionClass(selectedLog?.action)"
                >
                  {{ selectedLog?.action }}
                </span>
              </div>
              <div class="p-bt-spacing-12 rounded-m border border-bt-grey-200 bg-bt-grey-50">
                <div class="text-xs text-bt-grey-500 mb-bt-spacing-4">
                  {{ $t("audit.table.date") }}
                </div>
                <div class="text-bt-primary-700 font-bt-semibold text-sm">
                  {{ formatDate(selectedLog?.eventDate ?? "") }}
                </div>
              </div>
            </div>
          </div>

          <!-- Modal content: before / after -->
          <div class="flex-1 min-h-0 overflow-y-auto p-bt-spacing-24">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
              <div>
                <div class="text-xs font-bt-semibold text-bt-grey-600 mb-bt-spacing-8">
                  {{ $t("audit.modal.dataBefore") }}
                </div>
                <pre
                  class="text-xs bg-bt-grey-50 border border-bt-grey-200 rounded-m p-bt-spacing-12 overflow-x-auto text-bt-primary-700 whitespace-pre-wrap min-h-[200px]"
                >{{ parseJson(selectedLog?.dataBefore ?? null) }}</pre>
              </div>
              <div>
                <div class="text-xs font-bt-semibold text-bt-grey-600 mb-bt-spacing-8">
                  {{ $t("audit.modal.dataAfter") }}
                </div>
                <pre
                  class="text-xs bg-bt-grey-50 border border-bt-grey-200 rounded-m p-bt-spacing-12 overflow-x-auto text-bt-primary-700 whitespace-pre-wrap min-h-[200px]"
                >{{ parseJson(selectedLog?.dataAfter ?? null) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>