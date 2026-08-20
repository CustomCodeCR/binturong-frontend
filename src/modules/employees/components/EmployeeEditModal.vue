<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { EmployeesService } from "@/core/services/employeesService";
import { SelectService } from "@/core/services/selectService";
import { useValidation } from "@/shared/composables/useValidation";
import BTFieldError from "@/shared/components/ui/BTFieldError.vue";
import { buildEmployeeSchema } from "@/modules/employees/employeeFormSchema";

import type { Employee } from "@/core/interfaces/employees";
import type { SelectOption } from "@/core/interfaces/select";

const props = defineProps<{
  employeeId: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();
const { rules, validate, getError, fieldClass, firstError, setError } =
  useValidation();

const loading = ref(false);
const saving = ref(false);
const loadingCatalogs = ref(false);

const employee = ref<Employee | null>(null);
const branches = ref<SelectOption[]>([]);
const users = ref<SelectOption[]>([]);

const userId = ref("");
const branchId = ref("");
const fullName = ref("");
const email = ref("");
const jobTitle = ref("");
const baseSalary = ref<number | null>(null);
const hireDate = ref("");
const terminationDate = ref("");
const isActive = ref(true);

function closeModal() {
  modalStore.close();
}

/**
 * El backend devuelve `DateTime`/`DateTime?` en ISO y el input `type="date"`
 * solo entiende `YYYY-MM-DD`.
 */
function toDateInput(value?: string | null): string {
  if (!value) return "";
  return String(value).slice(0, 10);
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const [branchesResponse, usersResponse] = await Promise.all([
      SelectService.selectBranches({ onlyActive: true }),
      SelectService.selectUsers({ onlyActive: true }),
    ]);

    branches.value = branchesResponse;
    users.value = usersResponse;
  } finally {
    loadingCatalogs.value = false;
  }
}

async function loadEmployee() {
  loading.value = true;

  try {
    const response = await EmployeesService.readById(props.employeeId);
    employee.value = response;

    userId.value = response.userId ?? "";
    branchId.value = response.branchId ?? "";
    fullName.value = response.fullName;
    email.value = response.email ?? "";
    jobTitle.value = response.jobTitle;
    baseSalary.value = response.baseSalary;
    hireDate.value = toDateInput(response.hireDate);
    terminationDate.value = toDateInput(response.terminationDate);
    isActive.value = response.isActive;
  } finally {
    loading.value = false;
  }
}

function validateForm(): boolean {
  const valid = validate(
    {
      userId: userId.value,
      branchId: branchId.value,
      fullName: fullName.value,
      email: email.value,
      jobTitle: jobTitle.value,
      baseSalary: baseSalary.value,
    },
    buildEmployeeSchema(rules, t, {
      includeNationalId: false,
      includeHireDate: false,
    }),
  );

  if (
    hireDate.value &&
    terminationDate.value &&
    terminationDate.value < hireDate.value
  ) {
    setError("terminationDate", t("employees.validation.invalidDateRange"));
    return false;
  }

  return valid;
}

async function submit() {
  if (!employee.value) return;

  if (!validateForm()) {
    modalStore.onError?.({ code: 400, message: firstError.value });
    return;
  }

  saving.value = true;

  try {
    await EmployeesService.update(employee.value.employeeId, {
      userId: userId.value.trim(),
      branchId: branchId.value,
      fullName: fullName.value.trim(),
      // `Email` es obligatorio en UpdateEmployeeCommand (hace Email.Trim()):
      // omitirlo hacía que la actualización fallara y los cambios se perdieran.
      email: email.value.trim(),
      jobTitle: jobTitle.value.trim(),
      baseSalary: Number(baseSalary.value),
      // `DateOnly?`: "" rompe la deserialización y devuelve 400.
      terminationDate: terminationDate.value || null,
      isActive: isActive.value,
    });

    modalStore.onSuccess?.({ ok: true });
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("employees.messages.updateError"),
    });
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadCatalogs(), loadEmployee()]);
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-4xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("employees.modal.editTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("employees.modal.editDescription") }}
      </p>
    </div>

    <div
      v-if="loading || loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.userId") }}
        </label>
        <select
          v-model="userId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('userId')"
        >
          <option value="">
            {{ $t("employees.placeholders.selectUser") }}
          </option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.label }}
          </option>
        </select>
        <BTFieldError :message="getError('userId')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.branch") }}
        </label>
        <select
          v-model="branchId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('branchId')"
        >
          <option value="">
            {{ $t("employees.placeholders.selectBranch") }}
          </option>
          <option
            v-for="branch in branches"
            :key="branch.id"
            :value="branch.id"
          >
            {{ branch.label }}
          </option>
        </select>
        <BTFieldError :message="getError('branchId')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.fullName") }}
        </label>
        <input
          v-model="fullName"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('fullName')"
        />
        <BTFieldError :message="getError('fullName')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.email") }}
        </label>
        <input
          v-model="email"
          type="email"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('email')"
        />
        <BTFieldError :message="getError('email')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.jobTitle") }}
        </label>
        <input
          v-model="jobTitle"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('jobTitle')"
        />
        <BTFieldError :message="getError('jobTitle')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.baseSalary") }}
        </label>
        <input
          v-model.number="baseSalary"
          type="number"
          min="0"
          step="0.01"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('baseSalary')"
        />
        <BTFieldError :message="getError('baseSalary')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("employees.fields.terminationDate") }}
        </label>
        <input
          v-model="terminationDate"
          type="date"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('terminationDate')"
        />
        <BTFieldError :message="getError('terminationDate')" />
      </div>

      <div class="flex items-center gap-bt-spacing-8 pt-bt-spacing-32">
        <input v-model="isActive" type="checkbox" />
        <span class="text-bt-primary-700">
          {{ $t("employees.fields.isActive") }}
        </span>
      </div>
    </div>

    <div class="mt-bt-spacing-24 flex justify-end gap-bt-spacing-12">
      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeModal"
      >
        {{ $t("common.cancel") }}
      </button>

      <button
        type="button"
        :disabled="saving"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{
          saving ? $t("common.loading") : $t("employees.actions.saveChanges")
        }}
      </button>
    </div>
  </div>
</template>
