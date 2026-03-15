<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-vue-next";

import { PaymentMethodsService } from "@/core/services/paymentMethodsService";
import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import PaymentMethodCreateModal from "@/modules/paymentMethods/components/PaymentMethodCreateModal.vue";
import PaymentMethodEditModal from "@/modules/paymentMethods/components/PaymentMethodEditModal.vue";
import PaymentMethodDetailsDrawer from "@/modules/paymentMethods/components/PaymentMethodDetailsDrawer.vue";
import PaymentMethodActionMenu from "@/modules/paymentMethods/components/PaymentMethodActionMenu.vue";

import type { PaymentMethod } from "@/core/interfaces/paymentMethods";

interface PaymentMethodSuccessPayload {
  paymentMethodId: string;
  code: string;
  description: string;
  isActive: boolean;
  updatedAt?: string | null;
}

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const paymentMethods = ref<PaymentMethod[]>([]);
const loading = ref(false);
const search = ref("");
const page = ref(1);
const pageSize = ref(10);

const MAX_PAGE = 100;

const pageNumbers = computed(() => {
  const current = page.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);

  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  return pages;
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < MAX_PAGE);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  return await PaymentMethodsService.browse({
    page: page.value,
    pageSize: pageSize.value,
    search: search.value.trim() || undefined,
  });
}

function replacePaymentMethods(nextPaymentMethods: PaymentMethod[]) {
  paymentMethods.value = [...nextPaymentMethods];
}

async function loadPaymentMethods() {
  loading.value = true;

  try {
    replacePaymentMethods(await fetchPaymentMethods());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("paymentMethods.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function patchPaymentMethodInList(payload: PaymentMethodSuccessPayload) {
  const existingIndex = paymentMethods.value.findIndex(
    (paymentMethod) =>
      paymentMethod.paymentMethodId === payload.paymentMethodId,
  );

  if (existingIndex >= 0) {
    replacePaymentMethods(
      paymentMethods.value.map((paymentMethod) =>
        paymentMethod.paymentMethodId === payload.paymentMethodId
          ? {
              ...paymentMethod,
              paymentMethodId: payload.paymentMethodId,
              code: payload.code,
              description: payload.description,
              isActive: payload.isActive,
              updatedAt: payload.updatedAt ?? paymentMethod.updatedAt,
            }
          : paymentMethod,
      ),
    );
    return;
  }

  replacePaymentMethods([
    {
      id: `payment-method:${payload.paymentMethodId}`,
      paymentMethodId: payload.paymentMethodId,
      code: payload.code,
      description: payload.description,
      isActive: payload.isActive,
      updatedAt: payload.updatedAt ?? null,
    } as PaymentMethod,
    ...paymentMethods.value,
  ]);
}

function patchPaymentMethodStatusInList(
  paymentMethodId: string,
  isActive: boolean,
) {
  replacePaymentMethods(
    paymentMethods.value.map((paymentMethod) =>
      paymentMethod.paymentMethodId === paymentMethodId
        ? {
            ...paymentMethod,
            isActive,
          }
        : paymentMethod,
    ),
  );
}

function removePaymentMethodFromList(paymentMethodId: string) {
  replacePaymentMethods(
    paymentMethods.value.filter(
      (paymentMethod) => paymentMethod.paymentMethodId !== paymentMethodId,
    ),
  );
}

function hasPaymentMethodReachedExpectedState(
  fetchedPaymentMethods: PaymentMethod[],
  expected: PaymentMethodSuccessPayload,
): boolean {
  const fetchedPaymentMethod = fetchedPaymentMethods.find(
    (paymentMethod) =>
      paymentMethod.paymentMethodId === expected.paymentMethodId,
  );

  if (!fetchedPaymentMethod) {
    return false;
  }

  return (
    fetchedPaymentMethod.code === expected.code &&
    fetchedPaymentMethod.description === expected.description &&
    fetchedPaymentMethod.isActive === expected.isActive
  );
}

async function reloadPaymentMethodsUntil(
  predicate: (fetchedPaymentMethods: PaymentMethod[]) => boolean,
  options?: {
    attempts?: number;
    delayMs?: number;
  },
) {
  const attempts = options?.attempts ?? 12;
  const delayMs = options?.delayMs ?? 500;

  loading.value = true;

  try {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const fetchedPaymentMethods = await fetchPaymentMethods();

      if (predicate(fetchedPaymentMethods)) {
        replacePaymentMethods(fetchedPaymentMethods);
        return;
      }

      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }

    replacePaymentMethods(await fetchPaymentMethods());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("paymentMethods.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  modalStore.open({
    component: PaymentMethodCreateModal,
    onSuccess: async (payload?: PaymentMethodSuccessPayload) => {
      if (payload?.paymentMethodId) {
        patchPaymentMethodInList(payload);
      }

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("paymentMethods.messages.createSuccess"),
      });

      if (payload?.paymentMethodId) {
        await reloadPaymentMethodsUntil(
          (fetchedPaymentMethods) =>
            fetchedPaymentMethods.some(
              (paymentMethod) =>
                paymentMethod.paymentMethodId === payload.paymentMethodId,
            ),
          {
            attempts: 12,
            delayMs: 500,
          },
        );
        return;
      }

      await loadPaymentMethods();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("paymentMethods.messages.createError"),
      });
    },
  });
}

