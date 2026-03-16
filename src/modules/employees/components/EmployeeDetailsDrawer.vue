<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";
import { EmployeesService } from "@/core/services/employeesService";

import type { Employee } from "@/core/interfaces/employees";

const props = defineProps<{
  employeeId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const loadingEmployee = ref(false);
const actionLoading = ref(false);
const activeTab = ref<"details" | "history">("details");

const employee = ref<Employee | null>(null);

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

async function loadEmployee() {
  loadingEmployee.value = true;

  try {
    employee.value = await EmployeesService.readById(props.employeeId);
  } finally {
    loadingEmployee.value = false;
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
  },
);
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
            {{ employee.baseSalary }}
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

      <div v-else class="rounded-m border border-bt-grey-200 overflow-hidden">
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
                {{ item.eventDate }}
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
    </template>
  </div>
</template>
