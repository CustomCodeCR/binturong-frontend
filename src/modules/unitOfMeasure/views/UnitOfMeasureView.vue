<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-vue-next";

import { UnitsOfMeasureService } from "@/core/services/unitsOfMeasureService";
import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import UnitOfMeasureCreateModal from "@/modules/unitOfMeasure/components/UnitOfMeasureCreateModal.vue";
import UnitOfMeasureEditModal from "@/modules/unitOfMeasure/components/UnitOfMeasureEditModal.vue";
import UnitOfMeasureDetailsDrawer from "@/modules/unitOfMeasure/components/UnitOfMeasureDetailsDrawer.vue";
import UnitOfMeasureActionMenu from "@/modules/unitOfMeasure/components/UnitOfMeasureActionMenu.vue";

import type { UnitOfMeasure } from "@/core/interfaces/unitsOfMeasure";

interface UnitOfMeasureSuccessPayload {
  uomId: string;
  code: string;
  name: string;
  isActive: boolean;
}

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const units = ref<UnitOfMeasure[]>([]);
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

async function fetchUnits(): Promise<UnitOfMeasure[]> {
  return await UnitsOfMeasureService.browse({
    page: page.value,
    pageSize: pageSize.value,
    search: search.value.trim() || undefined,
  });
}

function replaceUnits(nextUnits: UnitOfMeasure[]) {
  units.value = [...nextUnits];
}

async function loadUnits() {
  loading.value = true;

  try {
    replaceUnits(await fetchUnits());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("unitsOfMeasure.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function patchUnitInList(payload: UnitOfMeasureSuccessPayload) {
  const existingIndex = units.value.findIndex(
    (unit) => unit.uomId === payload.uomId,
  );

  if (existingIndex >= 0) {
    replaceUnits(
      units.value.map((unit) =>
        unit.uomId === payload.uomId
          ? {
              ...unit,
              uomId: payload.uomId,
              code: payload.code,
              name: payload.name,
              isActive: payload.isActive,
            }
          : unit,
      ),
    );
    return;
  }

  replaceUnits([
    {
      id: `uom:${payload.uomId}`,
      uomId: payload.uomId,
      code: payload.code,
      name: payload.name,
      isActive: payload.isActive,
    } as UnitOfMeasure,
    ...units.value,
  ]);
}

function patchUnitStatusInList(uomId: string, isActive: boolean) {
  replaceUnits(
    units.value.map((unit) =>
      unit.uomId === uomId
        ? {
            ...unit,
            isActive,
          }
        : unit,
    ),
  );
}

function removeUnitFromList(uomId: string) {
  replaceUnits(units.value.filter((unit) => unit.uomId !== uomId));
}

function hasUnitReachedExpectedState(
  fetchedUnits: UnitOfMeasure[],
  expected: UnitOfMeasureSuccessPayload,
): boolean {
  const fetchedUnit = fetchedUnits.find(
    (unit) => unit.uomId === expected.uomId,
  );
  if (!fetchedUnit) {
    return false;
  }

  return (
    fetchedUnit.code === expected.code &&
    fetchedUnit.name === expected.name &&
    fetchedUnit.isActive === expected.isActive
  );
}

async function reloadUnitsUntil(
  predicate: (fetchedUnits: UnitOfMeasure[]) => boolean,
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
      const fetchedUnits = await fetchUnits();

      if (predicate(fetchedUnits)) {
        replaceUnits(fetchedUnits);
        return;
      }

      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }

    replaceUnits(await fetchUnits());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("unitsOfMeasure.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  modalStore.open({
    component: UnitOfMeasureCreateModal,
    onSuccess: async (payload?: UnitOfMeasureSuccessPayload) => {
      if (payload?.uomId) {
        patchUnitInList(payload);
      }

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("unitsOfMeasure.messages.createSuccess"),
      });

      if (payload?.uomId) {
        await reloadUnitsUntil(
          (fetchedUnits) =>
            fetchedUnits.some((unit) => unit.uomId === payload.uomId),
          {
            attempts: 12,
            delayMs: 500,
          },
        );
        return;
      }

      await loadUnits();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("unitsOfMeasure.messages.createError"),
      });
    },
  });
}

