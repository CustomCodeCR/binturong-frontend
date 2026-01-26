<script setup lang="ts">
import {
  type Toast,
  type ToastLocation,
  useToastStore,
} from "@/stores/toast.ts";
import { computed } from "vue";
import BTAlert from "@/components/ui/BTAlert.vue";
import {
  CircleX,
  Info,
  TriangleAlert,
  CircleCheckBig,
  BookAlert,
} from "lucide-vue-next";

const toastStore = useToastStore();

const groupedToasts = computed(() => {
  const groups: Record<ToastLocation, Toast[]> = {
    "top-left": [],
    "top-center": [],
    "top-right": [],
    "bottom-left": [],
    "bottom-center": [],
    "bottom-right": [],
  };
  toastStore.toasts.forEach((toast) => {
    groups[toast.location!].push(toast);
  });
  return groups;
});

function getLocationContainerClasses(location: ToastLocation) {
  const classes = [];
  if (location.includes("top")) classes.push("top-4", "bottom-4", "flex-col");
  if (location.includes("bottom"))
    classes.push("bottom-4", "top-4", "flex-col-reverse");

  if (location === "top-center" || location === "bottom-center") {
    classes.push(
      "left-1/2",
      "-translate-x-1/2",
      "flex-col",
      "flex-wrap",
      "items-center",
    );
  } else {
    if (location.includes("left")) classes.push("left-4", "flex-wrap");
    if (location.includes("right"))
      classes.push("right-4", "flex-wrap-reverse");
  }
  return classes;
}
</script>

<template>
  <div
    v-for="(toasts, location) in groupedToasts"
    :key="location"
    class="pointer-events-none fixed z-[9999] flex gap-4"
    :class="getLocationContainerClasses(location)"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="rounded-bt-space flex-shrink-0"
    >
      <BTAlert
        icon
        removable
        @remove="() => toastStore.removeToast(toast.id)"
        :variant="toast.severity"
        :title="toast.title ?? ''"
      >
        <template #icon>
          <CircleCheckBig :size="16" v-if="toast.severity === 'success'" />
          <Info :size="16" v-else-if="toast.severity === 'info'" />
          <TriangleAlert :size="16" v-else-if="toast.severity === 'warning'" />
          <CircleX :size="16" v-else-if="toast.severity === 'error'" />
          <BookAlert :size="16" v-else />
        </template>

        <template #message>
          <span>{{ toast.message }}</span>
        </template>
      </BTAlert>
    </div>
  </div>
</template>
