<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { ServiceOrdersService } from "@/core/services/serviceOrdersService";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import type { ServiceOrder } from "@/core/interfaces/serviceOrders";

const props = defineProps<{
  serviceOrderId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const loading = ref(false);
const serviceOrder = ref<ServiceOrder | null>(null);

function closeDrawer() {
  drawerStore.closeDrawer();
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-CR");
}

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return Number(value).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const serviceCount = computed(() => serviceOrder.value?.services?.length ?? 0);
const materialCount = computed(
  () => serviceOrder.value?.materials?.length ?? 0,
);
const checklistCount = computed(
  () => serviceOrder.value?.checklists?.length ?? 0,
);

async function loadServiceOrder() {
  loading.value = true;

  try {
    serviceOrder.value = await ServiceOrdersService.readById(
      props.serviceOrderId,
    );
  } catch {
    serviceOrder.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("services.orders.messages.loadDetailError"),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadServiceOrder();
});

watch(
  () => props.serviceOrderId,
  async () => {
    await loadServiceOrder();
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("services.orders.drawer.detailsTitle") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            $t("services.orders.drawer.detailsDescription", {
              code: serviceOrder?.code || "",
            })
          }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("common.close") }}
      </button>
    </div>

    <div v-if="loading" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <template v-else-if="serviceOrder">
      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16 mb-bt-spacing-24"
      >
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.orders.fields.code") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ serviceOrder.code }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.orders.fields.status") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ serviceOrder.status || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.orders.fields.client") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ serviceOrder.clientName || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.orders.fields.branch") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ serviceOrder.branchName || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.orders.fields.contract") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ serviceOrder.contractCode || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.orders.fields.scheduledDate") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ formatDateTime(serviceOrder.scheduledDate) }}
          </div>
        </div>

        <div
          class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.orders.fields.serviceAddress") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ serviceOrder.serviceAddress || "-" }}
          </div>
        </div>

        <div
          class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.orders.fields.notes") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold whitespace-pre-wrap">
            {{ serviceOrder.notes || "-" }}
          </div>
        </div>
      </div>

      <div
        class="grid grid-cols-2 md:grid-cols-3 gap-bt-spacing-16 mb-bt-spacing-24"
      >
        <div
          class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.orders.summary.services") }}
          </div>
          <div class="text-xl font-bt-bold text-bt-primary-700 mt-bt-spacing-8">
            {{ serviceCount }}
          </div>
        </div>

        <div
          class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.orders.summary.materials") }}
          </div>
          <div class="text-xl font-bt-bold text-bt-primary-700 mt-bt-spacing-8">
            {{ materialCount }}
          </div>
        </div>

        <div
          class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.orders.summary.checklists") }}
          </div>
          <div class="text-xl font-bt-bold text-bt-primary-700 mt-bt-spacing-8">
            {{ checklistCount }}
          </div>
        </div>
      </div>

      <div
        class="rounded-m border border-bt-grey-200 overflow-hidden mb-bt-spacing-24"
      >
        <div
          class="px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
        >
          <h3 class="font-bt-semibold text-bt-primary-700">
            {{ $t("services.orders.sections.services") }}
          </h3>
        </div>

        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-grey-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("services.orders.fields.service") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("services.orders.fields.quantity") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(line, index) in serviceOrder.services"
              :key="line.serviceOrderDetailId ?? index"
              class="border-t border-bt-grey-200"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.serviceName || line.serviceId || "-" }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.quantity }}
              </td>
            </tr>

            <tr v-if="!serviceOrder.services?.length">
              <td
                colspan="2"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("services.orders.emptyServices") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="rounded-m border border-bt-grey-200 overflow-hidden mb-bt-spacing-24"
      >
        <div
          class="px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
        >
          <h3 class="font-bt-semibold text-bt-primary-700">
            {{ $t("services.orders.sections.materials") }}
          </h3>
        </div>

        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-grey-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("services.orders.fields.product") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("services.orders.fields.quantity") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("services.orders.fields.estimatedCost") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(line, index) in serviceOrder.materials"
              :key="line.serviceOrderMaterialId ?? index"
              class="border-t border-bt-grey-200"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.productName || line.productId || "-" }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.quantity }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatMoney(line.estimatedCost) }}
              </td>
            </tr>

            <tr v-if="!serviceOrder.materials?.length">
              <td
                colspan="3"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("services.orders.emptyMaterials") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="rounded-m border border-bt-grey-200 overflow-hidden">
        <div
          class="px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
        >
          <h3 class="font-bt-semibold text-bt-primary-700">
            {{ $t("services.orders.sections.checklist") }}
          </h3>
        </div>

        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-grey-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("services.orders.fields.description") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("services.orders.fields.isCompleted") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(line, index) in serviceOrder.checklists"
              :key="line.serviceOrderChecklistId ?? index"
              class="border-t border-bt-grey-200"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.description || "-" }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.isCompleted ? $t("common.yes") : $t("common.no") }}
              </td>
            </tr>

            <tr v-if="!serviceOrder.checklists?.length">
              <td
                colspan="2"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("services.orders.emptyChecklist") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
