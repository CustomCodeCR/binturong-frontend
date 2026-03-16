<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useModalStore } from "@/core/stores/modalStore";
import { useAuthStore } from "@/core/stores/authStore";

import { PurchasesRequestsService } from "@/core/services/purchasesRequestsService";
import { SelectService } from "@/core/services/selectService";

import type { SelectOption } from "@/core/interfaces/select";

const modalStore = useModalStore();
const authStore = useAuthStore();

const branches = ref<SelectOption[]>([]);
const employees = ref<SelectOption[]>([]);

const loadingCatalogs = ref(false);
const loading = ref(false);

const code = ref("");
const branchId = ref("");
const requestedById = ref("");
const requestDateUtc = ref("");
const notes = ref("");

const notesLimited = computed({
  get: () => notes.value,
  set: (value: string) => {
    notes.value = value.slice(0, 255);
  },
});

const canSelectEmployee = computed(() => {
  return authStore.hasRole("SuperAdmin") || authStore.hasRole("Admin");
});

const selectedEmployeeLabel = computed(() => {
  return (
    employees.value.find((employee) => employee.id === requestedById.value)
      ?.label ??
    authStore.employeeFullName ??
    ""
  );
});

function close() {
  modalStore.close();
}

function getLocalDateTimeForInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toUtcIsoString(localDateTime: string): string {
  if (!localDateTime) return "";

  let normalized = localDateTime.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    normalized = `${normalized}T00:00`;
  }

  const localDate = new Date(normalized);

  if (Number.isNaN(localDate.getTime())) {
    return "";
  }

  return localDate.toISOString();
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const requests: Promise<unknown>[] = [
      SelectService.selectBranches({ onlyActive: true }),
    ];

    if (canSelectEmployee.value) {
      requests.push(SelectService.selectEmployees({ onlyActive: true }));
    }

    const responses = await Promise.all(requests);

    branches.value = (responses[0] as SelectOption[]) ?? [];

    if (canSelectEmployee.value) {
      employees.value = (responses[1] as SelectOption[]) ?? [];
    }

    if (canSelectEmployee.value) {
      if (!requestedById.value && employees.value.length > 0) {
        requestedById.value = employees.value[0]?.id ?? "";
      }
    } else {
      requestedById.value = authStore.employeeId ?? "";
    }

    if (!branchId.value && authStore.employeeBranchId) {
      branchId.value = authStore.employeeBranchId;
    }
  } catch (error: any) {
    console.error("Load purchase request catalogs error:", error);

    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? "Error loading data",
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  const normalizedCode = code.value.trim();
  const normalizedBranchId = branchId.value.trim();
  const normalizedRequestedById = requestedById.value.trim();
  const normalizedRequestDateUtc = toUtcIsoString(requestDateUtc.value);
  const normalizedNotes = notes.value.trim();

  if (!normalizedCode || !normalizedBranchId || !normalizedRequestedById) {
    modalStore.onError?.({
      code: 400,
      message: "Missing required fields",
    });
    return;
  }

  if (!canSelectEmployee.value && !authStore.employeeId) {
    modalStore.onError?.({
      code: 400,
      message: "Current user does not have an employee assigned",
    });
    return;
  }

  loading.value = true;

  try {
    const result = await PurchasesRequestsService.create({
      code: normalizedCode,
      branchId: normalizedBranchId,
      requestedById: normalizedRequestedById,
      requestDateUtc: normalizedRequestDateUtc || new Date().toISOString(),
      notes: normalizedNotes,
    });

    modalStore.onSuccess?.(result);
    modalStore.close();
  } catch (error: any) {
    console.error("Create purchase request error:", error);

    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? "Error creating request",
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  requestDateUtc.value = getLocalDateTimeForInput();
  await loadCatalogs();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-[95vw] max-h-[90vh] overflow-y-auto p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        Create Purchase Request
      </h2>

      <p class="text-bt-grey-600 mt-bt-spacing-8">
        Complete the information to register a purchase request.
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      Loading...
    </div>

    <div v-else class="space-y-bt-spacing-24">
      <div
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-bt-spacing-16"
      >
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            Code
          </label>

          <input
            v-model="code"
            type="text"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            Branch
          </label>

          <select
            v-model="branchId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">Select branch</option>

            <option
              v-for="branch in branches"
              :key="branch.id"
              :value="branch.id"
            >
              {{ branch.label }}
            </option>
          </select>
        </div>

        <!-- employee select -->
        <div v-if="canSelectEmployee">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            Requested By
          </label>

          <select
            v-model="requestedById"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">Select employee</option>

            <option
              v-for="employee in employees"
              :key="employee.id"
              :value="employee.id"
            >
              {{ employee.label }}
            </option>
          </select>
        </div>

        <!-- employee fixed -->
        <div v-else>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            Requested By
          </label>

          <input
            :value="selectedEmployeeLabel"
            type="text"
            disabled
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-700"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            Date
          </label>

          <input
            v-model="requestDateUtc"
            type="datetime-local"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <!-- notes -->
        <div class="md:col-span-2">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            Notes
          </label>

          <textarea
            v-model="notesLimited"
            maxlength="255"
            rows="5"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500 resize-none"
          />

          <div class="text-xs text-bt-grey-500 mt-bt-spacing-4 text-right">
            {{ notes.length }}/255
          </div>
        </div>
      </div>
    </div>

    <div class="mt-bt-spacing-24 flex justify-end gap-bt-spacing-12">
      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="close"
      >
        Cancel
      </button>

      <button
        type="button"
        :disabled="loading || loadingCatalogs"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ loading ? "Loading..." : "Save" }}
      </button>
    </div>
  </div>
</template>