function openEditModal(paymentMethod: PaymentMethod) {
  modalStore.open({
    component: PaymentMethodEditModal,
    props: {
      paymentMethodId: paymentMethod.paymentMethodId,
    },
    onSuccess: async (payload?: PaymentMethodSuccessPayload) => {
      if (!payload?.paymentMethodId) {
        await loadPaymentMethods();
        return;
      }

      patchPaymentMethodInList(payload);

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("paymentMethods.messages.updateSuccess"),
      });

      await reloadPaymentMethodsUntil(
        (fetchedPaymentMethods) =>
          hasPaymentMethodReachedExpectedState(fetchedPaymentMethods, payload),
        {
          attempts: 12,
          delayMs: 500,
        },
      );
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("paymentMethods.messages.updateError"),
      });
    },
  });
}

function openDetailsDrawer(paymentMethod: PaymentMethod) {
  drawerStore.openDrawer({
    component: PaymentMethodDetailsDrawer,
    props: {
      paymentMethodId: paymentMethod.paymentMethodId,
    },
    title: t("paymentMethods.drawer.title"),
    description: t("paymentMethods.drawer.description", {
      description: paymentMethod.description,
    }),
    direction: "right",
    size: "lg",
  });
}

async function togglePaymentMethodStatus(paymentMethod: PaymentMethod) {
  const nextIsActive = !paymentMethod.isActive;

  try {
    await PaymentMethodsService.update(paymentMethod.paymentMethodId, {
      code: paymentMethod.code,
      description: paymentMethod.description,
      isActive: nextIsActive,
    });

    patchPaymentMethodStatusInList(paymentMethod.paymentMethodId, nextIsActive);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: paymentMethod.isActive
        ? t("paymentMethods.messages.deactivateSuccess")
        : t("paymentMethods.messages.reactivateSuccess"),
    });

    await reloadPaymentMethodsUntil(
      (fetchedPaymentMethods) => {
        const fetchedPaymentMethod = fetchedPaymentMethods.find(
          (item) => item.paymentMethodId === paymentMethod.paymentMethodId,
        );
        return fetchedPaymentMethod?.isActive === nextIsActive;
      },
      {
        attempts: 12,
        delayMs: 500,
      },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: paymentMethod.isActive
        ? t("paymentMethods.messages.deactivateError")
        : t("paymentMethods.messages.reactivateError"),
    });
  }
}

async function deletePaymentMethod(paymentMethod: PaymentMethod) {
  try {
    await PaymentMethodsService.delete(paymentMethod.paymentMethodId);

    removePaymentMethodFromList(paymentMethod.paymentMethodId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("paymentMethods.messages.deleteSuccess"),
    });

    await reloadPaymentMethodsUntil(
      (fetchedPaymentMethods) =>
        !fetchedPaymentMethods.some(
          (item) => item.paymentMethodId === paymentMethod.paymentMethodId,
        ),
      {
        attempts: 12,
        delayMs: 500,
      },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("paymentMethods.messages.deleteError"),
    });
  }
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) {
    return;
  }

  page.value = targetPage;
  await loadPaymentMethods();
}

async function goPrevious() {
  if (!canGoPrevious.value) return;
  await goToPage(page.value - 1);
}

async function goNext() {
  if (!canGoNext.value) return;
  await goToPage(page.value + 1);
}

async function onSearch() {
  page.value = 1;
  await loadPaymentMethods();
}

watch(pageSize, async () => {
  page.value = 1;
  await loadPaymentMethods();
});

