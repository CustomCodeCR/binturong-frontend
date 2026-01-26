<script setup lang="ts">
import type { HTMLAttributes, PropType } from "vue";

type sizes = "1xl" | "l" | "m" | "s";

const props = defineProps({
  element: {
    type: String as PropType<string>,
    default: "p",
  },
  size: {
    type: String as PropType<sizes>,
    default: "m",
  },
  body_atts: {
    type: Object as PropType<HTMLAttributes>,
    default: {},
  },
});

// Map body size to corresponding class
const getBodyClass = () => {
  return [`vx-text-body-${props.size}`];
};
</script>

<template>
  <component
    :is="props.element"
    v-bind="props.body_atts"
    class="max-w-[50rem]"
    :class="getBodyClass()"
  >
    <slot></slot>
  </component>
</template>
