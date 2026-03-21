<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { ReportsService } from "@/core/services/reportsService";
import { SelectService } from "@/core/services/selectService";

import { useModalStore } from "@/core/stores/modalStore";

import type { SelectOption } from "@/core/interfaces/select";
import type { ReportSchedule } from "@/core/interfaces/reports";

const props = defineProps<{
  schedule?: ReportSchedule | null;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const loading = ref(false);
const loadingCatalogs = ref(false);

const branches = ref<SelectOption[]>([]);
const categories = ref<SelectOption[]>([]);
const clients = ref<SelectOption[]>([]);
const employees = ref<SelectOption[]>([]);

const name = ref("");
const reportType = ref("Financial");
const frequency = ref("Weekly");
const recipientEmail = ref("");
const timeOfDayUtc = ref("08:00");
const isActive = ref(true);
const branchId = ref("");
const categoryId = ref("");
const clientId = ref("");
const employeeId = ref("");

const isEdit = computed(() => Boolean(props.schedule?.reportScheduleId));

const showBranchField = computed(() => {
  return (
    reportType.value === "Financial" ||
    reportType.value === "Inventory" ||
    reportType.value === "ServiceOrders"
  );
});

const showCategoryField = computed(() => reportType.value === "Inventory");
const showClientField = computed(() => reportType.value === "Client");
const showEmployeeField = computed(() => reportType.value === "ServiceOrders");

function closeModal() {
  modalStore.close();
}

function hydrateForm() {
  if (!props.schedule) {
    return;
  }

  name.value = props.schedule.name ?? "";
  reportType.value = props.schedule.reportType ?? "Financial";
  frequency.value = props.schedule.frequency ?? "Weekly";
  recipientEmail.value = props.schedule.recipientEmail ?? "";
  timeOfDayUtc.value = props.schedule.timeOfDayUtc ?? "08:00";
  isActive.value = Boolean(props.schedule.isActive);
  branchId.value = props.schedule.branchId ?? "";
  categoryId.value = props.schedule.categoryId ?? "";
  clientId.value = props.schedule.clientId ?? "";
  employeeId.value = props.schedule.employeeId ?? "";
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const [
      branchesResponse,
      categoriesResponse,
      clientsResponse,
      employeesResponse,
    ] = await Promise.all([
      SelectService.selectBranches({ onlyActive: true }),
      SelectService.selectProductCategories({ onlyActive: true }),
      SelectService.selectClients({ onlyActive: true }),
      SelectService.selectEmployees({ onlyActive: true }),
    ]);

    branches.value = Array.isArray(branchesResponse) ? branchesResponse : [];
    categories.value = Array.isArray(categoriesResponse)
      ? categoriesResponse
      : [];
    clients.value = Array.isArray(clientsResponse) ? clientsResponse : [];
    employees.value = Array.isArray(employeesResponse) ? employeesResponse : [];
  } finally {
    loadingCatalogs.value = false;
  }
}

function validate() {
  if (!name.value.trim()) {
    throw new Error(t("reports.schedules.validation.nameRequired"));
  }

  if (!recipientEmail.value.trim()) {
    throw new Error(t("reports.schedules.validation.recipientRequired"));
  }

  if (!timeOfDayUtc.value.trim()) {
    throw new Error(t("reports.schedules.validation.timeRequired"));
  }

  if (showClientField.value && !clientId.value.trim()) {
    throw new Error(t("reports.schedules.validation.clientRequired"));
  }

  if (showEmployeeField.value && !employeeId.value.trim()) {
    throw new Error(t("reports.schedules.validation.employeeRequired"));
  }
}

async function submit() {
  validate();

  loading.value = true;

  try {
    const payload = {
      name: name.value.trim(),
      reportType: reportType.value,
      frequency: frequency.value,
      recipientEmail: recipientEmail.value.trim(),
      timeOfDayUtc: timeOfDayUtc.value.trim(),
      isActive: isActive.value,
      branchId: showBranchField.value ? branchId.value || null : null,
      categoryId: showCategoryField.value ? categoryId.value || null : null,
      clientId: showClientField.value ? clientId.value || null : null,
      employeeId: showEmployeeField.value ? employeeId.value || null : null,
    };

    if (props.schedule?.reportScheduleId) {
      await ReportsService.updateSchedule(
        props.schedule.reportScheduleId,
        payload,
      );
    } else {
      await ReportsService.createSchedule(payload);
    }

    modalStore.onSuccess?.();
    modalStore.close();
  } catch (error) {
    modalStore.onError?.(error);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  hydrateForm();
  await loadCatalogs();
});
</script>

