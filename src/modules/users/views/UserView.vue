<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-vue-next";

import { UsersService } from "@/core/services/usersService";
import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import UserCreateModal from "@/modules/users/components/UserCreateModal.vue";
import UserEditModal from "@/modules/users/components/UserEditModal.vue";
import UserDetailsDrawer from "@/modules/users/components/UserDetailsDrawer.vue";
import UserActionMenu from "@/modules/users/components/UserActionMenu.vue";

import type { User } from "@/core/interfaces/users";

interface UserEditSuccessPayload {
  userId: string;
  username: string;
  email: string;
  isActive: boolean;
  lastLogin: string | null;
  mustChangePassword: boolean;
  failedAttempts: number;
  lockedUntil: string | null;
  roles: Array<{
    roleId: string;
    name: string;
  }>;
}

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const users = ref<User[]>([]);
const loading = ref(false);
const search = ref("");
const page = ref(1);
const pageSize = ref(10);

// ← NUEVO: Filtro de estado
const statusFilter = ref<"all" | "active" | "inactive">("all");

const MAX_PAGE = 100;

// ← NUEVO: Usuarios filtrados localmente
const filteredUsers = computed(() => {
  let result = users.value;

  // Filtrar por estado
  if (statusFilter.value === "active") {
    result = result.filter((u) => u.isActive);
  } else if (statusFilter.value === "inactive") {
    result = result.filter((u) => !u.isActive);
  }

  // Filtrar por búsqueda (en tiempo real)
  if (search.value.trim()) {
    const query = search.value.toLowerCase().trim();
    result = result.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query),
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

function normalizeRoleIds(
  roles?: Array<{ roleId: string; name: string }>,
): string[] {
  return (roles ?? [])
    .map((role) => String(role.roleId ?? "").trim())
    .filter((roleId) => roleId.length > 0)
    .sort();
}

function sameRoles(
  left?: Array<{ roleId: string; name: string }>,
  right?: Array<{ roleId: string; name: string }>,
): boolean {
  const a = normalizeRoleIds(left);
  const b = normalizeRoleIds(right);

  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

function sameNullableDate(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  return String(left ?? "") === String(right ?? "");
}

async function fetchUsers(): Promise<User[]> {
  return await UsersService.browse({
    page: page.value,
    pageSize: pageSize.value,
    // ← REMOVIDO: search del backend, ahora filtramos localmente
    // search: search.value.trim() || undefined,
  });
}

async function loadUsers() {
  loading.value = true;

  try {
    users.value = await fetchUsers();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("users.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function replaceUsers(nextUsers: User[]) {
  users.value = [...nextUsers];
}

function patchUserInList(payload: UserEditSuccessPayload) {
  replaceUsers(
    users.value.map((user) =>
      user.userId === payload.userId
        ? {
            ...user,
            userId: payload.userId,
            username: payload.username,
            email: payload.email,
            isActive: payload.isActive,
            lastLogin: payload.lastLogin,
            mustChangePassword: payload.mustChangePassword,
            failedAttempts: payload.failedAttempts,
            lockedUntil: payload.lockedUntil,
            roles: payload.roles,
          }
        : user,
    ),
  );
}

function patchUserStatusInList(userId: string, isActive: boolean) {
  replaceUsers(
    users.value.map((user) =>
      user.userId === userId
        ? {
            ...user,
            isActive,
          }
        : user,
    ),
  );
}

function hasUserReachedExpectedState(
  fetchedUsers: User[],
  expected: UserEditSuccessPayload,
): boolean {
  const fetchedUser = fetchedUsers.find(
    (user) => user.userId === expected.userId,
  );
  if (!fetchedUser) {
    return false;
  }

  return (
    fetchedUser.username === expected.username &&
    fetchedUser.email === expected.email &&
    fetchedUser.isActive === expected.isActive &&
    fetchedUser.mustChangePassword === expected.mustChangePassword &&
    fetchedUser.failedAttempts === expected.failedAttempts &&
    sameNullableDate(fetchedUser.lastLogin, expected.lastLogin) &&
    sameNullableDate(fetchedUser.lockedUntil, expected.lockedUntil) &&
    sameRoles(fetchedUser.roles, expected.roles)
  );
}

async function reloadUsersUntil(
  predicate: (fetchedUsers: User[]) => boolean,
  options?: {
    attempts?: number;
    delayMs?: number;
  },
) {
  const attempts = options?.attempts ?? 10;
  const delayMs = options?.delayMs ?? 500;

  loading.value = true;

  try {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const fetchedUsers = await fetchUsers();

      if (predicate(fetchedUsers)) {
        replaceUsers(fetchedUsers);
        return;
      }

      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }

    replaceUsers(await fetchUsers());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("users.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  modalStore.open({
    component: UserCreateModal,
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("users.messages.createSuccess"),
      });

      await loadUsers();
      await reloadUsersUntil(
        (fetchedUsers) => fetchedUsers.length >= users.value.length,
        {
          attempts: 10,
          delayMs: 500,
        },
      );
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("users.messages.createError"),
      });
    },
  });
}

