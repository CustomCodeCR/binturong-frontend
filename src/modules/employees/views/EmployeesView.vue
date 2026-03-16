<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-vue-next";

import { EmployeesService } from "@/core/services/employeesService";
import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import EmployeeCreateModal from "@/modules/employees/components/EmployeeCreateModal.vue";
import EmployeeEditModal from "@/modules/employees/components/EmployeeEditModal.vue";
import EmployeeDetailsDrawer from "@/modules/employees/components/EmployeeDetailsDrawer.vue";
import EmployeeActionMenu from "@/modules/employees/components/EmployeeActionMenu.vue";

import type { Employee } from "@/core/interfaces/employees";

interface EmployeeSuccessPayload {
  employeeId: string;
  userId?: string | null;
  branchId: string;
  fullName: string;
  nationalId: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  birthDate?: string | null;
  hireDate?: string | null;
  terminationDate?: string | null;
  jobTitle: string;
  baseSalary: number;
  isActive: boolean;
  branchName?: string | null;
}

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const employees = ref<Employee[]>([]);
const loading = ref(false);
const search = ref("");
const page = ref(1);
const pageSize = ref(10);

const MAX_PAGE = 100;

const pageNumbers = computed(() => {
  const current = page.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);

  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  return pages;
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < MAX_PAGE);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchEmployees(): Promise<Employee[]> {
  return await EmployeesService.browse({
    page: page.value,
    pageSize: pageSize.value,
    search: search.value.trim() || undefined,
  });
}

function replaceEmployees(nextEmployees: Employee[]) {
  employees.value = [...nextEmployees];
}

async function loadEmployees() {
  loading.value = true;

  try {
    replaceEmployees(await fetchEmployees());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("employees.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function patchEmployeeInList(payload: EmployeeSuccessPayload) {
  const existingIndex = employees.value.findIndex(
    (employee) => employee.employeeId === payload.employeeId,
  );

  if (existingIndex >= 0) {
    replaceEmployees(
      employees.value.map((employee) =>
        employee.employeeId === payload.employeeId
          ? {
              ...employee,
              employeeId: payload.employeeId,
              userId: payload.userId ?? employee.userId ?? null,
              branchId: payload.branchId,
              fullName: payload.fullName,
              nationalId: payload.nationalId,
              email: payload.email,
              phone: payload.phone ?? employee.phone ?? null,
              address: payload.address ?? employee.address ?? null,
              birthDate: payload.birthDate ?? employee.birthDate ?? null,
              hireDate: payload.hireDate ?? employee.hireDate ?? null,
              terminationDate:
                payload.terminationDate ?? employee.terminationDate ?? null,
              jobTitle: payload.jobTitle,
              baseSalary: payload.baseSalary,
              isActive: payload.isActive,
              branchName: payload.branchName ?? employee.branchName ?? null,
            }
          : employee,
      ),
    );
    return;
  }

  replaceEmployees([
    {
      id: `employee:${payload.employeeId}`,
      employeeId: payload.employeeId,
      userId: payload.userId ?? null,
      branchId: payload.branchId,
      fullName: payload.fullName,
      nationalId: payload.nationalId,
      email: payload.email,
      phone: payload.phone ?? null,
      address: payload.address ?? null,
      birthDate: payload.birthDate ?? null,
      hireDate: payload.hireDate ?? null,
      terminationDate: payload.terminationDate ?? null,
      jobTitle: payload.jobTitle,
      baseSalary: payload.baseSalary,
      isActive: payload.isActive,
      branchName: payload.branchName ?? null,
    } as Employee,
    ...employees.value,
  ]);
}

function patchEmployeeStatusInList(employeeId: string, isActive: boolean) {
  replaceEmployees(
    employees.value.map((employee) =>
      employee.employeeId === employeeId
        ? {
            ...employee,
            isActive,
          }
        : employee,
    ),
  );
}

function removeEmployeeFromList(employeeId: string) {
  replaceEmployees(
    employees.value.filter((employee) => employee.employeeId !== employeeId),
  );
}

function hasEmployeeReachedExpectedState(
  fetchedEmployees: Employee[],
  expected: EmployeeSuccessPayload,
): boolean {
  const fetchedEmployee = fetchedEmployees.find(
    (employee) => employee.employeeId === expected.employeeId,
  );

  if (!fetchedEmployee) {
    return false;
  }

  return (
    fetchedEmployee.branchId === expected.branchId &&
    fetchedEmployee.fullName === expected.fullName &&
    fetchedEmployee.nationalId === expected.nationalId &&
    fetchedEmployee.email === expected.email &&
    fetchedEmployee.jobTitle === expected.jobTitle &&
    Number(fetchedEmployee.baseSalary) === Number(expected.baseSalary) &&
    fetchedEmployee.isActive === expected.isActive &&
    (fetchedEmployee.terminationDate ?? "") === (expected.terminationDate ?? "")
  );
}

async function reloadEmployeesUntil(
  predicate: (fetchedEmployees: Employee[]) => boolean,
  options?: {
    attempts?: number;
    delayMs?: number;
  },
) {
  const attempts = options?.attempts ?? 12;
  const delayMs = options?.delayMs ?? 500;

  loading.value = true;

  try {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const fetchedEmployees = await fetchEmployees();

      if (predicate(fetchedEmployees)) {
        replaceEmployees(fetchedEmployees);
        return;
      }

      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }

    replaceEmployees(await fetchEmployees());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("employees.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  modalStore.open({
    component: EmployeeCreateModal,
    onSuccess: async (payload?: EmployeeSuccessPayload) => {
      if (payload?.employeeId) {
        patchEmployeeInList(payload);
      }

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("employees.messages.createSuccess"),
      });

      if (payload?.employeeId) {
        await reloadEmployeesUntil(
          (fetchedEmployees) =>
            fetchedEmployees.some(
              (employee) => employee.employeeId === payload.employeeId,
            ),
          {
            attempts: 12,
            delayMs: 500,
          },
        );
        return;
      }

      await loadEmployees();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("employees.messages.createError"),
      });
    },
  });
}

