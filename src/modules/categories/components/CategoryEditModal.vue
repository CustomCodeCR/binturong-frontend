<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useModalStore } from "@/core/stores/modalStore";
import { ProductCategoriesService } from "@/core/services/productCategoriesService";
import type { ProductCategory } from "@/core/interfaces/productCategories";

const props = defineProps<{
  categoryId: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const loading = ref(false);
const saving = ref(false);
const category = ref<ProductCategory | null>(null);

const name = ref("");
const description = ref("");
const isActive = ref(true);

function closeModal() {
  modalStore.close();
}

async function loadCategory() {
  loading.value = true;

  try {
    const response = await ProductCategoriesService.readById(props.categoryId);
    category.value = response;

    name.value = response.name;
    description.value = response.description;
    isActive.value = response.isActive;
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!category.value) return;

  if (!name.value.trim() || !description.value.trim()) {
    modalStore.onError?.({
      code: 400,
      message: t("categories.validation.requiredUpdate"),
    });
    return;
  }

  saving.value = true;

  try {
    await ProductCategoriesService.update(category.value.categoryId, {
      name: name.value.trim(),
      description: description.value.trim(),
      isActive: isActive.value,
    });

    modalStore.onSuccess?.({ ok: true });
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("categories.messages.updateError"),
    });
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadCategory();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("categories.modal.editTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("categories.modal.editDescription") }}
      </p>
    </div>

    <div v-if="loading" class="py-bt-spacing-24 text-center text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <div v-else class="grid grid-cols-1 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("categories.fields.name") }}
        </label>
        <input
          v-model="name"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("categories.fields.description") }}
        </label>
        <textarea
          v-model="description"
          rows="4"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="flex items-center gap-bt-spacing-8">
        <input v-model="isActive" type="checkbox" />
        <span class="text-bt-primary-700">{{
          $t("categories.fields.isActive")
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
        :disabled="saving"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{
          saving ? $t("common.loading") : $t("categories.actions.saveChanges")
        }}
      </button>
    </div>
  </div>
</template>
