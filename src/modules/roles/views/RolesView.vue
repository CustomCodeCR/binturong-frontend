<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-vue-next";

import { RolesService } from "@/core/services/rolesService";
import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import RoleCreateModal from "@/modules/roles/components/RoleCreateModal.vue";
import RoleEditModal from "@/modules/roles/components/RoleEditModal.vue";
import RoleDetailsDrawer from "@/modules/roles/components/RoleDetailsDrawer.vue";
import RoleActionMenu from "@/modules/roles/components/RoleActionMenu.vue";

import type { Role } from "@/core/interfaces/roles";
import type { Scope } from "@/core/interfaces/scopes";

interface RoleSuccessPayload {
  roleId: string;
  name: string;
  description: string;
  isActive: boolean;
  scopes: Scope[];
}

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const roles = ref<Role[]>([]);
const loading = ref(false);
const search = ref("");
const page = ref(1);
const pageSize = ref(10);
const statusFilter = ref<"all" | "active" | "inactive">("all");

const MAX_PAGE = 100;

const filteredRoles = computed(() => {
  let result = roles.value;

  if (statusFilter.value === "active") {
    result = result.filter((r) => r.isActive);
  } else if (statusFilter.value === "inactive") {
    result = result.filter((r) => !r.isActive);
  }

  if (search.value.trim()) {
    const query = search.value.toLowerCase().trim();
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query),
    );
  }

  return result;
});

const pageNumbers = computed(() => {
  const current = page.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);

  const pages: number[] = [];
  for (let index = start; index <= end; index += 1) {
    pages.push(index);
  }

  return pages;
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < MAX_PAGE);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeScopeIds(scopes?: Scope[]): string[] {
  return (scopes ?? [])
    .map((scope) => String(scope.scopeId ?? "").trim())
    .filter((scopeId) => scopeId.length > 0)
    .sort();
}

function sameScopes(left?: Scope[], right?: Scope[]): boolean {
  const a = normalizeScopeIds(left);
  const b = normalizeScopeIds(right);

  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

async function fetchRoles(): Promise<Role[]> {
  return await RolesService.browse({
    page: page.value,
    pageSize: pageSize.value,
  });
}

function replaceRoles(nextRoles: Role[]) {
  roles.value = [...nextRoles];
}

async function loadRoles() {
  loading.value = true;

  try {
    replaceRoles(await fetchRoles());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("roles.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function patchRoleInList(payload: RoleSuccessPayload) {
  const existingIndex = roles.value.findIndex(
    (role) => role.roleId === payload.roleId,
  );

  if (existingIndex >= 0) {
    replaceRoles(
      roles.value.map((role) =>
        role.roleId === payload.roleId
          ? {
              ...role,
              roleId: payload.roleId,
              name: payload.name,
              description: payload.description,
              isActive: payload.isActive,
              scopes: payload.scopes,
            }
          : role,
      ),
    );
    return;
  }

  replaceRoles([
    {
      id: `role:${payload.roleId}`,
      roleId: payload.roleId,
      name: payload.name,
      description: payload.description,
      isActive: payload.isActive,
      scopes: payload.scopes,
    },
    ...roles.value,
  ]);
}

function patchRoleStatusInList(roleId: string, isActive: boolean) {
  replaceRoles(
    roles.value.map((role) =>
      role.roleId === roleId
        ? {
            ...role,
            isActive,
          }
        : role,
    ),
  );
}

function hasRoleReachedExpectedState(
  fetchedRoles: Role[],
  expected: RoleSuccessPayload,
): boolean {
  const fetchedRole = fetchedRoles.find(
    (role) => role.roleId === expected.roleId,
  );
  if (!fetchedRole) {
    return false;
  }

  return (
    fetchedRole.name === expected.name &&
    fetchedRole.description === expected.description &&
    fetchedRole.isActive === expected.isActive &&
    sameScopes(fetchedRole.scopes, expected.scopes)
  );
}

async function reloadRolesUntil(
  predicate: (fetchedRoles: Role[]) => boolean,
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
      const fetchedRoles = await fetchRoles();

      if (predicate(fetchedRoles)) {
        replaceRoles(fetchedRoles);
        return;
      }

      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }

    replaceRoles(await fetchRoles());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("roles.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  modalStore.open({
    component: RoleCreateModal,
    onSuccess: async (payload?: RoleSuccessPayload) => {
      if (payload?.roleId) {
        patchRoleInList(payload);
      }

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("roles.messages.createSuccess"),
      });

      if (payload?.roleId) {
        await reloadRolesUntil(
          (fetchedRoles) =>
            fetchedRoles.some((role) => role.roleId === payload.roleId),
          { attempts: 12, delayMs: 500 },
        );
        return;
      }

      await loadRoles();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("roles.messages.createError"),
      });
    },
  });
}