function openEditModal(employee: Employee) {
  modalStore.open({
    component: EmployeeEditModal,
    props: {
      employeeId: employee.employeeId,
    },
    onSuccess: async (payload?: EmployeeSuccessPayload) => {
      if (!payload?.employeeId) {
        await loadEmployees();
        return;
      }

      patchEmployeeInList(payload);

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("employees.messages.updateSuccess"),
      });

      await reloadEmployeesUntil(
        (fetchedEmployees) =>
          hasEmployeeReachedExpectedState(fetchedEmployees, payload),
        {
          attempts: 12,
          delayMs: 500,
        },
      );
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("employees.messages.updateError"),
      });
    },
  });
}

function openDetailsDrawer(employee: Employee) {
  drawerStore.openDrawer({
    component: EmployeeDetailsDrawer,
    props: {
      employeeId: employee.employeeId,
    },
    title: t("employees.drawer.title"),
    description: t("employees.drawer.description", {
      fullName: employee.fullName,
    }),
    direction: "right",
    size: "xl",
  });
}

async function toggleEmployeeStatus(employee: Employee) {
  const nextIsActive = !employee.isActive;

  try {
    await EmployeesService.update(employee.employeeId, {
      userId: employee.userId ?? "",
      branchId: employee.branchId,
      fullName: employee.fullName,
      jobTitle: employee.jobTitle,
      baseSalary: employee.baseSalary,
      terminationDate: employee.terminationDate ?? "",
      isActive: nextIsActive,
    });

    patchEmployeeStatusInList(employee.employeeId, nextIsActive);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: employee.isActive
        ? t("employees.messages.deactivateSuccess")
        : t("employees.messages.reactivateSuccess"),
    });

    await reloadEmployeesUntil(
      (fetchedEmployees) => {
        const fetchedEmployee = fetchedEmployees.find(
          (item) => item.employeeId === employee.employeeId,
        );
        return fetchedEmployee?.isActive === nextIsActive;
      },
      {
        attempts: 12,
        delayMs: 500,
      },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: employee.isActive
        ? t("employees.messages.deactivateError")
        : t("employees.messages.reactivateError"),
    });
  }
}