onMounted(async () => {
  await loadPaymentMethods();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("paymentMethods.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("paymentMethods.subtitle") }}
      </p>
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
            :placeholder="$t('paymentMethods.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="onSearch"
          />

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="onSearch"
          >
            {{ $t("paymentMethods.actions.search") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadPaymentMethods"
          >
            {{ $t("paymentMethods.actions.refresh") }}
          </button>
        </div>

        <div class="flex items-center gap-bt-spacing-12 shrink-0">
          <select
            v-model.number="pageSize"
            class="px-bt-spacing-12 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 transition font-bt-semibold"
            @click="openCreateModal"
          >
            {{ $t("paymentMethods.actions.newPaymentMethod") }}
          </button>
        </div>
      </div>

      <div class="flex-1 min-h-0 overflow-auto">
        <div
          v-if="loading"
          class="py-bt-spacing-32 text-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <table v-else class="w-full border-collapse min-w-[900px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("paymentMethods.table.code") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("paymentMethods.table.description") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("paymentMethods.table.status") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("paymentMethods.table.updatedAt") }}
              </th>
              <th
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
              >
                {{ $t("paymentMethods.table.options") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="paymentMethod in paymentMethods"
              :key="paymentMethod.paymentMethodId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold"
              >
                {{ paymentMethod.code }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ paymentMethod.description }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  :class="[
                    'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                    paymentMethod.isActive
                      ? 'bg-bt-success-100 text-bt-success-700'
                      : 'bg-bt-error-100 text-bt-error-700',
                  ]"
                >
                  {{
                    paymentMethod.isActive
                      ? $t("paymentMethods.status.active")
                      : $t("paymentMethods.status.inactive")
                  }}
                </span>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ paymentMethod.updatedAt }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <PaymentMethodActionMenu
                  :items="[
                    {
                      label: t('paymentMethods.actions.viewDetails'),
                      action: () => openDetailsDrawer(paymentMethod),
                    },
                    {
                      label: t('paymentMethods.actions.edit'),
                      action: () => openEditModal(paymentMethod),
                    },
                    {
                      label: paymentMethod.isActive
                        ? t('paymentMethods.actions.deactivate')
                        : t('paymentMethods.actions.reactivate'),
                      action: () => togglePaymentMethodStatus(paymentMethod),
                      danger: paymentMethod.isActive,
                    },
                    {
                      label: t('paymentMethods.actions.delete'),
                      action: () => deletePaymentMethod(paymentMethod),
                      danger: true,
                    },
                  ]"
                >
                  <template #trigger>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center w-10 h-10 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 transition"
                    >
                      <MoreHorizontal :size="18" />
                    </button>
                  </template>
                </PaymentMethodActionMenu>
              </td>
            </tr>

            <tr v-if="!paymentMethods.length && !loading">
              <td
                colspan="5"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("paymentMethods.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0"
      >
        <div class="text-sm text-bt-grey-600">
          {{ $t("pagination.page") }} {{ page }} {{ $t("pagination.of") }}
          {{ MAX_PAGE }}
        </div>

        <div class="flex items-center gap-bt-spacing-8 flex-wrap">
          <button
            type="button"
            :disabled="!canGoPrevious"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
            @click="goPrevious"
          >
            <ChevronLeft :size="16" />
            <span>{{ $t("pagination.previous") }}</span>
          </button>

          <button
            v-if="pageNumbers[0] > 1"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
            @click="goToPage(1)"
          >
            1
          </button>

          <span
            v-if="pageNumbers[0] > 2"
            class="px-bt-spacing-8 text-bt-grey-500"
          >
            ...
          </span>

          <button
            v-for="pageNumber in pageNumbers"
            :key="pageNumber"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border transition"
            :class="
              pageNumber === page
                ? 'bg-bt-primary-500 border-bt-primary-500 text-bt-white'
                : 'border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100'
            "
            @click="goToPage(pageNumber)"
          >
            {{ pageNumber }}
          </button>

          <span
            v-if="pageNumbers[pageNumbers.length - 1] < MAX_PAGE - 1"
            class="px-bt-spacing-8 text-bt-grey-500"
          >
            ...
          </span>

          <button
            v-if="pageNumbers[pageNumbers.length - 1] < MAX_PAGE"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
            @click="goToPage(MAX_PAGE)"
          >
            {{ MAX_PAGE }}
          </button>

          <button
            type="button"
            :disabled="!canGoNext"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
            @click="goNext"
          >
            <span>{{ $t("pagination.next") }}</span>
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
