<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { ServiceOrdersService } from "@/core/services/serviceOrdersService";
import { SelectService } from "@/core/services/selectService";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import type { SelectOption } from "@/core/interfaces/select";
import type {
  ServiceOrderCreateChecklistItemRequest,
  ServiceOrderCreateMaterialItemRequest,
  ServiceOrderCreateServiceItemRequest,
} from "@/core/interfaces/serviceOrders";

const props = defineProps<{
  initialServiceId?: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const loadingCatalogs = ref(false);
const loading = ref(false);

const clients = ref<SelectOption[]>([]);
const branches = ref<SelectOption[]>([]);
const contracts = ref<SelectOption[]>([]);
const services = ref<SelectOption[]>([]);
const products = ref<SelectOption[]>([]);

const code = ref("");
const clientId = ref("");
const branchId = ref("");
const contractId = ref("");
const scheduledDate = ref("");
const serviceAddress = ref("");
const notes = ref("");

const serviceLines = ref<ServiceOrderCreateServiceItemRequest[]>([
  {
    serviceId: props.initialServiceId ?? "",
    quantity: 1,
  },
]);

const materialLines = ref<ServiceOrderCreateMaterialItemRequest[]>([]);
const checklistLines = ref<ServiceOrderCreateChecklistItemRequest[]>([]);

function closeDrawer() {
  drawerStore.closeDrawer();
}

function getLocalDateTimeForInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoString(localDateTime: string): string {
  if (!localDateTime) return "";

  const date = new Date(localDateTime);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
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

function addServiceLine() {
  serviceLines.value.push({
    serviceId: "",
    quantity: 1,
  });
}

function removeServiceLine(index: number) {
  serviceLines.value.splice(index, 1);
}

function addMaterialLine() {
  materialLines.value.push({
    productId: "",
    quantity: 1,
    estimatedCost: 0,
  });
}

function removeMaterialLine(index: number) {
  materialLines.value.splice(index, 1);
}

function addChecklistLine() {
  checklistLines.value.push({
    description: "",
    isCompleted: false,
  });
}

function removeChecklistLine(index: number) {
  checklistLines.value.splice(index, 1);
}

const normalizedServices = computed<ServiceOrderCreateServiceItemRequest[]>(
  () => {
    return serviceLines.value
      .map((line) => ({
        serviceId: String(line.serviceId ?? "").trim(),
        quantity: Number(line.quantity),
      }))
      .filter(
        (line) =>
          line.serviceId && !Number.isNaN(line.quantity) && line.quantity > 0,
      );
  },
);

const normalizedMaterials = computed<ServiceOrderCreateMaterialItemRequest[]>(
  () => {
    return materialLines.value
      .map((line) => ({
        productId: String(line.productId ?? "").trim(),
        quantity: Number(line.quantity),
        estimatedCost: Number(line.estimatedCost ?? 0),
      }))
      .filter(
        (line) =>
          line.productId &&
          !Number.isNaN(line.quantity) &&
          line.quantity > 0 &&
          !Number.isNaN(line.estimatedCost) &&
          line.estimatedCost >= 0,
      );
  },
);

const normalizedChecklists = computed<ServiceOrderCreateChecklistItemRequest[]>(
  () => {
    return checklistLines.value
      .map((line) => ({
        description: String(line.description ?? "").trim(),
        isCompleted: Boolean(line.isCompleted),
      }))
      .filter((line) => line.description);
  },
);

const estimatedItems = computed(() => {
  return normalizedServices.value.reduce(
    (acc, line) => acc + Number(line.quantity || 0),
    0,
  );
});

const estimatedMaterialsCost = computed(() => {
  return normalizedMaterials.value.reduce(
    (acc, line) =>
      acc + Number(line.estimatedCost || 0) * Number(line.quantity || 0),
    0,
  );
});

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const [
      clientsResponse,
      branchesResponse,
      servicesResponse,
      productsResponse,
      contractsResponse,
    ] = await Promise.all([
      SelectService.selectClients({ onlyActive: true }),
      SelectService.selectBranches({ onlyActive: true }),
      SelectService.selectServices({ onlyActive: true }),
      SelectService.selectProducts({ onlyActive: true }),
      SelectService.selectContracts?.() ?? Promise.resolve([]),
    ]);

    clients.value = clientsResponse ?? [];
    branches.value = branchesResponse ?? [];
    services.value = servicesResponse ?? [];
    products.value = productsResponse ?? [];
    contracts.value = contractsResponse ?? [];
  } catch (error: any) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message:
        error?.message ?? t("services.orders.messages.loadCatalogsError"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  const normalizedCode = code.value.trim();
  const normalizedClientId = clientId.value.trim();
  const normalizedBranchId = branchId.value.trim() || null;
  const normalizedContractId = contractId.value.trim() || null;
  const normalizedScheduledDate = toIsoString(scheduledDate.value);
  const normalizedAddress = serviceAddress.value.trim();
  const normalizedNotes = notes.value.trim() || null;

  if (
    !normalizedCode ||
    !normalizedClientId ||
    !normalizedScheduledDate ||
    !normalizedAddress
  ) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("services.orders.validation.required"),
    });
    return;
  }

  if (!normalizedServices.value.length) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("services.orders.validation.servicesRequired"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await ServiceOrdersService.create({
      code: normalizedCode,
      clientId: normalizedClientId,
      branchId: normalizedBranchId,
      contractId: normalizedContractId,
      scheduledDate: normalizedScheduledDate,
      serviceAddress: normalizedAddress,
      notes: normalizedNotes,
      services: normalizedServices.value,
      materials: normalizedMaterials.value,
      checklists: normalizedChecklists.value,
    });

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("services.orders.messages.createSuccess"),
    });

    drawerStore.onSuccess?.(created);
    drawerStore.closeDrawer();
    window.dispatchEvent(new CustomEvent("services-updated"));
  } catch (error: any) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: error?.message ?? t("services.orders.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  scheduledDate.value = getLocalDateTimeForInput();
  await loadCatalogs();
});
</script>