async function deleteEmployee(employee: Employee) {
  try {
    await EmployeesService.delete(employee.employeeId);

    removeEmployeeFromList(employee.employeeId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("employees.messages.deleteSuccess"),
    });

    await reloadEmployeesUntil(
      (fetchedEmployees) =>
        !fetchedEmployees.some(
          (item) => item.employeeId === employee.employeeId,
        ),
      {
        attempts: 12,
        delayMs: 500,
      },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("employees.messages.deleteError"),
    });
  }
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) {
    return;
  }

  page.value = targetPage;
  await loadEmployees();
}

async function goPrevious() {
  if (!canGoPrevious.value) return;
  await goToPage(page.value - 1);
}

async function goNext() {
  if (!canGoNext.value) return;
  await goToPage(page.value + 1);
}

async function onSearch() {
  page.value = 1;
  await loadEmployees();
}

watch(pageSize, async () => {
  page.value = 1;
  await loadEmployees();
});

onMounted(async () => {
  await loadEmployees();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("employees.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("employees.subtitle") }}
      </p>
    </div>

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <div
          class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl"
        >
          <input
            v-model="search"
            type="text"
            :placeholder="$t('employees.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="onSearch"
          />

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="onSearch"
          >
            {{ $t("employees.actions.search") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadEmployees"
          >
            {{ $t("employees.actions.refresh") }}
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

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 transition font-bt-semibold"
            @click="openCreateModal"
          >
            {{ $t("employees.actions.newEmployee") }}
          </button>
        </div>
      </div>

      <div class="flex-1 min-h-0 overflow-auto">
        <div
          v-if="loading"
          class="py-bt-spacing-32 text-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <table v-else class="w-full border-collapse min-w-[1200px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("employees.table.fullName") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("employees.table.nationalId") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("employees.table.email") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("employees.table.branch") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("employees.table.jobTitle") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("employees.table.baseSalary") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("employees.table.status") }}
              </th>
              <th
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
              >
                {{ $t("employees.table.options") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="employee in employees"
              :key="employee.employeeId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold"
              >
                {{ employee.fullName }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ employee.nationalId }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ employee.email }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ employee.branchName ?? "-" }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ employee.jobTitle }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ employee.baseSalary }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  :class="[
                    'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                    employee.isActive
                      ? 'bg-bt-success-100 text-bt-success-700'
                      : 'bg-bt-error-100 text-bt-error-700',
                  ]"
                >
                  {{
                    employee.isActive
                      ? $t("employees.status.active")
                      : $t("employees.status.inactive")
                  }}
                </span>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <EmployeeActionMenu
                  :items="[
                    {
                      label: t('employees.actions.viewDetails'),
                      action: () => openDetailsDrawer(employee),
                    },
                    {
                      label: t('employees.actions.edit'),
                      action: () => openEditModal(employee),
                    },
                    {
                      label: employee.isActive
                        ? t('employees.actions.deactivate')
                        : t('employees.actions.reactivate'),
                      action: () => toggleEmployeeStatus(employee),
                      danger: employee.isActive,
                    },
                    {
                      label: t('employees.actions.delete'),
                      action: () => deleteEmployee(employee),
                      danger: true,
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
                </EmployeeActionMenu>
              </td>
            </tr>

            <tr v-if="!employees.length && !loading">
              <td
                colspan="8"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("employees.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0"
      >
        <div class="text-sm text-bt-grey-600">
          {{ $t("pagination.page") }} {{ page }} {{ $t("pagination.of") }}
          {{ MAX_PAGE }}
        </div>

        <div class="flex items-center gap-bt-spacing-8 flex-wrap">
          <button
            type="button"
            :disabled="!canGoPrevious"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500"
            @click="goPrevious"
          >
            <ChevronLeft :size="16" />
            <span>{{ $t("pagination.previous") }}</span>
          </button>

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
          >
            {{ pageNumber }}
          </button>

          <button
            type="button"
            :disabled="!canGoNext"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500"
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