<template>
  <div class="w-full max-w-3xl rounded-l bg-bt-white p-bt-spacing-24">
    <div
      class="mb-bt-spacing-24 flex items-start justify-between gap-bt-spacing-16"
    >
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{
            isEdit
              ? $t("reports.schedules.modal.editTitle")
              : $t("reports.schedules.modal.createTitle")
          }}
        </h2>
        <p class="mt-bt-spacing-8 text-bt-grey-600">
          {{
            isEdit
              ? $t("reports.schedules.modal.editDescription")
              : $t("reports.schedules.modal.createDescription")
          }}
        </p>
      </div>

      <button
        type="button"
        class="rounded-m bg-bt-grey-200 px-bt-spacing-12 py-bt-spacing-8 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeModal"
      >
        {{ $t("common.close") }}
      </button>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-2">
      <div class="md:col-span-2">
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("reports.schedules.fields.name") }}
        </label>
        <input
          v-model="name"
          type="text"
          class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("reports.schedules.fields.reportType") }}
        </label>
        <select
          v-model="reportType"
          class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="Financial">{{ $t("reports.types.financial") }}</option>
          <option value="Inventory">{{ $t("reports.types.inventory") }}</option>
          <option value="Client">{{ $t("reports.types.client") }}</option>
          <option value="ServiceOrders">
            {{ $t("reports.types.serviceOrders") }}
          </option>
        </select>
      </div>

      <div>
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("reports.schedules.fields.frequency") }}
        </label>
        <select
          v-model="frequency"
          class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="Daily">{{ $t("reports.frequencies.daily") }}</option>
          <option value="Weekly">{{ $t("reports.frequencies.weekly") }}</option>
          <option value="Monthly">
            {{ $t("reports.frequencies.monthly") }}
          </option>
        </select>
      </div>

      <div>
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("reports.schedules.fields.recipientEmail") }}
        </label>
        <input
          v-model="recipientEmail"
          type="email"
          class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("reports.schedules.fields.timeOfDayUtc") }}
        </label>
        <input
          v-model="timeOfDayUtc"
          type="time"
          class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div v-if="showBranchField">
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("reports.schedules.fields.branch") }}
        </label>
        <select
          v-model="branchId"
          class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">{{ $t("reports.filters.allBranches") }}</option>
          <option
            v-for="branch in branches"
            :key="branch.id"
            :value="branch.id"
          >
            {{ branch.label }}
          </option>
        </select>
      </div>

      <div v-if="showCategoryField">
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("reports.schedules.fields.category") }}
        </label>
        <select
          v-model="categoryId"
          class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">{{ $t("reports.filters.allCategories") }}</option>
          <option
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.label }}
          </option>
        </select>
      </div>

      <div v-if="showClientField">
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("reports.schedules.fields.client") }}
        </label>
        <select
          v-model="clientId"
          class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("reports.placeholders.selectClient") }}
          </option>
          <option v-for="client in clients" :key="client.id" :value="client.id">
            {{ client.label }}
          </option>
        </select>
      </div>

      <div v-if="showEmployeeField">
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("reports.schedules.fields.employee") }}
        </label>
        <select
          v-model="employeeId"
          class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("reports.placeholders.selectEmployee") }}
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

      <div class="md:col-span-2">
        <label
          class="inline-flex items-center gap-bt-spacing-8 text-sm text-bt-primary-700"
        >
          <input
            v-model="isActive"
            type="checkbox"
            class="rounded border-bt-grey-300 text-bt-accent-500 focus:ring-bt-accent-500"
          />
          {{ $t("reports.schedules.fields.isActive") }}
        </label>
      </div>

      <div
        class="md:col-span-2 mt-bt-spacing-8 flex justify-end gap-bt-spacing-12"
      >
        <button
          type="button"
          class="rounded-m bg-bt-grey-200 px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 hover:bg-bt-grey-300"
          @click="closeModal"
        >
          {{ $t("common.cancel") }}
        </button>

        <button
          type="button"
          :disabled="loading"
          class="rounded-m bg-bt-accent-500 px-bt-spacing-16 py-bt-spacing-12 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
          @click="submit"
        >
          {{ loading ? $t("common.loading") : $t("common.save") }}
        </button>
      </div>
    </div>
  </div>
</template>