<template>
  <div class="h-full bg-bt-white flex flex-col">
    <div
      class="px-bt-spacing-24 pt-bt-spacing-24 pb-bt-spacing-16 border-b border-bt-grey-200"
    >
      <div class="flex items-start justify-between gap-bt-spacing-16">
        <div>
          <h2 class="text-xl font-bt-bold text-bt-primary-700">
            {{ $t("services.orders.drawer.createTitle") }}
          </h2>
          <p class="text-bt-grey-600 mt-bt-spacing-8">
            {{ $t("services.orders.drawer.createDescription") }}
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
    </div>

    <div
      v-if="loadingCatalogs"
      class="flex-1 flex items-center justify-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="flex-1 min-h-0 overflow-y-auto">
      <div class="p-bt-spacing-24 space-y-bt-spacing-24">
        <div
          class="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-bt-spacing-24"
        >
          <div
            class="rounded-l border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
          >
            <h3
              class="text-base font-bt-semibold text-bt-primary-700 mb-bt-spacing-16"
            >
              {{ $t("services.orders.sections.general") }}
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("services.orders.fields.code") }}
                </label>
                <input
                  v-model="code"
                  type="text"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>

              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("services.orders.fields.client") }}
                </label>
                <select
                  v-model="clientId"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                >
                  <option value="">
                    {{ $t("services.orders.placeholders.selectClient") }}
                  </option>
                  <option
                    v-for="client in clients"
                    :key="client.id"
                    :value="client.id"
                  >
                    {{ client.label }}
                  </option>
                </select>
              </div>

              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("services.orders.fields.branch") }}
                </label>
                <select
                  v-model="branchId"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                >
                  <option value="">
                    {{ $t("services.orders.placeholders.selectBranch") }}
                  </option>
                  <option
                    v-for="branch in branches"
                    :key="branch.id"
                    :value="branch.id"
                  >
                    {{ branch.label }}
                  </option>
                </select>
              </div>

              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("services.orders.fields.contract") }}
                </label>
                <select
                  v-model="contractId"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                >
                  <option value="">
                    {{ $t("services.orders.placeholders.selectContract") }}
                  </option>
                  <option
                    v-for="contract in contracts"
                    :key="contract.id"
                    :value="contract.id"
                  >
                    {{ contract.label }}
                  </option>
                </select>
              </div>

              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("services.orders.fields.scheduledDate") }}
                </label>
                <input
                  v-model="scheduledDate"
                  type="datetime-local"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>

              <div class="md:col-span-2">
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("services.orders.fields.serviceAddress") }}
                </label>
                <input
                  v-model="serviceAddress"
                  type="text"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>

              <div class="md:col-span-2">
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("services.orders.fields.notes") }}
                </label>
                <textarea
                  v-model="notes"
                  rows="3"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>
            </div>
          </div>

          <div
            class="rounded-l border border-bt-grey-200 bg-bt-primary-700 text-bt-white p-bt-spacing-16"
          >
            <h3 class="text-base font-bt-semibold mb-bt-spacing-16">
              {{ $t("services.orders.sections.summary") }}
            </h3>

            <div class="space-y-bt-spacing-12">
              <div class="flex items-center justify-between">
                <span class="text-bt-grey-200">{{
                  $t("services.orders.summary.services")
                }}</span>
                <span class="font-bt-semibold">{{
                  normalizedServices.length
                }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-bt-grey-200">{{
                  $t("services.orders.summary.estimatedItems")
                }}</span>
                <span class="font-bt-semibold">{{ estimatedItems }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-bt-grey-200">{{
                  $t("services.orders.summary.materials")
                }}</span>
                <span class="font-bt-semibold">{{
                  normalizedMaterials.length
                }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-bt-grey-200">{{
                  $t("services.orders.summary.checklists")
                }}</span>
                <span class="font-bt-semibold">{{
                  normalizedChecklists.length
                }}</span>
              </div>

              <div class="h-px bg-bt-primary-300/30 my-bt-spacing-8"></div>

              <div class="flex items-center justify-between">
                <span class="text-bt-grey-200">{{
                  $t("services.orders.summary.estimatedMaterialsCost")
                }}</span>
                <span class="font-bt-semibold">{{
                  formatMoney(estimatedMaterialsCost)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-l border border-bt-grey-200 overflow-hidden">
          <div
            class="flex items-center justify-between px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
          >
            <h3 class="font-bt-semibold text-bt-primary-700">
              {{ $t("services.orders.sections.services") }}
            </h3>

            <button
              type="button"
              class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
              @click="addServiceLine"
            >
              {{ $t("services.orders.actions.addService") }}
            </button>
          </div>

          <div class="p-bt-spacing-16 space-y-bt-spacing-12">
            <div
              v-for="(line, index) in serviceLines"
              :key="index"
              class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
            >
              <div
                class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-12 items-end"
              >
                <div class="md:col-span-2">
                  <label
                    class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                  >
                    {{ $t("services.orders.fields.service") }}
                  </label>
                  <select
                    v-model="line.serviceId"
                    class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                  >
                    <option value="">
                      {{ $t("services.orders.placeholders.selectService") }}
                    </option>
                    <option
                      v-for="service in services"
                      :key="service.id"
                      :value="service.id"
                    >
                      {{ service.label }}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                  >
                    {{ $t("services.orders.fields.quantity") }}
                  </label>
                  <div class="flex gap-bt-spacing-8">
                    <input
                      v-model.number="line.quantity"
                      type="number"
                      min="1"
                      step="1"
                      class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                    />
                    <button
                      v-if="serviceLines.length > 1"
                      type="button"
                      class="px-bt-spacing-12 py-bt-spacing-12 rounded-m bg-bt-error-100 text-bt-error-700 hover:bg-bt-error-300"
                      @click="removeServiceLine(index)"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-l border border-bt-grey-200 overflow-hidden">
          <div
            class="flex items-center justify-between px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
          >
            <h3 class="font-bt-semibold text-bt-primary-700">
              {{ $t("services.orders.sections.materials") }}
            </h3>

            <button
              type="button"
              class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
              @click="addMaterialLine"
            >
              {{ $t("services.orders.actions.addMaterial") }}
            </button>
          </div>

          <div class="p-bt-spacing-16 space-y-bt-spacing-12">
            <div v-if="!materialLines.length" class="text-sm text-bt-grey-500">
              {{ $t("services.orders.emptyMaterials") }}
            </div>

            <div
              v-for="(line, index) in materialLines"
              :key="index"
              class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
            >
              <div
                class="grid grid-cols-1 md:grid-cols-4 gap-bt-spacing-12 items-end"
              >
                <div class="md:col-span-2">
                  <label
                    class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                  >
                    {{ $t("services.orders.fields.product") }}
                  </label>
                  <select
                    v-model="line.productId"
                    class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                  >
                    <option value="">
                      {{ $t("services.orders.placeholders.selectProduct") }}
                    </option>
                    <option
                      v-for="product in products"
                      :key="product.id"
                      :value="product.id"
                    >
                      {{ product.label }}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                  >
                    {{ $t("services.orders.fields.quantity") }}
                  </label>
                  <input
                    v-model.number="line.quantity"
                    type="number"
                    min="1"
                    step="1"
                    class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                  />
                </div>

                <div>
                  <label
                    class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                  >
                    {{ $t("services.orders.fields.estimatedCost") }}
                  </label>
                  <div class="flex gap-bt-spacing-8">
                    <input
                      v-model.number="line.estimatedCost"
                      type="number"
                      min="0"
                      step="0.01"
                      class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                    />
                    <button
                      type="button"
                      class="px-bt-spacing-12 py-bt-spacing-12 rounded-m bg-bt-error-100 text-bt-error-700 hover:bg-bt-error-300"
                      @click="removeMaterialLine(index)"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-l border border-bt-grey-200 overflow-hidden">
          <div
            class="flex items-center justify-between px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
          >
            <h3 class="font-bt-semibold text-bt-primary-700">
              {{ $t("services.orders.sections.checklist") }}
            </h3>

            <button
              type="button"
              class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
              @click="addChecklistLine"
            >
              {{ $t("services.orders.actions.addChecklist") }}
            </button>
          </div>

          <div class="p-bt-spacing-16 space-y-bt-spacing-12">
            <div v-if="!checklistLines.length" class="text-sm text-bt-grey-500">
              {{ $t("services.orders.emptyChecklist") }}
            </div>

            <div
              v-for="(line, index) in checklistLines"
              :key="index"
              class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
            >
              <div
                class="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-bt-spacing-12 items-center"
              >
                <div>
                  <label
                    class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                  >
                    {{ $t("services.orders.fields.description") }}
                  </label>
                  <input
                    v-model="line.description"
                    type="text"
                    class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                  />
                </div>

                <label
                  class="inline-flex items-center gap-bt-spacing-8 text-sm text-bt-primary-700 mt-6"
                >
                  <input v-model="line.isCompleted" type="checkbox" />
                  {{ $t("services.orders.fields.isCompleted") }}
                </label>

                <button
                  type="button"
                  class="px-bt-spacing-12 py-bt-spacing-12 rounded-m bg-bt-error-100 text-bt-error-700 hover:bg-bt-error-300 mt-6"
                  @click="removeChecklistLine(index)"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-bt-spacing-12">
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
            @click="closeDrawer"
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
  </div>
</template>
