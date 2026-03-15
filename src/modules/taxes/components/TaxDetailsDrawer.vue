<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { TaxesService } from "@/core/services/taxesService";
import type { Tax } from "@/core/interfaces/taxes";

const props = defineProps<{
  taxId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();

const loadingTax = ref(false);
const tax = ref<Tax | null>(null);

async function loadTax() {
  loadingTax.value = true;

  try {
    tax.value = await TaxesService.readById(props.taxId);
  } finally {
    loadingTax.value = false;
  }
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

onMounted(async () => {
  await loadTax();
});

watch(
  () => props.taxId,
  async () => {
    await loadTax();
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("taxes.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{ $t("taxes.drawer.description", { name: tax?.name ?? "" }) }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("taxes.actions.close") }}
      </button>
    </div>

    <div v-if="loadingTax" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <div v-else-if="tax" class="space-y-bt-spacing-16">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("taxes.table.name") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">{{ tax.name }}</div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("taxes.table.code") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">{{ tax.code }}</div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("taxes.table.percentage") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ tax.percentage }}%
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("taxes.table.status") }}
          </div>
          <div
            class="font-bt-semibold"
            :class="tax.isActive ? 'text-bt-success-700' : 'text-bt-error-700'"
          >
            {{
              tax.isActive
                ? $t("taxes.status.active")
                : $t("taxes.status.inactive")
            }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("taxes.fields.createdAt") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ tax.createdAt }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("taxes.fields.updatedAt") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ tax.updatedAt }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
