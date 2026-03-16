<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  Globe,
  LogOut,
  ChevronDown,
  Clock3,
  Wifi,
  WifiOff,
  Building2,
  UserCheck,
  UserX,
} from "lucide-vue-next";

import { useAuthStore } from "@/core/stores/authStore";
import { useToastStore } from "@/core/stores/toastStore";
import { EmployeesService } from "@/core/services/employeesService";

type AttendanceState = "CHECK_IN" | "CHECK_OUT" | null;

const router = useRouter();
const { t, locale } = useI18n();

const authStore = useAuthStore();
const toastStore = useToastStore();

const showLogoutModal = ref(false);
const openUserMenu = ref(false);
const attendanceLoading = ref(false);
const menuRoot = ref<HTMLElement | null>(null);

/**
 * Local reactive attendance state.
 * It updates instantly after check-in / check-out
 * and stays synced with the employee profile history.
 */
const attendanceState = ref<AttendanceState>(null);

const displayName = computed(() => {
  if (authStore.employeeFullName?.trim()) return authStore.employeeFullName;
  if (authStore.username?.trim()) return authStore.username;
  return "User";
});

const displayEmail = computed(() => authStore.email || "-");

const displayBranch = computed(() => {
  return authStore.employeeBranchName || t("topbar.noBranch");
});

const employeeAssignedLabel = computed(() => {
  return authStore.employeeAssigned
    ? t("topbar.employeeAssigned")
    : t("topbar.employeeNotAssigned");
});

const initials = computed(() => {
  const source = displayName.value.trim();
  if (!source) return "U";

  const parts = source.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
});

const canCheckAttendance = computed(() => !!authStore.employeeId);

const sortedHistory = computed(() => {
  if (!authStore.employeeProfile?.history?.length) return [];

  return [...authStore.employeeProfile.history].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );
});

const lastAttendanceEvent = computed(() => {
  return sortedHistory.value.length ? sortedHistory.value[0] : null;
});

/**
 * Sync local state with store history
 */
watch(
  lastAttendanceEvent,
  (event) => {
    attendanceState.value = event?.eventType ?? null;
  },
  { immediate: true },
);

const online = computed(() => attendanceState.value === "CHECK_IN");

const connectionLabel = computed(() =>
  online.value ? t("topbar.online") : t("topbar.offline"),
);

const suggestedAttendanceAction = computed<"check-in" | "check-out">(() => {
  if (!attendanceState.value) return "check-in";

  return attendanceState.value === "CHECK_IN" ? "check-out" : "check-in";
});

function handleOutsideClick(event: MouseEvent) {
  if (!menuRoot.value) return;

  if (!menuRoot.value.contains(event.target as Node)) {
    openUserMenu.value = false;
  }
}

function toggleLanguage() {
  locale.value = locale.value === "es" ? "en" : "es";

  toastStore.addToast({
    severity: "success",
    title: t("toast.success"),
    message: t("topbar.languageChanged"),
  });

  openUserMenu.value = false;
}

async function refreshEmployeeProfile() {
  await authStore.loadEmployeeProfile();
}

async function handleAttendance() {
  const currentEmployeeId = authStore.employeeId;

  if (!currentEmployeeId) {
    toastStore.addToast({
      severity: "warning",
      title: t("toast.warning"),
      message: t("employees.attendance.messages.employeeNotLinked"),
    });
    return;
  }

  attendanceLoading.value = true;

  try {
    if (suggestedAttendanceAction.value === "check-in") {
      await EmployeesService.checkIn(currentEmployeeId);

      /**
       * Update UI immediately
       */
      attendanceState.value = "CHECK_IN";

      /**
       * Optional sync with backend/store
       */
      await refreshEmployeeProfile();

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("employees.attendance.messages.checkInSuccess"),
      });
    } else {
      await EmployeesService.checkOut(currentEmployeeId);

      /**
       * Update UI immediately
       */
      attendanceState.value = "CHECK_OUT";

      /**
       * Optional sync with backend/store
       */
      await refreshEmployeeProfile();

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("employees.attendance.messages.checkOutSuccess"),
      });
    }

    openUserMenu.value = false;
  } catch (error: any) {
    const rawMessage = String(error?.message || "").toLowerCase();

    let message = t("employees.attendance.messages.genericError");

    if (
      rawMessage.includes("entry") ||
      rawMessage.includes("check-in") ||
      rawMessage.includes("entrada")
    ) {
      message = t("employees.attendance.messages.checkInError");
    } else if (
      rawMessage.includes("exit") ||
      rawMessage.includes("check-out") ||
      rawMessage.includes("salida")
    ) {
      message = t("employees.attendance.messages.checkOutError");
    }

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message,
    });
  } finally {
    attendanceLoading.value = false;
  }
}

function askLogout() {
  showLogoutModal.value = true;
  openUserMenu.value = false;
}

function logout() {
  authStore.logout();
  showLogoutModal.value = false;
  router.push("/login");
}

onMounted(async () => {
  document.addEventListener("click", handleOutsideClick);
  await refreshEmployeeProfile();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleOutsideClick);
});
</script>

