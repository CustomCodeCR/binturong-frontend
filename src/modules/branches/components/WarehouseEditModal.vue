<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { WarehousesService } from "@/core/services/warehousesService";

const props = defineProps<{
  warehouseId: string;
  code: string;
  name: string;
  isActive: boolean;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const code = ref(props.code);
const name = ref(props.name);
const description = ref("");
const isActive = ref(props.isActive);

const loading = ref(false);

function closeModal() {
  modalStore.close();
}

async function submit() {
  if (!code.value.trim() || !name.value.trim() || !description.value.trim()) {
    modalStore.onError?.({
      code: 400,
      message: t("branches.warehouses.validation.requiredUpdate"),
    });
    return;
  }

  loading.value = true;

  try {
    await WarehousesService.update(props.warehouseId, {
      code: code.value.trim(),
      name: name.value.trim(),
      description: description.value.trim(),
      isActive: isActive.value,
    });

    modalStore.onSuccess?.({ ok: true });
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("branches.warehouses.messages.updateError"),
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
        {{ $t("branches.warehouses.modal.editTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("branches.warehouses.modal.editDescription") }}
      </p>
    </div>

    <div
      class="mb-bt-spacing-12 rounded-m bg-bt-warning-100 text-bt-warning-700 px-bt-spacing-16 py-bt-spacing-12 text-sm"
    >
      {{ $t("branches.warehouses.messages.editDescriptionWarning") }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("branches.warehouses.fields.code")
        }}</label>
        <input
          v-model="code"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("branches.warehouses.fields.name")
        }}</label>
        <input
          v-model="name"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("branches.warehouses.fields.description")
        }}</label>
        <textarea
          v-model="description"
          rows="3"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
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
        {{
          loading ? $t("common.loading") : $t("branches.actions.saveChanges")
        }}
      </button>
    </div>
  </div>
</template>
