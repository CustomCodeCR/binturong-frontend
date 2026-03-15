<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { RolesService } from "@/core/services/rolesService";
import { AuditService } from "@/core/services/auditService";

import type { Role } from "@/core/interfaces/roles";
import type { AuditLog } from "@/core/interfaces/audit";

const props = defineProps<{
  roleId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();

const loadingRole = ref(false);
const loadingAudit = ref(false);
const activeTab = ref<"details" | "audit">("details");

const role = ref<Role | null>(null);
const auditEntries = ref<AuditLog[]>([]);

async function loadRole() {
  loadingRole.value = true;
  try {
    role.value = await RolesService.readById(props.roleId);
  } finally {
    loadingRole.value = false;
  }
}

async function loadAuditEntries() {
  loadingAudit.value = true;
  try {
    const allEntries = await AuditService.browse({
      module: "Roles",
    });

    const numericRoleId = Number(props.roleId);

    auditEntries.value = allEntries.filter((entry) => {
      return entry.entityId === numericRoleId;
    });
  } finally {
    loadingAudit.value = false;
  }
}

async function exportPdf() {
  const blob = await AuditService.exportPdf({
    module: "Roles",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `roles-audit-${props.roleId}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

async function exportExcel() {
  const blob = await AuditService.exportExcel({
    module: "Roles",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `roles-audit-${props.roleId}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

function formatJson(value: string | null) {
  if (!value) return t("roles.audit.noData");

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

onMounted(async () => {
  await Promise.all([loadRole(), loadAuditEntries()]);
});

watch(
  () => props.roleId,
  async () => {
    await Promise.all([loadRole(), loadAuditEntries()]);
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("roles.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            $t("roles.drawer.description", {
              role: role?.name ?? "",
            })
          }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("roles.actions.close") }}
      </button>
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
        {{ $t("roles.drawer.tabs.details") }}
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
        {{ $t("roles.drawer.tabs.audit") }}
      </button>

      <div v-if="activeTab === 'audit'" class="flex gap-bt-spacing-8 ml-auto">
        <button
          type="button"
          class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-info-100 text-bt-info-700 hover:bg-bt-info-300"
          @click="exportPdf"
        >
          {{ $t("roles.actions.exportPdf") }}
        </button>

        <button
          type="button"
          class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-success-100 text-bt-success-700 hover:bg-bt-success-300"
          @click="exportExcel"
        >
          {{ $t("roles.actions.exportExcel") }}
        </button>
      </div>
    </div>

    <template v-if="activeTab === 'details'">
      <div v-if="loadingRole" class="text-bt-grey-500">
        {{ $t("common.loading") }}
      </div>

      <div v-else-if="role" class="space-y-bt-spacing-16">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("roles.table.name") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ role.name }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("roles.table.status") }}
            </div>
            <div
              class="font-bt-semibold"
              :class="
                role.isActive ? 'text-bt-success-700' : 'text-bt-error-700'
              "
            >
              {{
                role.isActive
                  ? $t("roles.status.active")
                  : $t("roles.status.inactive")
              }}
            </div>
          </div>

          <div
            class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("roles.table.description") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ role.description }}
            </div>
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500 mb-bt-spacing-8">
            {{ $t("roles.fields.scopes") }}
          </div>
          <div class="flex flex-wrap gap-bt-spacing-8">
            <span
              v-for="scope in role.scopes"
              :key="scope.scopeId"
              class="px-bt-spacing-8 py-bt-spacing-4 rounded-full bg-bt-primary-100 text-bt-primary-700 text-xs"
            >
              {{ scope.code }}
            </span>
          </div>
        </div>
      </div>
    </template>

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
              <div class="text-sm font-bt-semibold text-bt-primary-700">
                {{ entry.action }}
              </div>
              <div class="text-xs text-bt-grey-500">
                {{ entry.eventDate }}
              </div>
            </div>

            <div class="text-xs text-bt-grey-600">
              {{ $t("roles.audit.module") }}: {{ entry.module }} ·
              {{ $t("roles.audit.entity") }}: {{ entry.entity }}
            </div>
          </div>

          <div class="grid grid-cols-1 gap-bt-spacing-12">
            <div>
              <div
                class="text-xs font-bt-semibold text-bt-grey-600 mb-bt-spacing-8"
              >
                {{ $t("roles.audit.dataBefore") }}
              </div>
              <pre
                class="text-xs bg-bt-white border border-bt-grey-200 rounded-m p-bt-spacing-12 overflow-x-auto text-bt-primary-700 whitespace-pre-wrap"
                >{{ formatJson(entry.dataBefore) }}</pre
              >
            </div>

            <div>
              <div
                class="text-xs font-bt-semibold text-bt-grey-600 mb-bt-spacing-8"
              >
                {{ $t("roles.audit.dataAfter") }}
              </div>
              <pre
                class="text-xs bg-bt-white border border-bt-grey-200 rounded-m p-bt-spacing-12 overflow-x-auto text-bt-primary-700 whitespace-pre-wrap"
                >{{ formatJson(entry.dataAfter) }}</pre
              >
            </div>

            <div
              class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-12 text-xs text-bt-grey-600"
            >
              <div>{{ $t("roles.audit.ip") }}: {{ entry.ip ?? "N/A" }}</div>
              <div>
                {{ $t("roles.audit.userAgent") }}:
                {{ entry.userAgent ?? "N/A" }}
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="!auditEntries.length"
          class="text-center text-bt-grey-500 py-bt-spacing-24"
        >
          {{ $t("roles.audit.empty") }}
        </div>
      </div>
    </template>
  </div>
</template>
