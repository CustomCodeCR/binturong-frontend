<script setup lang="ts">
defineProps<{
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
}>();

function getToneClasses(tone?: string) {
  switch (tone) {
    case "success":
      return {
        wrapper: "bg-bt-success-100 border-bt-success-200",
        title: "text-bt-success-700",
        value: "text-bt-success-800",
        subtitle: "text-bt-success-700",
      };
    case "warning":
      return {
        wrapper: "bg-bt-warning-100 border-bt-warning-200",
        title: "text-bt-warning-700",
        value: "text-bt-warning-800",
        subtitle: "text-bt-warning-700",
      };
    case "danger":
      return {
        wrapper: "bg-bt-error-100 border-bt-error-200",
        title: "text-bt-error-700",
        value: "text-bt-error-800",
        subtitle: "text-bt-error-700",
      };
    case "info":
      return {
        wrapper: "bg-bt-info-100 border-bt-info-200",
        title: "text-bt-info-700",
        value: "text-bt-info-800",
        subtitle: "text-bt-info-700",
      };
    default:
      return {
        wrapper: "bg-bt-primary-50 border-bt-primary-100",
        title: "text-bt-primary-700",
        value: "text-bt-primary-800",
        subtitle: "text-bt-grey-600",
      };
  }
}
</script>

<template>
  <div
    :class="[
      'rounded-l border p-bt-spacing-16 shadow-bt-elevation-100 transition',
      getToneClasses(tone).wrapper,
    ]"
  >
    <div class="text-sm font-bt-medium" :class="getToneClasses(tone).title">
      {{ title }}
    </div>

    <div
      class="mt-bt-spacing-8 text-3xl font-bt-bold"
      :class="getToneClasses(tone).value"
    >
      {{ value }}
    </div>

    <div
      v-if="subtitle"
      class="mt-bt-spacing-8 text-sm"
      :class="getToneClasses(tone).subtitle"
    >
      {{ subtitle }}
    </div>
  </div>
</template>