function openEditModal(role: Role) {
  modalStore.open({
    component: RoleEditModal,
    props: {
      roleId: role.roleId,
    },
    onSuccess: async (payload?: RoleSuccessPayload) => {
      if (!payload?.roleId) {
        await loadRoles();
        return;
      }

      patchRoleInList(payload);

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("roles.messages.updateSuccess"),
      });

      await reloadRolesUntil(
        (fetchedRoles) => hasRoleReachedExpectedState(fetchedRoles, payload),
        { attempts: 12, delayMs: 500 },
      );
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("roles.messages.updateError"),
      });
    },
  });
}

function openDetailsDrawer(role: Role) {

  drawerStore.openDrawer({
    component: RoleDetailsDrawer,
    props: {
      roleId: role.roleId,
    },
    title: t("roles.drawer.title"),
    description: t("roles.drawer.description", { role: role.name }),
    direction: "right",
    size: "xl",
  });
}

async function toggleRoleStatus(role: Role) {
  const nextIsActive = !role.isActive;

  try {
    await RolesService.update(role.roleId, {
      name: role.name,
      description: role.description,
      isActive: nextIsActive,
    });

    patchRoleStatusInList(role.roleId, nextIsActive);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: role.isActive
        ? t("roles.messages.deactivateSuccess")
        : t("roles.messages.reactivateSuccess"),
    });

    await reloadRolesUntil(
      (fetchedRoles) => {
        const fetchedRole = fetchedRoles.find(
          (item) => item.roleId === role.roleId,
        );
        return fetchedRole?.isActive === nextIsActive;
      },
      { attempts: 12, delayMs: 500 },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: role.isActive
        ? t("roles.messages.deactivateError")
        : t("roles.messages.reactivateError"),
    });
  }
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) {
    return;
  }

  page.value = targetPage;
  await loadRoles();
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
  await loadRoles();
}

watch(pageSize, async () => {
  page.value = 1;
  await loadRoles();
});

onMounted(async () => {
  await loadRoles();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("roles.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("roles.subtitle") }}
      </p>
    </div>

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <!-- TOOLBAR -->
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <!-- Left: search + filters + secondary actions -->
        <div class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl">
          <input
            v-model="search"
            type="text"
            :placeholder="$t('roles.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="onSearch"
          />

          <select
            v-model="statusFilter"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="all">{{ $t("roles.filters.allStatus") }}</option>
            <option value="active">{{ $t("roles.filters.active") }}</option>
            <option value="inactive">{{ $t("roles.filters.inactive") }}</option>
          </select>

          <!-- Primary query action -->
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="onSearch"
          >
            {{ $t("roles.actions.search") }}
          </button>

          <!-- Secondary: no data impact -->
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadRoles"
          >
            {{ $t("roles.actions.refresh") }}
          </button>
        </div>

        <!-- Right: page size + primary create action -->
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
            {{ $t("roles.actions.newRole") }}
          </button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="flex-1 min-h-0 overflow-auto">
        <div
          v-if="loading"
          class="py-bt-spacing-32 text-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <table v-else class="w-full border-collapse min-w-[700px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("roles.table.name") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("roles.table.description") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("roles.table.scopes") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("roles.table.status") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20">
                {{ $t("roles.table.options") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="role in filteredRoles"
              :key="role.roleId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold">
                {{ role.name }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ role.description }}
              </td>

              <!-- Scopes: simple count, details in drawer -->
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ role.scopes.length }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  :class="[
                    'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                    role.isActive
                      ? 'bg-bt-success-100 text-bt-success-700'
                      : 'bg-bt-error-100 text-bt-error-700',
                  ]"
                >
                  {{
                    role.isActive
                      ? $t("roles.status.active")
                      : $t("roles.status.inactive")
                  }}
                </span>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <RoleActionMenu
                  :items="[
                    {
                      label: t('roles.actions.viewDetails'),
                      action: () => openDetailsDrawer(role),
                    },
                    {
                      label: t('roles.actions.edit'),
                      action: () => openEditModal(role),
                    },
                    {
                      label: role.isActive
                        ? t('roles.actions.deactivate')
                        : t('roles.actions.reactivate'),
                      action: () => toggleRoleStatus(role),
                      danger: role.isActive,
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
                </RoleActionMenu>
              </td>
            </tr>

            <tr v-if="!filteredRoles.length && !loading">
              <td
                colspan="5"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("roles.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0"
      >
        <div class="text-sm text-bt-grey-600">
          {{ $t("pagination.page") }} {{ page }} {{ $t("pagination.of") }}
          {{ MAX_PAGE }}
          <span class="text-bt-grey-500">
            ({{ filteredRoles.length }} {{ $t("roles.filtered") }})
          </span>
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

          <span v-if="pageNumbers[0] > 2" class="px-bt-spacing-8 text-bt-grey-500">
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