function openEditModal(unit: UnitOfMeasure) {
  modalStore.open({
    component: UnitOfMeasureEditModal,
    props: {
      uomId: unit.uomId,
    },
    onSuccess: async (payload?: UnitOfMeasureSuccessPayload) => {
      if (!payload?.uomId) {
        await loadUnits();
        return;
      }

      patchUnitInList(payload);

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("unitsOfMeasure.messages.updateSuccess"),
      });

      await reloadUnitsUntil(
        (fetchedUnits) => hasUnitReachedExpectedState(fetchedUnits, payload),
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
        message: error?.message ?? t("unitsOfMeasure.messages.updateError"),
      });
    },
  });
}

function openDetailsDrawer(unit: UnitOfMeasure) {
  drawerStore.openDrawer({
    component: UnitOfMeasureDetailsDrawer,
    props: {
      uomId: unit.uomId,
    },
    title: t("unitsOfMeasure.drawer.title"),
    description: t("unitsOfMeasure.drawer.description", { name: unit.name }),
    direction: "right",
    size: "lg",
  });
}

async function toggleUnitStatus(unit: UnitOfMeasure) {
  const nextIsActive = !unit.isActive;

  try {
    await UnitsOfMeasureService.update(unit.uomId, {
      code: unit.code,
      name: unit.name,
      isActive: nextIsActive,
    });

    patchUnitStatusInList(unit.uomId, nextIsActive);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: unit.isActive
        ? t("unitsOfMeasure.messages.deactivateSuccess")
        : t("unitsOfMeasure.messages.reactivateSuccess"),
    });

    await reloadUnitsUntil(
      (fetchedUnits) => {
        const fetchedUnit = fetchedUnits.find(
          (item) => item.uomId === unit.uomId,
        );
        return fetchedUnit?.isActive === nextIsActive;
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
      message: unit.isActive
        ? t("unitsOfMeasure.messages.deactivateError")
        : t("unitsOfMeasure.messages.reactivateError"),
    });
  }
}

async function deleteUnit(unit: UnitOfMeasure) {
  try {
    await UnitsOfMeasureService.delete(unit.uomId);

    removeUnitFromList(unit.uomId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("unitsOfMeasure.messages.deleteSuccess"),
    });

    await reloadUnitsUntil(
      (fetchedUnits) => !fetchedUnits.some((item) => item.uomId === unit.uomId),
      {
        attempts: 12,
        delayMs: 500,
      },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("unitsOfMeasure.messages.deleteError"),
    });
  }
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) {
    return;
  }

  page.value = targetPage;
  await loadUnits();
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
  await loadUnits();
}

watch(pageSize, async () => {
  page.value = 1;
  await loadUnits();
});

onMounted(async () => {
  await loadUnits();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("unitsOfMeasure.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("unitsOfMeasure.subtitle") }}
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
            :placeholder="$t('unitsOfMeasure.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="onSearch"
          />

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="onSearch"
          >
            {{ $t("unitsOfMeasure.actions.search") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadUnits"
          >
            {{ $t("unitsOfMeasure.actions.refresh") }}
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
            {{ $t("unitsOfMeasure.actions.newUnit") }}
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
                {{ $t("unitsOfMeasure.table.code") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("unitsOfMeasure.table.name") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("unitsOfMeasure.table.status") }}
              </th>
              <th
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
              >
                {{ $t("unitsOfMeasure.table.options") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="unit in units"
              :key="unit.uomId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold"
              >
                {{ unit.code }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ unit.name }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  :class="[
                    'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                    unit.isActive
                      ? 'bg-bt-success-100 text-bt-success-700'
                      : 'bg-bt-error-100 text-bt-error-700',
                  ]"
                >
                  {{
                    unit.isActive
                      ? $t("unitsOfMeasure.status.active")
                      : $t("unitsOfMeasure.status.inactive")
                  }}
                </span>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <UnitOfMeasureActionMenu
                  :items="[
                    {
                      label: t('unitsOfMeasure.actions.viewDetails'),
                      action: () => openDetailsDrawer(unit),
                    },
                    {
                      label: t('unitsOfMeasure.actions.edit'),
                      action: () => openEditModal(unit),
                    },
                    {
                      label: unit.isActive
                        ? t('unitsOfMeasure.actions.deactivate')
                        : t('unitsOfMeasure.actions.reactivate'),
                      action: () => toggleUnitStatus(unit),
                      danger: unit.isActive,
                    },
                    {
                      label: t('unitsOfMeasure.actions.delete'),
                      action: () => deleteUnit(unit),
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
                </UnitOfMeasureActionMenu>
              </td>
            </tr>

            <tr v-if="!units.length && !loading">
              <td
                colspan="4"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("unitsOfMeasure.empty") }}
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
