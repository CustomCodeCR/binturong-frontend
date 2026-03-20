<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

interface ActionItem {
  label: string;
  action: () => void | Promise<void>;
}

const props = defineProps<{
  items: ActionItem[];
}>();

const open = ref(false);
const menuRef = ref<HTMLElement | null>(null);

const visibleItems = computed(() => {
  return Array.isArray(props.items) ? props.items : [];
});

function toggleMenu() {
  open.value = !open.value;
}

function closeMenu() {
  open.value = false;
}

async function handleAction(item: ActionItem) {
  try {
    await item.action();
  } finally {
    closeMenu();
  }
}

function handleClickOutside(event: MouseEvent) {
  if (!menuRef.value) return;

  const target = event.target as Node | null;

  if (target && !menuRef.value.contains(target)) {
    closeMenu();
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === "Escape") {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleEscape);
});
</script>

<template>
  <div ref="menuRef" class="relative inline-block text-left">
    <div @click.stop="toggleMenu">
      <slot name="trigger" />
    </div>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="absolute right-0 z-50 mt-2 min-w-[180px] origin-top-right rounded-m border border-bt-grey-200 bg-bt-white shadow-bt-elevation-200"
      >
        <div class="py-bt-spacing-8">
          <button
            v-for="(item, index) in visibleItems"
            :key="index"
            type="button"
            class="block w-full px-bt-spacing-16 py-bt-spacing-10 text-left text-sm text-bt-primary-700 hover:bg-bt-grey-100 transition"
            @click.stop="handleAction(item)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>
