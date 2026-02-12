<script setup lang="ts">
import {
  useDrawerStore,
  type DrawerDirection,
  type DrawerSize,
} from "@/core/stores/drawer";
import { computed, watch } from "vue";
import { X } from "lucide-vue-next";
import BTButton from "@/shared/components/ui/BTButton.vue";
import UIHeading from "@/shared/components/ui/UIHeading.vue";
import UIBody from "@/shared/components/ui/UIBody.vue";

const drawerStore = useDrawerStore();

const drawerClasses = computed(() => {
  const classes: string[] = [
    "transform",
    "transition-transform",
    "duration-300",
    "ease-in-out",
  ];
  if (drawerStore.direction === "right") {
    classes.push("right-0");
    if (drawerStore.isOpen) {
      classes.push("translate-x-0");
    } else {
      classes.push("translate-x-full");
    }
  } else {
    classes.push("left-0");
    if (drawerStore.isOpen) {
      classes.push("translate-x-0");
    } else {
      classes.push("-translate-x-full");
    }
  }
  return classes;
});

const drawerWidthClasses = computed(() => {
  switch (drawerStore.size) {
    case "sm":
      return "w-80";
    case "md":
      return "w-[40%] min-w-80";
    case "lg":
      return "w-1/2 min-w-96";
    case "xl":
      return "w-2/3 min-w-[500px]";
    case "full":
      return "w-full";
    default:
      return drawerStore.size;
  }
});

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === "Escape" && drawerStore.isOpen) {
    drawerStore.toggleDrawer();
  }
};

watch(
  () => drawerStore.isOpen,
  (newVal) => {
    if (newVal) {
      document.addEventListener("keydown", handleEscapeKey);
    } else {
      document.removeEventListener("keydown", handleEscapeKey);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Transition name="drawer-backdrop">
    <div
      v-if="drawerStore.isOpen"
      class="fixed inset-0 z-[100] bg-gray-900 bg-opacity-50 transition-opacity duration-300 ease-in-out"
      @click.self="drawerStore.closeDrawer()"
    ></div>
  </Transition>

  <Transition name="drawer-slide">
    <div
      v-if="drawerStore.isOpen"
      class="flex fixed inset-y-0 z-[101] flex-col bg-white shadow-bt-elevation-200"
      :class="[drawerClasses, drawerWidthClasses]"
    >
      <!-- drawer close button -->
      <div
        class="absolute top-8"
        :class="drawerStore.direction === 'left' ? '-right-12' : '-left-12'"
      >
        <BTButton @click="drawerStore.closeDrawer()" variant="icon" size="xs">
          <template #icon>
            <X :size="14" />
          </template>
        </BTButton>
      </div>

      <!-- drawer header -->
      <div
        v-if="drawerStore.title || drawerStore.description"
        class="mb-8 flex flex-col gap-2 px-4 pt-8"
      >
        <div v-if="drawerStore.title">
          <UIHeading class="leading-none" size="3">
            {{ drawerStore.title }}
          </UIHeading>
        </div>
        <div v-if="drawerStore.description">
          <UIBody class="text-bt-grey-600">
            {{ drawerStore.description }}
          </UIBody>
        </div>
      </div>

      <!-- drawer content -->
      <div
        class="overflow-y-auto px-4"
        :class="drawerStore.title || drawerStore.description ? '' : 'py-8'"
      >
        <component :is="drawerStore.component" v-bind="drawerStore.props" />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active {
  transition: opacity 0.2s ease-in-out;
}

.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.2s ease-in-out;
}

.drawer-slide-enter-from.right-0,
.drawer-slide-leave-to.right-0 {
  transform: translateX(100%);
}

.drawer-slide-enter-from.left-0,
.drawer-slide-leave-to.left-0 {
  transform: translateX(-100%);
}
</style>
