<script setup lang="ts">
import { ref } from "vue";
import { ChevronDown } from "lucide-vue-next";
import { useSidebarItems } from "@/core/composables/useSidebarItems";

const collapsed = ref(false);
const openGroups = ref<string[]>([]);

const { navigation } = useSidebarItems();

function toggleGroup(name?: string) {
  if (!name) return;

  if (openGroups.value.includes(name)) {
    openGroups.value = openGroups.value.filter(
      (groupName) => groupName !== name,
    );
    return;
  }

  openGroups.value.push(name);
}

function isOpen(name?: string) {
  if (!name) return false;
  return openGroups.value.includes(name);
}
</script>

<template>
  <aside
    :class="[
      'bg-bt-primary-700 text-bt-white flex flex-col transition-all duration-300 border-r border-bt-primary-600',
      collapsed ? 'w-16' : 'w-72',
    ]"
  >
    <div
      class="p-bt-spacing-16 flex justify-center border-b border-bt-primary-600"
    >
      <button
        type="button"
        class="text-xl text-bt-white hover:text-bt-accent-300 transition"
        @click="collapsed = !collapsed"
      >
        ☰
      </button>
    </div>

    <nav
      class="flex-1 mt-bt-spacing-12 space-y-1 overflow-y-auto px-bt-spacing-8 pb-bt-spacing-16"
    >
      <template
        v-for="section in navigation"
        :key="section.section || 'default'"
      >
        <div
          v-if="section.section && !collapsed"
          class="px-bt-spacing-12 pt-bt-spacing-12 pb-bt-spacing-8 text-xs uppercase tracking-wide text-bt-grey-300"
        >
          {{ section.section }}
        </div>

        <template v-for="item in section.items" :key="item.name">
          <RouterLink
            v-if="!item.children"
            :to="item.to"
            class="flex items-center gap-3 px-bt-spacing-16 py-bt-spacing-12 rounded-m text-bt-white hover:bg-bt-primary-600 transition"
            active-class="bg-bt-primary-500"
          >
            <component :is="item.icon" :size="20" />
            <span v-if="!collapsed">{{ item.label }}</span>
          </RouterLink>

          <div v-else>
            <button
              type="button"
              class="flex items-center justify-between w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m text-bt-white hover:bg-bt-primary-600 transition"
              @click="toggleGroup(item.name)"
            >
              <div class="flex items-center gap-3">
                <component :is="item.icon" :size="20" />
                <span v-if="!collapsed">{{ item.label }}</span>
              </div>

              <ChevronDown
                v-if="!collapsed"
                :size="18"
                class="transition-transform"
                :class="{ 'rotate-180': isOpen(item.name) }"
              />
            </button>

            <div
              v-if="isOpen(item.name) && !collapsed"
              class="ml-bt-spacing-24 mt-bt-spacing-4 space-y-1"
            >
              <RouterLink
                v-for="child in item.children"
                :key="child.name"
                :to="child.to"
                class="flex items-center gap-3 px-bt-spacing-16 py-bt-spacing-10 rounded-m text-bt-grey-100 hover:bg-bt-primary-600 transition"
                active-class="bg-bt-primary-500"
              >
                <component :is="child.icon" :size="18" />
                <span>{{ child.label }}</span>
              </RouterLink>
            </div>
          </div>
        </template>
      </template>
    </nav>
  </aside>
</template>
