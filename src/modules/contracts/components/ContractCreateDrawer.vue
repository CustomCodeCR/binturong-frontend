<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import { SelectService } from "@/core/services/selectService";
import { ContractsService } from "@/core/services/contractsService";

import type { SelectOption } from "@/core/interfaces/select";
import type { ContractMilestoneCreateRequest } from "@/core/interfaces/contracts";

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const loadingCatalogs = ref(false);
const loading = ref(false);

const clients = ref<SelectOption[]>([]);
const quotes = ref<SelectOption[]>([]);
const salesOrders = ref<SelectOption[]>([]);

const code = ref("");
const clientId = ref("");
const quoteId = ref("");
const salesOrderId = ref("");
const startDate = ref("");
const endDate = ref("");
const status = ref("Active");
const description = ref("");
const notes = ref("");

const milestones = ref<ContractMilestoneCreateRequest[]>([
  {
    description: "",
    percentage: 0,
    amount: 0,
    scheduledDate: "",
  },
]);

function getLocalDateForInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateText: string, days: number): string {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return getLocalDateForInput(date);
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

function addMilestone() {
  milestones.value.push({
    description: "",
    percentage: 0,
    amount: 0,
    scheduledDate: "",
  });
}

function removeMilestone(index: number) {
  milestones.value.splice(index, 1);
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const [clientsResponse, quotesResponse, salesOrdersResponse] =
      await Promise.all([
        SelectService.selectClients({
          onlyActive: true,
        }),
        SelectService.selectQuotes(),
        SelectService.selectSalesOrders(),
      ]);

    clients.value = clientsResponse ?? [];
    quotes.value = quotesResponse ?? [];
    salesOrders.value = salesOrdersResponse ?? [];
  } catch (error: any) {
    console.error("Load contract catalogs error:", error);

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: error?.message ?? t("common.errors.loadData"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  const normalizedCode = code.value.trim();
  const normalizedClientId = clientId.value.trim();
  const normalizedQuoteId = quoteId.value.trim();
  const normalizedSalesOrderId = salesOrderId.value.trim();
  const normalizedStatus = status.value.trim();
  const normalizedDescription = description.value.trim();
  const normalizedNotes = notes.value.trim();

  if (
    !normalizedCode ||
    !normalizedClientId ||
    !startDate.value ||
    !endDate.value ||
    !normalizedStatus ||
    !normalizedDescription
  ) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("contracts.validation.required"),
    });
    return;
  }

  if (normalizedDescription.length > 255 || normalizedNotes.length > 255) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("contracts.validation.maxLength"),
    });
    return;
  }

  if (new Date(endDate.value) < new Date(startDate.value)) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("contracts.validation.invalidRange"),
    });
    return;
  }

  const normalizedMilestones = milestones.value
    .map((item) => ({
      description: String(item.description ?? "").trim(),
      percentage: Number(item.percentage),
      amount: Number(item.amount),
      scheduledDate: String(item.scheduledDate ?? "").trim(),
    }))
    .filter((item) => item.description || item.scheduledDate);

  const invalidMilestone = normalizedMilestones.some(
    (item) =>
      !item.description ||
      Number.isNaN(item.percentage) ||
      item.percentage < 0 ||
      Number.isNaN(item.amount) ||
      item.amount < 0 ||
      !item.scheduledDate,
  );

  if (invalidMilestone) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("contracts.validation.invalidMilestone"),
    });
    return;
  }

  loading.value = true;

  try {
    const payload = {
      code: normalizedCode,
      clientId: normalizedClientId,
      quoteId: normalizedQuoteId || undefined,
      salesOrderId: normalizedSalesOrderId || undefined,
      startDate: startDate.value,
      endDate: endDate.value,
      status: normalizedStatus,
      description: normalizedDescription,
      notes: normalizedNotes,
      milestones: normalizedMilestones,
    };

    const created = await ContractsService.create(payload);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("contracts.messages.createSuccess"),
    });

    drawerStore.onSuccess?.(created);
    drawerStore.closeDrawer();
  } catch (error: any) {
    console.error("Create contract error:", error);

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message:
        error?.response?.data?.message ??
        error?.message ??
        t("contracts.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}

watch(description, (value) => {
  if (value.length > 255) {
    description.value = value.slice(0, 255);
  }
});

watch(notes, (value) => {
  if (value.length > 255) {
    notes.value = value.slice(0, 255);
  }
});

watch(startDate, (value) => {
  if (!value) return;

  if (!endDate.value) {
    endDate.value = addDays(value, 30);
  }
});

watch(endDate, (value) => {
  if (!milestones.value.length) return;

  const firstMilestone = milestones.value[0];
  if (!firstMilestone.scheduledDate && value) {
    firstMilestone.scheduledDate = value;
  }
});

onMounted(async () => {
  startDate.value = getLocalDateForInput();
  endDate.value = addDays(startDate.value, 30);

  if (!milestones.value[0].scheduledDate) {
    milestones.value[0].scheduledDate = endDate.value;
  }

  await loadCatalogs();
});
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("contracts.modal.createTitle") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{ $t("contracts.modal.createDescription") }}
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

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="space-y-bt-spacing-24">
      <div
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-bt-spacing-16"
      >
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("contracts.fields.code") }}
          </label>
          <input
            v-model="code"
            type="text"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("contracts.fields.client") }}
          </label>
          <select
            v-model="clientId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("contracts.placeholders.selectClient") }}
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
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("contracts.fields.status") }}
          </label>
          <input
            v-model="status"
            type="text"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("contracts.fields.quoteId") }}
          </label>
          <select
            v-model="quoteId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("contracts.placeholders.selectQuote") }}
            </option>
            <option v-for="quote in quotes" :key="quote.id" :value="quote.id">
              {{ quote.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("contracts.fields.salesOrderId") }}
          </label>
          <select
            v-model="salesOrderId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("contracts.placeholders.selectSalesOrder") }}
            </option>
            <option
              v-for="salesOrder in salesOrders"
              :key="salesOrder.id"
              :value="salesOrder.id"
            >
              {{ salesOrder.label }}
            </option>
          </select>
        </div>

        <div></div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("contracts.fields.startDate") }}
          </label>
          <input
            v-model="startDate"
            type="date"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("contracts.fields.endDate") }}
          </label>
          <input
            v-model="endDate"
            type="date"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div class="md:col-span-2 xl:col-span-3">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("contracts.fields.description") }}
          </label>
          <textarea
            v-model="description"
            rows="3"
            maxlength="255"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
          <p class="text-xs text-bt-grey-500 mt-bt-spacing-4 text-right">
            {{ description.length }}/255
          </p>
        </div>

        <div class="md:col-span-2 xl:col-span-3">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("contracts.fields.notes") }}
          </label>
          <textarea
            v-model="notes"
            rows="3"
            maxlength="255"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
          <p class="text-xs text-bt-grey-500 mt-bt-spacing-4 text-right">
            {{ notes.length }}/255
          </p>
        </div>
      </div>

      <div class="rounded-m border border-bt-grey-200 overflow-hidden">
        <div
          class="flex items-center justify-between px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
        >
          <h3 class="font-bt-semibold text-bt-primary-700">
            {{ $t("contracts.milestones.title") }}
          </h3>

          <button
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
            @click="addMilestone"
          >
            {{ $t("contracts.milestones.actions.add") }}
          </button>
        </div>

        <div class="p-bt-spacing-16 space-y-bt-spacing-12">
          <div
            v-for="(milestone, index) in milestones"
            :key="index"
            class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
          >
            <div
              class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-bt-spacing-12 items-end"
            >
              <div class="xl:col-span-2">
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("contracts.milestones.fields.description") }}
                </label>
                <input
                  v-model="milestone.description"
                  type="text"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>

              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("contracts.milestones.fields.percentage") }}
                </label>
                <input
                  v-model.number="milestone.percentage"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>

              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("contracts.milestones.fields.amount") }}
                </label>
                <div class="flex gap-bt-spacing-8">
                  <input
                    v-model.number="milestone.amount"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                  />
                  <button
                    v-if="milestones.length > 1"
                    type="button"
                    class="px-bt-spacing-12 py-bt-spacing-12 rounded-m bg-bt-error-100 text-bt-error-700 hover:bg-bt-error-300"
                    @click="removeMilestone(index)"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div class="xl:col-span-2">
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("contracts.milestones.fields.scheduledDate") }}
                </label>
                <input
                  v-model="milestone.scheduledDate"
                  type="date"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>
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
</template>
