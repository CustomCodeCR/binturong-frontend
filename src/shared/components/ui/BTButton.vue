<script setup lang="ts">
import { Bot, Loader } from "lucide-vue-next";
import { computed } from "vue";

export interface Props {
  shape?: "circle" | "rounded";
  variant?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "fourth"
    | "text"
    | "destructive"
    | "icon-text"
    | "icon-text-primary"
    | "icon"
    | "custom"
    | "blue";

  size?: "xs" | "sm" | "md" | "lg" | "cta";
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  reverse?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  shape: "circle",
  variant: "primary",
  size: "md",
  fullWidth: false,
  disabled: false,
  loading: false,
  reverse: false,
});

// classes shared across all variants
const base_classes = {
  wrapper: "flex justify-center items-center cursor-pointer",
  button:
    "flex justify-start items-center" +
    " " +
    (props.reverse ? "" : "flex-row-reverse"),
};

const shapes = {
  circle: {
    wrapper: "rounded-full",
    button: "",
  },
  rounded: {
    wrapper: "rounded-lg",
    button: "",
  },
};

const variants = {
  primary: {
    wrapper:
      "bg-bt-primary-500 hover:bg-bt-hover text-white hover:text-bt-primary-500 active:bg-bt-pressed active:text-bt-primary-500 focus:text-white focus:bg-bt-focus",
    button: "",
  },
  blue: {
    wrapper:
      "bg-blue-600 hover:bg-blue-700 text-white active:bg-blue-800 focus:ring-2 focus:ring-blue-500",
    button: "",
  },
  secondary: {
    wrapper:
      "bg-white outline outline-2 outline-offset-[-2px] outline-bt-primary-500",
    button: "text-bt-primary-500",
  },
  tertiary: {
    wrapper: "bg-gray-200",
    button: "text-bt-grey-900",
  },
  fourth: {
    wrapper: "bg-bt-primary-50",
    button: "text-bt-grey-900",
  },
  text: {
    wrapper: "",
    button: "text-bt-primary-500",
  },
  destructive: {
    wrapper: "bg-bt-error-700",
    button: "text-white",
  },
  "icon-text": {
    wrapper: "",
    button: "gap-2",
  },
  "icon-text-primary": {
    wrapper: "bg-bt-primary-500",
    button: "text-white gap-2",
  },
  icon: {
    wrapper: "bg-bt-grey-200",
    button: "",
  },
  custom: {
    wrapper: "",
    button: "",
  },
};

const disabled_state = {
  primary: {
    wrapper: "bg-bt-disabled cursor-not-allowed",
    button: "text-bt-grey-500",
  },
  blue: {
    wrapper: "bg-gray-400 cursor-not-allowed",
    button: "text-gray-200",
  },
  secondary: {
    wrapper:
      "outline outline-2 outline-offset-[-2px] outline-bt-disabled cursor-not-allowed",
    button: "text-bt-grey-400",
  },
  tertiary: {
    wrapper: "bg-bt-disabled cursor-not-allowed",
    button: "text-bt-grey-400",
  },
  fourth: {
    wrapper: "bg-bt-grey-200 cursor-not-allowed",
    button: "text-bt-grey-400",
  },
  text: {
    wrapper: "cursor-not-allowed",
    button: "text-bt-grey-400",
  },
  destructive: {
    wrapper: "bg-bt-disabled cursor-not-allowed",
    button: "text-bt-grey-400",
  },
  "icon-text": {
    wrapper: "cursor-not-allowed",
    button: "text-bt-grey-400 space-x-4",
  },
  "icon-text-primary": {
    wrapper: "bg-bt-grey-300 cursor-not-allowed",
    button: "text-bt-grey-500",
  },
  icon: {
    wrapper: "!min-w-0 !cursor-not-allowed bg-bt-grey-200",
    button: "text-bt-grey-400",
  },
  custom: {
    wrapper: "cursor-not-allowed",
    button: "",
  },
};

const sizes = {
  xs: {
    wrapper: "p-[0.5625rem]",
    button: "bt-text-button-s",
    iconSize: 10,
  },
  sm: {
    wrapper: "px-6 py-0.5 min-w-[63px]",
    button: "bt-text-button-s",
    iconSize: 16,
  },
  md: {
    wrapper: "px-4 py-[0.4375rem] min-w-[82px]",
    button: "bt-text-button-m",
    iconSize: 18,
  },
  lg: {
    wrapper: "px-[18px] py-[7px] min-w-[100px]",
    button: "bt-text-button-l",
    iconSize: 20,
  },
  cta: {
    wrapper: "px-[20px] py-[8px] min-w-[100px]",
    button: "bt-text-button-l",
    iconSize: 20,
  },
};

const selected_variant = computed(() => {
  return props.disabled
    ? disabled_state[props.variant]
    : variants[props.variant];
});

const element_classes = computed(() => ({
  wrapper: [
    base_classes.wrapper,
    shapes[props.shape].wrapper,
    sizes[props.size].wrapper,
    selected_variant.value.wrapper,
    props.fullWidth ? "w-full" : "",
  ].join(" "),
  button: [
    base_classes.button,
    shapes[props.shape].button,
    sizes[props.size].button,
    selected_variant.value.button,
  ].join(" "),
}));
</script>

<template>
  <button :class="element_classes.wrapper" :disabled="props.disabled">
    <span :class="element_classes.button">
      <span
        v-if="
          ['icon', 'icon-text', 'icon-text-primary'].includes(props.variant) &&
          !props.loading
        "
        class="block"
      >
        <slot name="icon">
          <Bot :size="sizes[props.size].iconSize" />
        </slot>
      </span>

      <span v-if="props.loading" class="block">
        <Loader
          :size="sizes[props.size].iconSize"
          class="animate-[spin_2.2s_linear_infinite]"
        />
      </span>

      <span
        v-if="!['icon', 'loading'].includes(props.variant) && !props.loading"
        class="block"
      >
        <slot>
          <p class="capitalize">{{ props.variant }} button</p>
        </slot>
      </span>
    </span>
  </button>
</template>
