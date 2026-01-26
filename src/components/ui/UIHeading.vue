<script setup lang="ts">
import type { HTMLAttributes, PropType } from "vue";

type headings = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type sizes = "1" | "2" | "3" | "4" | "5" | "6";

const props = defineProps({
  element: {
    type: String as PropType<headings>,
    default: "h3",
  },
  size: {
    type: String as PropType<sizes>,
    default: "3",
  },
  heading_atts: {
    type: Object as PropType<HTMLAttributes>,
    default: {},
  },
});

// Map heading element to corresponding class
const getHeadingClass = () => {
  return [`vx-text-heading-${props.size}`];
};
</script>

<template>
  <component
    :is="props.element"
    v-bind="props.heading_atts"
    class="max-w-[50rem]"
    :class="getHeadingClass()"
  >
    <slot></slot>
  </component>
</template>