function openEditModal(user: User) {
  modalStore.open({
    component: UserEditModal,
    props: {
      userId: user.userId,
    },
    onSuccess: async (payload?: UserEditSuccessPayload) => {
      if (!payload?.userId) {
        await loadUsers();
        return;
      }

      patchUserInList(payload);

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("users.messages.updateSuccess"),
      });

      await reloadUsersUntil(
        (fetchedUsers) => hasUserReachedExpectedState(fetchedUsers, payload),
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
        message: error?.message ?? t("users.messages.updateError"),
      });
    },
  });
}

function openDetailsDrawer(user: User) {
  drawerStore.openDrawer({
    component: UserDetailsDrawer,
    props: {
      userId: user.userId,
    },
    title: t("users.drawer.title"),
    description: t("users.drawer.description", { username: user.username }),
    direction: "right",
    size: "xl",
  });
}

async function toggleUserStatus(user: User) {
  const nextIsActive = !user.isActive;

  try {
    await UsersService.update(user.userId, {
      username: user.username,
      email: user.email,
      isActive: nextIsActive,
      lastLogin: user.lastLogin,
      mustChangePassword: user.mustChangePassword,
      failedAttempts: user.failedAttempts,
      lockedUntil: user.lockedUntil,
    });

    patchUserStatusInList(user.userId, nextIsActive);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: user.isActive
        ? t("users.messages.deactivateSuccess")
        : t("users.messages.reactivateSuccess"),
    });

    await reloadUsersUntil(
      (fetchedUsers) => {
        const fetchedUser = fetchedUsers.find(
          (item) => item.userId === user.userId,
        );
        return fetchedUser?.isActive === nextIsActive;
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
      message: user.isActive
        ? t("users.messages.deactivateError")
        : t("users.messages.reactivateError"),
    });
  }
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) {
    return;
  }

  page.value = targetPage;
  await loadUsers();
}

async function goPrevious() {
  if (!canGoPrevious.value) {
    return;
  }

  await goToPage(page.value - 1);
}

async function goNext() {
  if (!canGoNext.value) {
    return;
  }

  await goToPage(page.value + 1);
}

//onSearch ya no es necesario porque se filtra  en tiempo real

watch(pageSize, async () => {
  page.value = 1;
  await loadUsers();
});

onMounted(async () => {
  await loadUsers();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("users.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("users.subtitle") }}
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
          <!-- ← MEJORADO: Search en tiempo real -->
          <input
            v-model="search"
            type="text"
            :placeholder="$t('users.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />

          <!-- ← NUEVO: Filtro de estado -->
          <!-- ← Filtro de estado -->
          <select
            v-model="statusFilter"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="all">{{ $t("users.filters.allStatus") }}</option>
            <option value="active">{{ $t("users.filters.active") }}</option>
            <option value="inactive">{{ $t("users.filters.inactive") }}</option>
          </select>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadUsers"
          >
            {{ $t("users.actions.refresh") }}
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
            {{ $t("users.actions.newUser") }}
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
                {{ $t("users.table.username") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("users.table.email") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("users.table.status") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("users.table.roles") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("users.table.lastLogin") }}
              </th>
              <th
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
              >
                {{ $t("users.table.options") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- ← CAMBIADO: Usar filteredUsers en lugar de users -->
            <tr
              v-for="user in filteredUsers"
              :key="user.userId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ user.username }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ user.email }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  :class="[
                    'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                    user.isActive
                      ? 'bg-bt-success-100 text-bt-success-700'
                      : 'bg-bt-error-100 text-bt-error-700',
                  ]"
                >
                  {{
                    user.isActive
                      ? $t("users.status.active")
                      : $t("users.status.inactive")
                  }}
                </span>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                <div class="flex flex-wrap gap-bt-spacing-8">
                  <span
                    v-for="role in user.roles"
                    :key="role.roleId"
                    class="px-bt-spacing-8 py-bt-spacing-4 rounded-full bg-bt-primary-100 text-bt-primary-700 text-xs"
                  >
                    {{ role.name }}
                  </span>
                </div>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ user.lastLogin ?? $t("users.never") }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <UserActionMenu
                  :items="[
                    {
                      label: t('users.actions.viewDetails'),
                      action: () => openDetailsDrawer(user),
                    },
                    {
                      label: t('users.actions.edit'),
                      action: () => openEditModal(user),
                    },
                    {
                      label: user.isActive
                        ? t('users.actions.deactivate')
                        : t('users.actions.reactivate'),
                      action: () => toggleUserStatus(user),
                      danger: user.isActive,
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
                </UserActionMenu>
              </td>
            </tr>

            <!-- ← CAMBIADO: Usar filteredUsers.length -->
            <tr v-if="!filteredUsers.length && !loading">
              <td
                colspan="6"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("users.empty") }}
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
          <!-- ← NUEVO: Mostrar cantidad filtrada -->
          <span class="text-bt-grey-500">
            ({{ filteredUsers.length }} {{ $t("users.filtered") }})
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
