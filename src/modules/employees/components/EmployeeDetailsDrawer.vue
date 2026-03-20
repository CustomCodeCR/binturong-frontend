<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Download, BriefcaseBusiness } from "lucide-vue-next";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import { EmployeesService } from "@/core/services/employeesService";
import { EmployeeWorkHistoryService } from "@/core/services/employeeWorkHistoryService";

import type { Employee } from "@/core/interfaces/employees";
import type {
  EmployeeWorkHistory,
  EmployeeWorkHistoryEntry,
} from "@/core/interfaces/employeeWorkHistory";

const props = defineProps<{
  employeeId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const loadingEmployee = ref(false);
const loadingWorkHistory = ref(false);
const actionLoading = ref(false);

const activeTab = ref<"details" | "history" | "workHistory">("details");

const employee = ref<Employee | null>(null);
const workHistory = ref<EmployeeWorkHistory | null>(null);

const lastHistoryEvent = computed(() => {
  if (!employee.value?.history?.length) return null;

  return [...employee.value.history].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  )[0];
});

const suggestedAttendanceAction = computed<"check-in" | "check-out">(() => {
  if (!lastHistoryEvent.value) return "check-in";

  return lastHistoryEvent.value.eventType === "CHECK_IN"
    ? "check-out"
    : "check-in";
});

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

async function loadEmployee() {
  loadingEmployee.value = true;

  try {
    employee.value = await EmployeesService.readById(props.employeeId);
  } catch {
    employee.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("employees.messages.loadError"),
    });
  } finally {
    loadingEmployee.value = false;
  }
}

async function loadWorkHistory() {
  loadingWorkHistory.value = true;

  try {
    workHistory.value = await EmployeeWorkHistoryService.readByEmployeeId(
      props.employeeId,
    );
  } catch {
    workHistory.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("employees.workHistory.messages.loadError"),
    });
  } finally {
    loadingWorkHistory.value = false;
  }
}