<template>
  <header
    class="h-20 w-full bg-bt-primary-700 text-bt-white border-b border-bt-primary-600 flex items-center justify-between px-bt-spacing-24 relative"
  >
    <div class="flex items-center gap-bt-spacing-16">
      <h1 class="text-2xl font-bt-bold tracking-wide">
        {{ $t("businessName") }}
      </h1>
    </div>

    <div class="flex items-center gap-bt-spacing-16">
      <div
        class="hidden md:flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-full border border-bt-primary-400 bg-bt-primary-600"
      >
        <component
          :is="online ? Wifi : WifiOff"
          :size="16"
          :class="online ? 'text-bt-success-300' : 'text-bt-error-300'"
        />
        <span class="text-sm text-bt-grey-100">
          {{ connectionLabel }}
        </span>
      </div>

      <div ref="menuRoot" class="relative">
        <button
          type="button"
          class="flex items-center gap-bt-spacing-12 px-bt-spacing-12 py-bt-spacing-8 rounded-m hover:bg-bt-primary-600 transition"
          @click="openUserMenu = !openUserMenu"
        >
          <div class="text-right hidden sm:block leading-tight">
            <p class="text-sm font-bt-semibold text-bt-white">
              {{ displayName }}
            </p>
            <p class="text-xs text-bt-grey-300">
              {{ displayEmail }}
            </p>
          </div>

          <div
            class="w-10 h-10 rounded-full bg-bt-primary-500 border border-bt-primary-400 flex items-center justify-center font-bt-bold text-bt-white"
          >
            {{ initials }}
          </div>

          <ChevronDown :size="18" class="text-bt-grey-200" />
        </button>

        <div
          v-if="openUserMenu"
          class="absolute right-0 mt-bt-spacing-8 w-[340px] bg-bt-white rounded-l shadow-bt-elevation-400 border border-bt-grey-200 z-50 overflow-hidden"
        >
          <div
            class="p-bt-spacing-16 border-b border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="flex items-start gap-bt-spacing-12">
              <div
                class="w-12 h-12 rounded-full bg-bt-primary-500 text-bt-white flex items-center justify-center font-bt-bold shrink-0"
              >
                {{ initials }}
              </div>

              <div class="min-w-0">
                <p class="font-bt-semibold text-bt-primary-700">
                  {{ displayName }}
                </p>

                <p class="text-sm text-bt-grey-600 break-all">
                  {{ displayEmail }}
                </p>

                <div
                  class="mt-bt-spacing-8 flex items-center gap-bt-spacing-8 text-sm"
                >
                  <component
                    :is="authStore.employeeAssigned ? UserCheck : UserX"
                    :size="15"
                    :class="
                      authStore.employeeAssigned
                        ? 'text-bt-success-600'
                        : 'text-bt-warning-600'
                    "
                  />
                  <span
                    :class="
                      authStore.employeeAssigned
                        ? 'text-bt-success-700'
                        : 'text-bt-warning-700'
                    "
                  >
                    {{ employeeAssignedLabel }}
                  </span>
                </div>

                <div
                  class="mt-bt-spacing-8 flex items-center gap-bt-spacing-8 text-sm text-bt-grey-600"
                >
                  <Building2 :size="15" />
                  <span>
                    {{ displayBranch }}
                  </span>
                </div>

                <div
                  class="mt-bt-spacing-8 flex items-center gap-bt-spacing-8 text-sm"
                >
                  <component
                    :is="online ? Wifi : WifiOff"
                    :size="15"
                    :class="
                      online ? 'text-bt-success-500' : 'text-bt-error-500'
                    "
                  />
                  <span
                    :class="
                      online ? 'text-bt-success-700' : 'text-bt-error-700'
                    "
                  >
                    {{ connectionLabel }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="p-bt-spacing-8">
            <button
              type="button"
              class="w-full flex items-center gap-bt-spacing-12 px-bt-spacing-16 py-bt-spacing-12 rounded-m text-bt-primary-700 hover:bg-bt-grey-100 transition"
              @click="toggleLanguage"
            >
              <Globe :size="18" />
              <div class="text-left">
                <div class="font-bt-medium">{{ $t("topbar.language") }}</div>
                <div class="text-xs text-bt-grey-500">
                  {{ locale === "es" ? "Español" : "English" }}
                </div>
              </div>
            </button>

            <button
              type="button"
              class="w-full flex items-center gap-bt-spacing-12 px-bt-spacing-16 py-bt-spacing-12 rounded-m text-bt-primary-700 hover:bg-bt-grey-100 transition disabled:opacity-60"
              :disabled="attendanceLoading || !canCheckAttendance"
              @click="handleAttendance"
            >
              <Clock3 :size="18" />
              <div class="text-left">
                <div class="font-bt-medium">
                  {{
                    suggestedAttendanceAction === "check-in"
                      ? $t("employees.attendance.actions.checkIn")
                      : $t("employees.attendance.actions.checkOut")
                  }}
                </div>
                <div class="text-xs text-bt-grey-500">
                  {{
                    canCheckAttendance
                      ? $t("employees.attendance.messages.available")
                      : $t("employees.attendance.messages.employeeNotLinked")
                  }}
                </div>
              </div>
            </button>

            <button
              type="button"
              class="w-full flex items-center gap-bt-spacing-12 px-bt-spacing-16 py-bt-spacing-12 rounded-m text-bt-error-700 hover:bg-bt-error-100 transition"
              @click="askLogout"
            >
              <LogOut :size="18" />
              <div class="text-left font-bt-medium">
                {{ $t("logout") }}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <div
    v-if="showLogoutModal"
    class="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]"
  >
    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-400 p-bt-spacing-24 w-full max-w-md border border-bt-grey-200"
    >
      <h3 class="text-lg font-bt-semibold mb-bt-spacing-8 text-bt-primary-700">
        {{ $t("logout") }}
      </h3>

      <p class="text-sm text-bt-grey-600 mb-bt-spacing-24">
        {{ $t("logoutConfirm") }}
      </p>

      <div class="flex justify-end gap-bt-spacing-12">
        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
          @click="showLogoutModal = false"
        >
          {{ $t("common.cancel") }}
        </button>

        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-error-500 text-bt-white hover:bg-bt-error-700"
          @click="logout"
        >
          {{ $t("logout") }}
        </button>
      </div>
    </div>
  </div>
</template>
