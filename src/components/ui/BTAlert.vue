<script setup lang="ts">
import { computed } from "vue";
import CloseIcon from "@/components/icons/CloseIcon.vue";
import { SquareCheck } from "lucide-vue-next";

export interface Props {
  title: string;
  variant?:
    | "default"
    | "success"
    | "error"
    | "warning"
    | "info"
    | "success_light"
    | "error_light"
    | "warning_light"
    | "info_light";
  icon?: boolean;
  iconStyle?: "inline" | "stacked";
  removable?: boolean;
  size?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
  icon: false,
  iconStyle: "stacked",
  size: "md",
  removable: false,
});

const emit = defineEmits<{ remove: [] }>();

const base_classes = {
  wrapper:
    "relative w-[300px] p-4 my-2 border rounded-xl box-border min-h-fit shadow shadow-md",
  title: "text-sm font-semibold leading-tight mb-1 m-0",
  label: "text-sm font-normal",
  icon: "",
  dismiss: "",
  buttons: "",
};

const variants = {
  default: {
    wrapper: "bg-bt-white text-bt-grey-800 !border-none",
    label: "text-bt-grey-600",
    icon: "",
    buttonStyle: "",
  },
  success: {
    wrapper: "bg-bt-success-500 border-transparent text-bt-white",
    label: "text-bt-white",
    icon: "",
    buttonStyle:
      "!bg-bt-white !border !border-bt-white !text-bt-success-700 hover:!bg-bt-white hover:!text-bt-success-700",
  },
  error: {
    wrapper: "bg-bt-error-500 border-transparent text-bt-white",
    label: "text-bt-white",
    icon: "",
    buttonStyle:
      "!bg-bt-white !border !border-bt-white !text-bt-error-700 hover:!bg-bt-white hover:!text-bt-error-700",
  },
  warning: {
    wrapper: "bg-bt-warning-500 border-transparent text-bt-white",
    label: "text-bt-white",
    icon: "",
    buttonStyle:
      "!bg-bt-white !border !border-bt-white !text-bt-warning-700 hover:!bg-bt-white hover:!text-bt-warning-700",
  },
  info: {
    wrapper: "bg-bt-info-500 border-transparent text-bt-white",
    label: "text-bt-white",
    icon: "",
    buttonStyle:
      "!bg-bt-white !border !border-bt-white !text-bt-info-700 hover:!bg-bt-white hover:!text-bt-info-700",
  },
  success_light: {
    wrapper: "bg-bt-success-100 border-bt-success-300 text-bt-grey-800",
    label: "text-bt-grey-600",
    icon: "text-bt-success-700",
    buttonStyle:
      "!bg-bt-success-700 !border-none !text-bt-white hover:!bg-bt-grey-100 hover:!text-bt-grey-800",
  },
  error_light: {
    wrapper: "bg-bt-error-100 border-bt-error-300 text-bt-grey-800",
    label: "text-bt-grey-600",
    icon: "text-bt-error-600",
    buttonStyle:
      "!bg-bt-error-600 !border-none !text-bt-white hover:!bg-bt-grey-100 hover:!text-bt-grey-800",
  },
  warning_light: {
    wrapper: "bg-bt-warning-100 border-bt-warning-300 text-bt-grey-800",
    label: "text-bt-grey-600",
    icon: "text-bt-warning-600",
    buttonStyle:
      "!bg-bt-warning-600 !border-none !text-bt-white hover:!bg-bt-grey-100 hover:!text-bt-grey-800",
  },
  info_light: {
    wrapper: "bg-bt-info-100 border-bt-info-300 text-bt-grey-800",
    label: "text-bt-grey-600",
    icon: "text-bt-info-600",
    buttonStyle:
      "!bg-bt-info-600 !border-none !text-bt-white hover:!bg-bt-grey-100 hover:!text-bt-grey-800",
  },
};

const iconStyles = {
  stacked: {
    icon: "absolute left-4 top-4 w-4 h-4 text-base flex items-center justify-center",
    wrapper: "pl-10",
    title: "block",
  },
  inline: {
    icon: "inline-flex items-center justify-center mr-1.5 align-baseline w-4 h-4 text-base",
    wrapper: "",
    title: "flex items-center",
  },
};

const sizes = {
  sm: {
    wrapper: "w-[250px] p-3",
    icon: "",
    dismiss: "",
  },
  md: {
    wrapper: "w-[300px] p-4",
    icon: "",
    dismiss: "",
  },
  lg: {
    wrapper: "w-[350px] p-5",
    icon: "",
    dismiss: "",
  },
};

const selectedVariant = computed(() => variants[props.variant]);

const element_classes = computed(() => {
  const selectedIconStyle = props.icon
    ? iconStyles[props.iconStyle]
    : { wrapper: "", title: "block", icon: "" };

  return {
    wrapper: [
      base_classes.wrapper,
      sizes[props.size].wrapper,
      selectedVariant.value.wrapper,
      selectedIconStyle.wrapper,
      props.removable ? "pr-10" : "",
    ].join(" "),

    title: [base_classes.title, selectedIconStyle.title].join(" "),

    label: [base_classes.label, selectedVariant.value.label].join(" "),

    icon: [
      base_classes.icon,
      selectedIconStyle.icon,
      sizes[props.size].icon,
      selectedVariant.value.icon,
    ].join(" "),

    dismiss: [base_classes.dismiss, sizes[props.size].dismiss].join(" "),

    buttons: base_classes.buttons,
  };
});

const handleRemove = (event: Event) => {
  event.stopPropagation();
  emit("remove");
};
</script>

<template>
  <div :class="element_classes.wrapper">
    <!-- Stacked Icon -->
    <span v-if="icon && iconStyle === 'stacked'" :class="element_classes.icon">
      <slot name="icon">
        <SquareCheck :size="16" />
      </slot>
    </span>

    <div>
      <!-- Title with optional inline icon -->
      <div :class="element_classes.title">
        <span
          v-if="icon && iconStyle === 'inline'"
          :class="element_classes.icon"
        >
          <slot name="icon">
            <SquareCheck :size="16" />
          </slot>
        </span>
        <span>{{ title }}</span>
      </div>

      <!-- Label -->
      <div :class="element_classes.label">
        <slot name="message"></slot>
      </div>

      <!-- Action Buttons -->
      <div
        v-if="$slots.buttons"
        :class="`mt-3 flex items-center gap-2 ${element_classes.buttons}`"
      >
        <slot name="buttons"></slot>
      </div>
    </div>

    <!-- Remove button -->
    <span
      v-if="removable"
      :class="`pointer-events-auto absolute right-3 top-3 cursor-pointer ${element_classes.dismiss}`"
      @click="handleRemove"
      @keydown.enter.stop="handleRemove"
      @keydown.space.stop.prevent="handleRemove"
      aria-label="Remove alert"
    >
      <CloseIcon class="h-4 w-4" />
    </span>
  </div>
</template>
