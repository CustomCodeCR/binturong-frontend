<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { ProductCategoriesService } from "@/core/services/productCategoriesService";
import type { ProductCategory } from "@/core/interfaces/productCategories";

const props = defineProps<{
  categoryId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();

const loadingCategory = ref(false);
const category = ref<ProductCategory | null>(null);

async function loadCategory() {
  loadingCategory.value = true;

  try {
    category.value = await ProductCategoriesService.readById(props.categoryId);
  } finally {
    loadingCategory.value = false;
  }
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

onMounted(async () => {
  await loadCategory();
});

watch(
  () => props.categoryId,
  async () => {
    await loadCategory();
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("categories.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            $t("categories.drawer.description", { name: category?.name ?? "" })
          }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("categories.actions.close") }}
      </button>
    </div>

    <div v-if="loadingCategory" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <div v-else-if="category" class="space-y-bt-spacing-16">
      <div class="grid grid-cols-1 gap-bt-spacing-16">
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("categories.table.name") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ category.name }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("categories.table.description") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ category.description }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("categories.table.status") }}
          </div>
          <div
            class="font-bt-semibold"
            :class="
              category.isActive ? 'text-bt-success-700' : 'text-bt-error-700'
            "
          >
            {{
              category.isActive
                ? $t("categories.status.active")
                : $t("categories.status.inactive")
            }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
