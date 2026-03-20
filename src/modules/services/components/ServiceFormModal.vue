<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { ServicesService } from "@/core/services/servicesService";
import { SelectService } from "@/core/services/selectService";
import { useModalStore } from "@/core/stores/modalStore";

import type {
  Service,
  ServiceAvailabilityStatus,
} from "@/core/interfaces/services";
import type { SelectOption } from "@/core/interfaces/select";

const props = defineProps<{
  service: Service | null;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const loading = ref(false);
const loadingCatalogs = ref(false);

const categories = ref<SelectOption[]>([]);

const code = ref("");
const name = ref("");
const description = ref("");
const categoryId = ref("");
const isCategoryProtected = ref(false);
const standardTimeMin = ref<number | null>(null);
const baseRate = ref<number | null>(null);
const isActive = ref(true);
const availabilityStatus = ref<ServiceAvailabilityStatus>("Active");

const isEdit = ref(false);

function closeModal() {
  modalStore.close();
}

async function loadCategories() {
  loadingCatalogs.value = true;

  try {
    categories.value = await SelectService.selectProductCategories({
      onlyActive: true,
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

function loadForm() {
  if (!props.service) return;

  isEdit.value = true;
  code.value = props.service.code;
  name.value = props.service.name;
  description.value = props.service.description ?? "";
  categoryId.value = props.service.categoryId;
  isCategoryProtected.value = props.service.isCategoryProtected;
  standardTimeMin.value = props.service.standardTimeMin;
  baseRate.value = props.service.baseRate;
  isActive.value = props.service.isActive;
  availabilityStatus.value = props.service.availabilityStatus;
}

function validate(): string | null {
  if (
    !code.value.trim() ||
    !name.value.trim() ||
    !categoryId.value.trim() ||
    standardTimeMin.value === null ||
    baseRate.value === null
  ) {
    return t("services.validation.required");
  }

  if (Number(standardTimeMin.value) <= 0) {
    return t("services.validation.invalidTime");
  }

  if (Number(baseRate.value) < 0) {
    return t("services.validation.invalidRate");
  }

  if (
    isEdit.value &&
    props.service?.isCategoryProtected &&
    props.service.categoryId !== categoryId.value
  ) {
    return t("services.validation.protectedCategory");
  }

  return null;
}

async function submit() {
  const validationMessage = validate();

  if (validationMessage) {
    modalStore.onError?.({
      code: 400,
      message: validationMessage,
    });
    return;
  }

  loading.value = true;

  try {
    const payload = {
      code: code.value.trim(),
      name: name.value.trim(),
      description: description.value.trim(),
      categoryId: categoryId.value.trim(),
      isCategoryProtected: isCategoryProtected.value,
      standardTimeMin: Number(standardTimeMin.value),
      baseRate: Number(baseRate.value),
      isActive: isActive.value,
      availabilityStatus: availabilityStatus.value,
    };

    if (props.service) {
      await ServicesService.update(props.service.serviceId, payload);
    } else {
      await ServicesService.create(payload);
    }

    window.dispatchEvent(new CustomEvent("services-updated"));
    modalStore.onSuccess?.(true);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message:
        error?.message ??
        (props.service
          ? t("services.messages.updateError")
          : t("services.messages.createError")),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadCategories();
  loadForm();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-3xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{
          isEdit
            ? $t("services.modal.editTitle")
            : $t("services.modal.createTitle")
        }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{
          isEdit
            ? $t("services.modal.editDescription")
            : $t("services.modal.createDescription")
        }}
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="space-y-bt-spacing-16">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("services.fields.code") }}
          </label>
          <input
            v-model="code"
            type="text"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("services.fields.name") }}
          </label>
          <input
            v-model="name"
            type="text"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("services.fields.description") }}
          </label>
          <textarea
            v-model="description"
            rows="3"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("services.fields.category") }}
          </label>
          <select
            v-model="categoryId"
            :disabled="isEdit && props.service?.isCategoryProtected"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white disabled:bg-bt-grey-100 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("services.placeholders.selectCategory") }}
            </option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.label }}
            </option>
          </select>
        </div>

        <div class="flex items-end">
          <label
            class="inline-flex items-center gap-bt-spacing-8 text-bt-primary-700"
          >
            <input v-model="isCategoryProtected" type="checkbox" />
            <span>{{ $t("services.fields.isCategoryProtected") }}</span>
          </label>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("services.fields.standardTimeMin") }}
          </label>
          <input
            v-model.number="standardTimeMin"
            type="number"
            min="1"
            step="1"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("services.fields.baseRate") }}
          </label>
          <input
            v-model.number="baseRate"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("services.fields.availabilityStatus") }}
          </label>
          <select
            v-model="availabilityStatus"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="Active">
              {{ $t("services.availability.active") }}
            </option>
            <option value="Inactive">
              {{ $t("services.availability.inactive") }}
            </option>
            <option value="Maintenance">
              {{ $t("services.availability.maintenance") }}
            </option>
          </select>
        </div>

        <div class="flex items-end">
          <label
            class="inline-flex items-center gap-bt-spacing-8 text-bt-primary-700"
          >
            <input v-model="isActive" type="checkbox" />
            <span>{{ $t("services.fields.isActive") }}</span>
          </label>
        </div>
      </div>

      <div class="flex justify-end gap-bt-spacing-12">
        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
          @click="closeModal"
        >
          {{ $t("common.cancel") }}
        </button>

        <button
          type="button"
          :disabled="loading"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
          @click="submit"
        >
          {{ loading ? $t("common.loading") : $t("common.save") }}
        </button>
      </div>
    </div>
  </div>
</template>
