<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  MoreHorizontal,
  Wrench,
  CircleDollarSign,
  Layers3,
} from "lucide-vue-next";

import { ServicesService } from "@/core/services/servicesService";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import ServiceFormModal from "@/modules/services/components/ServiceFormModal.vue";
import ServiceDetailsDrawer from "@/modules/services/components/ServiceDetailsDrawer.vue";
import ServiceRowActionMenu from "@/modules/services/components/ServiceRowActionMenu.vue";

import type { Service } from "@/core/interfaces/services";

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const loading = ref(false);
const services = ref<Service[]>([]);
const search = ref("");

async function loadServices() {
  const response = await ServicesService.browse({
    page: 1,
    pageSize: 100,
    search: search.value.trim() || undefined,
  });

  services.value = Array.isArray(response) ? [...response] : [];
}

async function loadData() {
  loading.value = true;

  try {
    await loadServices();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("services.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function reloadEventually(
  loader: () => Promise<void>,
  attempts = 10,
  delayMs = 500,
) {
  loading.value = true;

  try {
    for (let index = 0; index < attempts; index += 1) {
      await loader();

      if (index < attempts - 1) {
        await sleep(delayMs);
      }
    }
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("services.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function showSuccess(message: string) {
  toastStore.addToast({
    severity: "success",
    title: t("toast.success"),
    message,
  });
}

function showError(message: string) {
  toastStore.addToast({
    severity: "error",
    title: t("toast.error"),
    message,
  });
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

function getAvailabilityClass(status?: string | null): string {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "active" || normalized === "available") {
    return "bg-bt-success-100 text-bt-success-700";
  }

  if (normalized === "maintenance") {
    return "bg-bt-warning-100 text-bt-warning-700";
  }

  return "bg-bt-error-100 text-bt-error-700";
}

const filteredServices = computed(() => {
  const term = search.value.trim().toLowerCase();

  if (!term) {
    return services.value;
  }

  return services.value.filter((service) => {
    return (
      (service.code ?? "").toLowerCase().includes(term) ||
      (service.name ?? "").toLowerCase().includes(term) ||
      (service.description ?? "").toLowerCase().includes(term) ||
      (service.categoryName ?? "").toLowerCase().includes(term) ||
      (service.availabilityStatus ?? "").toLowerCase().includes(term) ||
      String(service.standardTimeMin ?? "")
        .toLowerCase()
        .includes(term) ||
      String(service.baseRate ?? "")
        .toLowerCase()
        .includes(term) ||
      (service.isActive
        ? t("services.status.active")
        : t("services.status.inactive")
      )
        .toLowerCase()
        .includes(term)
    );
  });
});

const summary = computed(() => {
  const total = services.value.length;

  const active = services.value.filter((item) => item.isActive).length;

  const averageRate =
    total === 0
      ? 0
      : services.value.reduce(
          (acc, item) => acc + Number(item.baseRate || 0),
          0,
        ) / total;

  return {
    total,
    active,
    averageRate,
  };
});

function getServiceActions(service: Service) {
  return [
    {
      label: t("services.actions.viewDetails"),
      action: () => openDetailsDrawer(service),
    },
    {
      label: t("services.actions.edit"),
      action: () => openEditModal(service),
    },
  ];
}

function openCreateModal() {
  modalStore.open({
    component: ServiceFormModal,
    props: {
      service: null,
    },
    onSuccess: async () => {
      showSuccess(t("services.messages.createSuccess"));
      await reloadEventually(loadServices);
    },
    onError: (error: any) => {
      showError(error?.message ?? t("services.messages.createError"));
    },
  });
}

function openEditModal(service: Service) {
  modalStore.open({
    component: ServiceFormModal,
    props: {
      service,
    },
    onSuccess: async () => {
      showSuccess(t("services.messages.updateSuccess"));
      await reloadEventually(loadServices);
    },
    onError: (error: any) => {
      showError(error?.message ?? t("services.messages.updateError"));
    },
  });
}

function openDetailsDrawer(service: Service) {
  drawerStore.openDrawer({
    component: ServiceDetailsDrawer,
    title: t("services.drawer.title"),
    description: t("services.drawer.description", {
      name: service.name,
    }),
    direction: "right",
    size: "xl",
    props: {
      serviceId: service.serviceId,
    },
    onSuccess: async () => {
      await reloadEventually(loadServices);
    },
    onError: (error: any) => {
      showError(error?.message ?? t("services.messages.loadError"));
    },
  });
}

async function handleServicesUpdated() {
  await loadData();
}

onMounted(async () => {
  await loadData();
  window.addEventListener("services-updated", handleServicesUpdated);
});

onBeforeUnmount(() => {
  window.removeEventListener("services-updated", handleServicesUpdated);
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("services.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("services.subtitle") }}
      </p>
    </div>

    <div
      class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
    >
      <div
        class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="w-12 h-12 rounded-full bg-bt-primary-50 flex items-center justify-center text-bt-primary-600"
          >
            <Wrench :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("services.summary.total") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-primary-700">
              {{ summary.total }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="w-12 h-12 rounded-full bg-bt-success-100 flex items-center justify-center text-bt-success-700"
          >
            <Layers3 :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("services.summary.active") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-success-700">
              {{ summary.active }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="w-12 h-12 rounded-full bg-bt-accent-50 flex items-center justify-center text-bt-accent-600"
          >
            <CircleDollarSign :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("services.summary.averageRate") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-accent-700">
              {{ formatMoney(summary.averageRate) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <div
          class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl"
        >
          <input
            v-model="search"
            type="text"
            :placeholder="$t('services.filters.search')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="loadData"
          />

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="loadData"
          >
            {{ $t("services.actions.search") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadData"
          >
            {{ $t("services.actions.refresh") }}
          </button>
        </div>

        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 transition font-bt-semibold"
          @click="openCreateModal"
        >
          {{ $t("services.actions.newService") }}
        </button>
      </div>

      <div class="flex-1 min-h-0 overflow-auto">
        <div
          v-if="loading"
          class="py-bt-spacing-32 text-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <table v-else class="w-full border-collapse min-w-[1300px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("services.table.code") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("services.table.name") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("services.table.category") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("services.table.standardTimeMin") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("services.table.baseRate") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("services.table.availabilityStatus") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("services.table.status") }}
              </th>
              <th
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
              >
                {{ $t("services.table.options") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="service in filteredServices"
              :key="service.serviceId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <div class="font-bt-semibold text-bt-primary-700">
                  {{ service.code }}
                </div>
                <div class="text-xs text-bt-grey-500">
                  {{ service.serviceId }}
                </div>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                <div class="font-bt-semibold text-bt-primary-700">
                  {{ service.name }}
                </div>
                <div class="text-xs text-bt-grey-500">
                  {{ service.description || "-" }}
                </div>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ service.categoryName || "-" }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ service.standardTimeMin ?? "-" }}
              </td>

              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold"
              >
                {{ formatMoney(service.baseRate) }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold"
                  :class="getAvailabilityClass(service.availabilityStatus)"
                >
                  {{ service.availabilityStatus || "-" }}
                </span>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold"
                  :class="
                    service.isActive
                      ? 'bg-bt-success-100 text-bt-success-700'
                      : 'bg-bt-error-100 text-bt-error-700'
                  "
                >
                  {{
                    service.isActive
                      ? $t("services.status.active")
                      : $t("services.status.inactive")
                  }}
                </span>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <ServiceRowActionMenu :items="getServiceActions(service)">
                  <template #trigger>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center w-10 h-10 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 transition"
                    >
                      <MoreHorizontal :size="18" />
                    </button>
                  </template>
                </ServiceRowActionMenu>
              </td>
            </tr>

            <tr v-if="!filteredServices.length && !loading">
              <td
                colspan="8"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("services.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
