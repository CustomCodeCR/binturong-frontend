<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal } from "lucide-vue-next";

import { ServicesService } from "@/core/services/servicesService";
import { ServiceOrdersService } from "@/core/services/serviceOrdersService";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import ServiceFormModal from "@/modules/services/components/ServiceFormModal.vue";
import ServiceOrderCreateDrawer from "@/modules/services/components/ServiceOrderCreateDrawer.vue";
import ServiceOrderRowActionMenu from "@/modules/services/components/ServiceOrderRowActionMenu.vue";
import ServiceOrderDetailsDrawer from "@/modules/services/components/ServiceOrderDetailsDrawer.vue";

import type { Service } from "@/core/interfaces/services";
import type { ServiceOrder } from "@/core/interfaces/serviceOrders";

const props = defineProps<{
  serviceId: string;
}>();

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const activeTab = ref<"details" | "orders">("details");

const loadingService = ref(false);
const loadingOrders = ref(false);

const service = ref<Service | null>(null);
const orders = ref<ServiceOrder[]>([]);

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return Number(value).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-CR");
}

function getOrderStatusClass(status?: string | null): string {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();

  if (
    normalized.includes("open") ||
    normalized.includes("pending") ||
    normalized.includes("scheduled")
  ) {
    return "bg-bt-info-100 text-bt-info-700";
  }

  if (
    normalized.includes("progress") ||
    normalized.includes("working") ||
    normalized.includes("assigned")
  ) {
    return "bg-bt-warning-100 text-bt-warning-700";
  }

  if (
    normalized.includes("closed") ||
    normalized.includes("completed") ||
    normalized.includes("done")
  ) {
    return "bg-bt-success-100 text-bt-success-700";
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("reject") ||
    normalized.includes("error")
  ) {
    return "bg-bt-error-100 text-bt-error-700";
  }

  return "bg-bt-grey-200 text-bt-primary-700";
}

const filteredOrders = computed(() => {
  return orders.value.filter((order) =>
    Array.isArray(order.services)
      ? order.services.some((line) => line.serviceId === props.serviceId)
      : false,
  );
});

const ordersSummary = computed(() => {
  const total = filteredOrders.value.length;

  const open = filteredOrders.value.filter((order) => {
    const status = String(order.status ?? "").toLowerCase();
    return (
      status.includes("open") ||
      status.includes("pending") ||
      status.includes("scheduled")
    );
  }).length;

  const closed = filteredOrders.value.filter((order) => {
    const status = String(order.status ?? "").toLowerCase();
    return status.includes("closed") || status.includes("completed");
  }).length;

  return {
    total,
    open,
    closed,
  };
});

async function loadService() {
  loadingService.value = true;

  try {
    service.value = await ServicesService.readById(props.serviceId);
  } catch {
    service.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("services.messages.loadDetailError"),
    });
  } finally {
    loadingService.value = false;
  }
}

async function loadOrders() {
  loadingOrders.value = true;

  try {
    const response = await ServiceOrdersService.browse({
      page: 1,
      pageSize: 100,
    });

    orders.value = Array.isArray(response) ? response : [];
  } catch {
    orders.value = [];

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("services.orders.messages.loadError"),
    });
  } finally {
    loadingOrders.value = false;
  }
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

function openEditModal() {
  if (!service.value) return;

  modalStore.open({
    component: ServiceFormModal,
    props: {
      service: service.value,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("services.messages.updateSuccess"),
      });

      await loadService();
      window.dispatchEvent(new CustomEvent("services-updated"));
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("services.messages.updateError"),
      });
    },
  });
}

function openCreateOrderDrawer() {
  drawerStore.openDrawer({
    component: ServiceOrderCreateDrawer,
    title: t("services.orders.drawer.createTitle"),
    description: t("services.orders.drawer.createDescription"),
    direction: "right",
    size: "xl",
    props: {
      initialServiceId: props.serviceId,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("services.orders.messages.createSuccess"),
      });

      activeTab.value = "orders";
      await loadOrders();
    },
    onError: (error: any) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("services.orders.messages.createError"),
      });
    },
  });
}

function openOrderDetailsDrawer(order: ServiceOrder) {
  drawerStore.openDrawer({
    component: ServiceOrderDetailsDrawer,
    title: t("services.orders.drawer.detailsTitle"),
    description: t("services.orders.drawer.detailsDescription", {
      code: order.code,
    }),
    direction: "right",
    size: "xl",
    props: {
      serviceOrderId: order.serviceOrderId,
    },
    onSuccess: async () => {
      await loadOrders();
    },
    onError: (error: any) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("services.orders.messages.loadError"),
      });
    },
  });
}

function getOrderActions(order: ServiceOrder) {
  return [
    {
      label: t("services.actions.viewDetails"),
      action: () => openOrderDetailsDrawer(order),
    },
  ];
}

onMounted(async () => {
  await loadService();
  await loadOrders();
});

