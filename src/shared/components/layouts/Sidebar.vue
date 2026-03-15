<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { LogOut, ChevronDown } from "lucide-vue-next";

import { useSidebarItems } from "@/core/composables/useSidebarItems";
import { useAuthStore } from "@/core/stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

const collapsed = ref(false);
const showLogout = ref(false);
const openGroups = ref<string[]>([]);

const { navigation } = useSidebarItems();

function toggleGroup(name?: string) {
  if (!name) return;

  if (openGroups.value.includes(name)) {
    openGroups.value = openGroups.value.filter((g) => g !== name);
  } else {
    openGroups.value.push(name);
  }
}

function isOpen(name?: string) {
  if (!name) return false;
  return openGroups.value.includes(name);
}

function logout() {
  authStore.logout();
  showLogout.value = false;
  router.push("/login");
}
</script>

<template>
  <aside
    :class="[
      'bg-slate-900 text-white flex flex-col transition-all duration-300',
      collapsed ? 'w-16' : 'w-64',
    ]"
  >
    <!-- Toggle -->
    <div class="p-4 flex justify-center">
      <button @click="collapsed = !collapsed" class="text-xl">☰</button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 mt-4 space-y-1 overflow-y-auto">
      <template v-for="section in navigation">
        <template v-for="item in section.items" :key="item.name">
          <!-- NORMAL ITEM -->
          <RouterLink
            v-if="!item.children"
            :to="item.to"
            class="flex items-center gap-3 px-4 py-2 hover:bg-slate-700"
            active-class="bg-slate-800"
          >
            <component :is="item.icon" :size="20" />
            <span v-if="!collapsed">{{ item.label }}</span>
          </RouterLink>

          <!-- DROPDOWN -->
          <div v-else>
            <button
              class="flex items-center justify-between w-full px-4 py-2 hover:bg-slate-700"
              @click="toggleGroup(item.name)"
            >
              <div class="flex items-center gap-3">
                <component :is="item.icon" :size="20" />
                <span v-if="!collapsed">{{ item.label }}</span>
              </div>

              <ChevronDown
                v-if="!collapsed"
                class="transition-transform"
                :class="{ 'rotate-180': isOpen(item.name) }"
                :size="18"
              />
            </button>

            <div v-if="isOpen(item.name)" class="ml-6 space-y-1">
              <RouterLink
                v-for="child in item.children"
                :key="child.name"
                :to="child.to"
                class="flex items-center gap-3 px-4 py-2 hover:bg-slate-700"
                active-class="bg-slate-800"
              >
                <component :is="child.icon" :size="18" />
                <span>{{ child.label }}</span>
              </RouterLink>
            </div>
          </div>
        </template>
      </template>
    </nav>

    <!-- Logout -->
    <div class="p-4 border-t border-slate-700">
      <button
        @click="showLogout = true"
        class="flex items-center gap-3 w-full p-2 rounded hover:bg-slate-700"
      >
        <LogOut :size="20" />
        <span v-if="!collapsed">Logout</span>
      </button>
    </div>
  </aside>

  <!-- Logout Modal -->
  <div
    v-if="showLogout"
    class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg p-6 w-80">
      <h3 class="text-lg font-semibold mb-2 text-slate-900">
        {{ $t("logout") }}
      </h3>

      <p class="text-sm text-gray-600 mb-4">
        {{ $t("logoutConfirm") }}
      </p>

      <div class="flex justify-end gap-2">
        <button
          class="px-4 py-2 text-sm rounded bg-gray-200"
          @click="showLogout = false"
        >
          {{ $t("cancel") }}
        </button>

        <button
          class="px-4 py-2 text-sm rounded bg-red-600 text-white"
          @click="logout"
        >
          {{ $t("logout") }}
        </button>
      </div>
    </div>
  </div>
</template>