async function exportWorkHistory() {
  try {
    const blob = await EmployeeWorkHistoryService.exportByEmployeeId(
      props.employeeId,
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `employee-work-history-${props.employeeId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("employees.workHistory.messages.exportError"),
    });
  }
}

async function registerAttendance() {
  if (!employee.value) return;

  actionLoading.value = true;

  try {
    if (suggestedAttendanceAction.value === "check-in") {
      await EmployeesService.checkIn(employee.value.employeeId);

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("employees.attendance.messages.checkInSuccess"),
      });
    } else {
      await EmployeesService.checkOut(employee.value.employeeId);

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("employees.attendance.messages.checkOutSuccess"),
      });
    }

    await loadEmployee();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message:
        suggestedAttendanceAction.value === "check-in"
          ? t("employees.attendance.messages.checkInError")
          : t("employees.attendance.messages.checkOutError"),
    });
  } finally {
    actionLoading.value = false;
  }
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

onMounted(async () => {
  await loadEmployee();
});

watch(
  () => props.employeeId,
  async () => {
    await loadEmployee();
    workHistory.value = null;
  },
);

watch(activeTab, async (tab) => {
  if (tab === "workHistory" && !workHistory.value) {
    await loadWorkHistory();
  }
});
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("employees.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            $t("employees.drawer.description", {
              fullName: employee?.fullName ?? "",
            })
          }}
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
        {{ $t("employees.drawer.tabs.details") }}
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
        {{ $t("employees.drawer.tabs.history") }}
      </button>

      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
        :class="
          activeTab === 'workHistory'
            ? 'bg-bt-primary-500 text-bt-white'
            : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
        "
        @click="activeTab = 'workHistory'"
      >
        {{ $t("employees.drawer.tabs.workHistory") }}
      </button>

      <button
        type="button"
        :disabled="actionLoading || loadingEmployee"
        class="ml-auto px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="registerAttendance"
      >
        {{
          actionLoading
            ? $t("common.loading")
            : suggestedAttendanceAction === "check-in"
              ? $t("employees.attendance.actions.checkIn")
              : $t("employees.attendance.actions.checkOut")
        }}
      </button>
    </div>

    <div v-if="loadingEmployee" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <template v-else-if="employee">
      <div
        v-if="activeTab === 'details'"
        class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16"
      >
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("employees.fields.fullName") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ employee.fullName }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("employees.fields.nationalId") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ employee.nationalId }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("employees.fields.email") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ employee.email }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("employees.fields.branch") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ employee.branchName ?? "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("employees.fields.jobTitle") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ employee.jobTitle }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("employees.fields.baseSalary") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ formatMoney(employee.baseSalary) }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("employees.fields.hireDate") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ employee.hireDate }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("employees.fields.terminationDate") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ employee.terminationDate || "-" }}
          </div>
        </div>

        <div
          class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("employees.fields.isActive") }}
          </div>
          <div
            class="font-bt-semibold"
            :class="
              employee.isActive ? 'text-bt-success-700' : 'text-bt-error-700'
            "
          >
            {{
              employee.isActive
                ? $t("employees.status.active")
                : $t("employees.status.inactive")
            }}
          </div>
        </div>
      </div>

      <div
        v-else-if="activeTab === 'history'"
        class="rounded-m border border-bt-grey-200 overflow-hidden"
      >
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("employees.history.table.eventType") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("employees.history.table.description") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("employees.history.table.eventDate") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in employee.history"
              :key="item.historyId"
              class="border-t border-bt-grey-200"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ item.eventType }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ item.description }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatDateTime(item.eventDate) }}
              </td>
            </tr>

            <tr v-if="!employee.history.length">
              <td
                colspan="3"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("employees.history.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="space-y-bt-spacing-16">
        <div class="flex justify-end">
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 inline-flex items-center gap-bt-spacing-8"
            @click="exportWorkHistory"
          >
            <Download :size="16" />
            {{ $t("employees.workHistory.actions.export") }}
          </button>
        </div>

        <div v-if="loadingWorkHistory" class="text-bt-grey-500">
          {{ $t("common.loading") }}
        </div>

        <template v-else-if="workHistory">
          <div
            class="rounded-l border border-bt-grey-200 bg-bt-primary-700 text-bt-white p-bt-spacing-16"
          >
            <div class="flex items-center gap-bt-spacing-12">
              <div
                class="w-12 h-12 rounded-full bg-bt-primary-500/40 flex items-center justify-center"
              >
                <BriefcaseBusiness :size="22" />
              </div>

              <div>
                <div class="text-sm text-bt-grey-200">
                  {{ $t("employees.workHistory.summary.totalJobs") }}
                </div>
                <div class="text-2xl font-bt-bold text-bt-accent-300">
                  {{ workHistory.entries.length }}
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-m border border-bt-grey-200 overflow-hidden">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-bt-primary-50 text-left">
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("employees.workHistory.table.code") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("employees.workHistory.table.client") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("employees.workHistory.table.status") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("employees.workHistory.table.scheduledDate") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("employees.workHistory.table.closedDate") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("employees.workHistory.table.services") }}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="entry in workHistory.entries"
                  :key="entry.serviceOrderId"
                  class="border-t border-bt-grey-200"
                >
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold"
                  >
                    {{ entry.serviceOrderCode }}
                  </td>

                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    <div>{{ entry.clientName }}</div>
                    <div class="text-sm text-bt-grey-500">
                      {{ entry.serviceAddress }}
                    </div>
                  </td>

                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ entry.status }}
                  </td>

                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ formatDateTime(entry.scheduledDate) }}
                  </td>

                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ formatDateTime(entry.closedDate) }}
                  </td>

                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    <div class="flex flex-wrap gap-bt-spacing-8">
                      <span
                        v-for="serviceName in entry.services"
                        :key="serviceName"
                        class="inline-flex px-bt-spacing-8 py-bt-spacing-4 rounded-full text-xs bg-bt-info-100 text-bt-info-700"
                      >
                        {{ serviceName }}
                      </span>
                    </div>
                  </td>
                </tr>

                <tr v-if="!workHistory.entries.length">
                  <td
                    colspan="6"
                    class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                  >
                    {{ $t("employees.workHistory.empty") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