watch(
  () => props.serviceId,
  async () => {
    await loadService();
    await loadOrders();
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("services.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{ $t("services.drawer.description") }}
        </p>
      </div>

      <div class="flex gap-bt-spacing-8">
        <button
          type="button"
          class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
          @click="openEditModal"
        >
          {{ $t("services.actions.edit") }}
        </button>

        <button
          type="button"
          class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
          @click="closeDrawer"
        >
          {{ $t("common.close") }}
        </button>
      </div>
    </div>

    <div class="flex flex-wrap gap-bt-spacing-8 mb-bt-spacing-24">
      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
        :class="
          activeTab === 'details'
            ? 'bg-bt-primary-500 text-bt-white'
            : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
        "
        @click="activeTab = 'details'"
      >
        {{ $t("services.drawer.tabs.details") }}
      </button>

      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
        :class="
          activeTab === 'orders'
            ? 'bg-bt-primary-500 text-bt-white'
            : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
        "
        @click="activeTab = 'orders'"
      >
        {{ $t("services.drawer.tabs.orders") }}
      </button>

      <button
        type="button"
        class="ml-auto px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600"
        @click="openCreateOrderDrawer"
      >
        {{ $t("services.orders.actions.newOrder") }}
      </button>
    </div>

    <div v-if="loadingService" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <template v-else-if="service">
      <div
        v-if="activeTab === 'details'"
        class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16"
      >
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.fields.code") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ service.code }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.fields.name") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ service.name }}
          </div>
        </div>

        <div
          class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.fields.description") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ service.description || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.fields.category") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ service.categoryName || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.fields.isCategoryProtected") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{
              service.isCategoryProtected ? $t("common.yes") : $t("common.no")
            }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.fields.standardTimeMin") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ service.standardTimeMin }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.fields.baseRate") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ formatMoney(service.baseRate) }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.fields.availabilityStatus") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ service.availabilityStatus || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("services.fields.isActive") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{
              service.isActive
                ? $t("services.status.active")
                : $t("services.status.inactive")
            }}
          </div>
        </div>
      </div>

      <div v-else class="space-y-bt-spacing-16">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-16 shrink-0">
          <div
            class="rounded-m border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
          >
            <div class="text-sm text-bt-grey-500">
              {{ $t("services.orders.summary.total") }}
            </div>
            <div
              class="text-2xl font-bt-bold text-bt-primary-700 mt-bt-spacing-8"
            >
              {{ ordersSummary.total }}
            </div>
          </div>

          <div
            class="rounded-m border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
          >
            <div class="text-sm text-bt-grey-500">
              {{ $t("services.orders.summary.open") }}
            </div>
            <div
              class="text-2xl font-bt-bold text-bt-warning-700 mt-bt-spacing-8"
            >
              {{ ordersSummary.open }}
            </div>
          </div>

          <div
            class="rounded-m border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
          >
            <div class="text-sm text-bt-grey-500">
              {{ $t("services.orders.summary.closed") }}
            </div>
            <div
              class="text-2xl font-bt-bold text-bt-success-700 mt-bt-spacing-8"
            >
              {{ ordersSummary.closed }}
            </div>
          </div>
        </div>

        <div
          class="bg-bt-white rounded-m border border-bt-grey-200 overflow-hidden"
        >
          <div
            v-if="loadingOrders"
            class="py-bt-spacing-32 text-center text-bt-grey-500"
          >
            {{ $t("common.loading") }}
          </div>

          <div v-else class="overflow-auto">
            <table class="w-full border-collapse min-w-[1200px]">
              <thead class="sticky top-0 z-10">
                <tr class="bg-bt-primary-50 text-left">
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("services.orders.table.code") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("services.orders.table.client") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("services.orders.table.branch") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("services.orders.table.contract") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("services.orders.table.status") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("services.orders.table.scheduledDate") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("services.orders.table.address") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("services.orders.table.items") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
                  >
                    {{ $t("services.orders.table.options") }}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="order in filteredOrders"
                  :key="order.serviceOrderId"
                  class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
                >
                  <td class="px-bt-spacing-16 py-bt-spacing-12">
                    <div class="font-bt-semibold text-bt-primary-700">
                      {{ order.code }}
                    </div>
                    <div class="text-xs text-bt-grey-500">
                      {{ order.serviceOrderId }}
                    </div>
                  </td>

                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ order.clientName || "-" }}
                  </td>

                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ order.branchName || "-" }}
                  </td>

                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ order.contractCode || "-" }}
                  </td>

                  <td class="px-bt-spacing-16 py-bt-spacing-12">
                    <span
                      class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold"
                      :class="getOrderStatusClass(order.status)"
                    >
                      {{ order.status || "-" }}
                    </span>
                  </td>

                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ formatDateTime(order.scheduledDate) }}
                  </td>

                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ order.serviceAddress || "-" }}
                  </td>

                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ order.services?.length ?? 0 }}
                  </td>

                  <td class="px-bt-spacing-16 py-bt-spacing-12">
                    <ServiceOrderRowActionMenu :items="getOrderActions(order)">
                      <template #trigger>
                        <button
                          type="button"
                          class="inline-flex items-center justify-center w-10 h-10 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 transition"
                        >
                          <MoreHorizontal :size="18" />
                        </button>
                      </template>
                    </ServiceOrderRowActionMenu>
                  </td>
                </tr>

                <tr v-if="!filteredOrders.length">
                  <td
                    colspan="9"
                    class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                  >
                    {{ $t("services.orders.empty") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
