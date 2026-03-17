<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

interface ActionItem {
  label: string;
  action: () => void | Promise<void>;
  danger?: boolean;
}

defineProps<{
  items: ActionItem[];
}>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

function toggleMenu() {
  open.value = !open.value;
}

function closeMenu() {
  open.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (!root.value) return;
  if (!root.value.contains(event.target as Node)) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div ref="root" class="relative inline-block">
    <div @click="toggleMenu">
      <slot name="trigger" />
    </div>

    <div
      v-if="open"
      class="absolute right-0 mt-2 w-64 bg-bt-white border border-bt-grey-200 rounded-m shadow-bt-elevation-300 z-20 overflow-hidden"
    >
      <button
        v-for="item in items"
        :key="item.label"
        type="button"
        class="w-full text-left px-bt-spacing-16 py-bt-spacing-12 text-sm transition"
        :class="
          item.danger
            ? 'text-bt-error-700 hover:bg-bt-error-100'
            : 'text-bt-primary-700 hover:bg-bt-grey-100'
        "
        @click="
          async () => {
            closeMenu();
            await item.action();
          }
        "
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>
