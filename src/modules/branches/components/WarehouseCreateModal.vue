<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { WarehousesService } from "@/core/services/warehousesService";
import { useValidation } from "@/shared/composables/useValidation";
import BTFieldError from "@/shared/components/ui/BTFieldError.vue";
import { buildWarehouseSchema } from "@/modules/branches/branchFormSchema";

const props = defineProps<{
  branchId: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();
const { rules, validate, getError, fieldClass, firstError } = useValidation();

const code = ref("");
const name = ref("");
const description = ref("");
const isActive = ref(true);

const loading = ref(false);

function closeModal() {
  modalStore.close();
}

function validateForm(): boolean {
  return validate(
    {
      code: code.value,
      name: name.value,
      description: description.value,
    },
    buildWarehouseSchema(rules, t),
  );
}

async function submit() {
  if (!validateForm()) {
    modalStore.onError?.({ code: 400, message: firstError.value });
    return;
  }

  loading.value = true;

  try {
    const created = await WarehousesService.create({
      branchId: props.branchId,
      code: code.value.trim(),
      name: name.value.trim(),
      description: description.value.trim(),
      isActive: isActive.value,
    });

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("branches.warehouses.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-2xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("branches.warehouses.modal.createTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("branches.warehouses.modal.createDescription") }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("branches.warehouses.fields.code")
        }}</label>
        <input
          v-model="code"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('code')"
        />
        <BTFieldError :message="getError('code')" />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("branches.warehouses.fields.name")
        }}</label>
        <input
          v-model="name"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('name')"
        />
        <BTFieldError :message="getError('name')" />
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("branches.warehouses.fields.description")
        }}</label>
        <textarea
          v-model="description"
          rows="3"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          :class="fieldClass('description')"
        />
        <BTFieldError :message="getError('description')" />
      </div>

      <div class="md:col-span-2 flex items-center gap-bt-spacing-8">
        <input v-model="isActive" type="checkbox" />
        <span class="text-bt-primary-700">{{
          $t("branches.warehouses.fields.isActive")
        }}</span>
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
        :disabled="loading"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ loading ? $t("common.loading") : $t("common.save") }}
      </button>
    </div>
  </div>
</template>
