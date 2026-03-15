<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { UnitsOfMeasureService } from "@/core/services/unitsOfMeasureService";
import type { UnitOfMeasure } from "@/core/interfaces/unitsOfMeasure";

const props = defineProps<{
  uomId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();

const loadingUnit = ref(false);
const unit = ref<UnitOfMeasure | null>(null);

async function loadUnit() {
  loadingUnit.value = true;

  try {
    unit.value = await UnitsOfMeasureService.readById(props.uomId);
  } finally {
    loadingUnit.value = false;
  }
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

onMounted(async () => {
  await loadUnit();
});

watch(
  () => props.uomId,
  async () => {
    await loadUnit();
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("unitsOfMeasure.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            $t("unitsOfMeasure.drawer.description", { name: unit?.name ?? "" })
          }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("unitsOfMeasure.actions.close") }}
      </button>
    </div>

    <div v-if="loadingUnit" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <div v-else-if="unit" class="space-y-bt-spacing-16">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("unitsOfMeasure.table.code") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ unit.code }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("unitsOfMeasure.table.name") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ unit.name }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("unitsOfMeasure.table.status") }}
          </div>
          <div
            class="font-bt-semibold"
            :class="unit.isActive ? 'text-bt-success-700' : 'text-bt-error-700'"
          >
            {{
              unit.isActive
                ? $t("unitsOfMeasure.status.active")
                : $t("unitsOfMeasure.status.inactive")
            }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("unitsOfMeasure.fields.createdAt") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ unit.createdAt }}
          </div>
        </div>

        <div
          class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("unitsOfMeasure.fields.updatedAt") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ unit.updatedAt }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
