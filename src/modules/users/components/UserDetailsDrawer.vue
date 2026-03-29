<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { AuditService } from "@/core/services/auditService";
import { UsersService } from "@/core/services/usersService";

import type { User } from "@/core/interfaces/users";
import type { AuditLog } from "@/core/interfaces/audit";

const props = defineProps<{
  userId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();

const loadingUser = ref(false);
const loadingAudit = ref(false);
const activeTab = ref<"details" | "audit">("details");

const user = ref<User | null>(null);
const auditEntries = ref<AuditLog[]>([]);

async function loadUser() {
  loadingUser.value = true;
  try {
    user.value = await UsersService.readById(props.userId);
  } finally {
    loadingUser.value = false;
  }
}

async function loadAuditEntries() {
  loadingAudit.value = true;
  try {
    const allEntries = await AuditService.browse({
      module: "Usuarios",
    });

    const numericUserId = Number(props.userId);

    auditEntries.value = allEntries.filter((entry) => {
      return entry.userId === numericUserId || entry.entityId === numericUserId;
    });
  } finally {
    loadingAudit.value = false;
  }
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

function formatJson(value: string | null) {
  if (!value) return t("users.audit.noData");
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

onMounted(async () => {
  await Promise.all([loadUser(), loadAuditEntries()]);
});

watch(
  () => props.userId,
  async () => {
    await Promise.all([loadUser(), loadAuditEntries()]);
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("users.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            $t("users.drawer.description", {
              username: user?.username ?? "",
            })
          }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("users.actions.close") }}
      </button>
    </div>

    <div class="flex gap-bt-spacing-8 mb-bt-spacing-24">
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
        {{ $t("users.drawer.tabs.details") }}
      </button>

      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
        :class="
          activeTab === 'audit'
            ? 'bg-bt-primary-500 text-bt-white'
            : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
        "
        @click="activeTab = 'audit'"
      >
        {{ $t("users.drawer.tabs.audit") }}
      </button>
    </div>

    <!-- DETAILS TAB -->
    <template v-if="activeTab === 'details'">
      <div v-if="loadingUser" class="text-bt-grey-500">
        {{ $t("common.loading") }}
      </div>

      <div v-else-if="user" class="space-y-bt-spacing-16">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
          <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
            <div class="text-xs text-bt-grey-500">{{ $t("users.table.username") }}</div>
            <div class="text-bt-primary-700 font-bt-semibold">{{ user.username }}</div>
          </div>

          <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
            <div class="text-xs text-bt-grey-500">{{ $t("users.table.email") }}</div>
            <div class="text-bt-primary-700 font-bt-semibold">{{ user.email }}</div>
          </div>

          <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
            <div class="text-xs text-bt-grey-500">{{ $t("users.table.status") }}</div>
            <div
              class="font-bt-semibold"
              :class="user.isActive ? 'text-bt-success-700' : 'text-bt-error-700'"
            >
              {{ user.isActive ? $t("users.status.active") : $t("users.status.inactive") }}
            </div>
          </div>

          <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
            <div class="text-xs text-bt-grey-500">{{ $t("users.fields.mustChangePassword") }}</div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ user.mustChangePassword ? $t("common.yes") : $t("common.no") }}
            </div>
          </div>

          <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
            <div class="text-xs text-bt-grey-500">{{ $t("users.fields.failedAttempts") }}</div>
            <div class="text-bt-primary-700 font-bt-semibold">{{ user.failedAttempts }}</div>
          </div>

          <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
            <div class="text-xs text-bt-grey-500">{{ $t("users.fields.lockedUntil") }}</div>
            <div class="text-bt-primary-700 font-bt-semibold">{{ user.lockedUntil ?? "N/A" }}</div>
          </div>

          <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
            <div class="text-xs text-bt-grey-500">{{ $t("users.table.lastLogin") }}</div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ user.lastLogin ?? $t("users.never") }}
            </div>
          </div>

          <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
            <div class="text-xs text-bt-grey-500">{{ $t("users.fields.createdAt") }}</div>
            <div class="text-bt-primary-700 font-bt-semibold">{{ user.createdAt }}</div>
          </div>
        </div>

        <!-- Roles -->
        <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
          <div class="text-xs text-bt-grey-500 mb-bt-spacing-8">
            {{ $t("users.table.roles") }}
          </div>
          <div class="flex flex-wrap gap-bt-spacing-8">
            <span
              v-for="role in user.roles"
              :key="role.roleId"
              class="px-bt-spacing-8 py-bt-spacing-4 rounded-full bg-bt-primary-100 text-bt-primary-700 text-xs"
            >
              {{ role.name }}
            </span>
            <span v-if="!user.roles.length" class="text-sm text-bt-grey-500">-</span>
          </div>
        </div>
      </div>
    </template>

    <!-- AUDIT TAB -->
    <template v-else>
      <div v-if="loadingAudit" class="text-bt-grey-500">
        {{ $t("common.loading") }}
      </div>

      <div v-else class="space-y-bt-spacing-16">
        <div
          v-for="entry in auditEntries"
          :key="entry.id"
          class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
        >
          <div
            class="flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-8 mb-bt-spacing-12"
          >
            <div>
              <div class="text-sm font-bt-semibold text-bt-primary-700">{{ entry.action }}</div>
              <div class="text-xs text-bt-grey-500">{{ entry.eventDate }}</div>
            </div>
            <div class="text-xs text-bt-grey-600">
              {{ $t("users.audit.module") }}: {{ entry.module }} ·
              {{ $t("users.audit.entity") }}: {{ entry.entity }}
            </div>
          </div>

          <div class="grid grid-cols-1 gap-bt-spacing-12">
            <div>
              <div class="text-xs font-bt-semibold text-bt-grey-600 mb-bt-spacing-8">
                {{ $t("users.audit.dataBefore") }}
              </div>
              <pre class="text-xs bg-bt-white border border-bt-grey-200 rounded-m p-bt-spacing-12 overflow-x-auto text-bt-primary-700 whitespace-pre-wrap">{{ formatJson(entry.dataBefore) }}</pre>
            </div>

            <div>
              <div class="text-xs font-bt-semibold text-bt-grey-600 mb-bt-spacing-8">
                {{ $t("users.audit.dataAfter") }}
              </div>
              <pre class="text-xs bg-bt-white border border-bt-grey-200 rounded-m p-bt-spacing-12 overflow-x-auto text-bt-primary-700 whitespace-pre-wrap">{{ formatJson(entry.dataAfter) }}</pre>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-12 text-xs text-bt-grey-600">
              <div>{{ $t("users.audit.ip") }}: {{ entry.ip ?? "N/A" }}</div>
              <div>{{ $t("users.audit.userAgent") }}: {{ entry.userAgent ?? "N/A" }}</div>
            </div>
          </div>
        </div>

        <div
          v-if="!auditEntries.length"
          class="text-center text-bt-grey-500 py-bt-spacing-24"
        >
          {{ $t("users.audit.empty") }}
        </div>
      </div>
    </template>
  </div>
</template>