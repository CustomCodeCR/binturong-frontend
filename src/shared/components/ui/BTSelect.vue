<script setup lang="ts">
import { ShieldX } from "lucide-vue-next";
import { computed } from "vue";

export interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface Props {
  variant?: "primary" | "login";
  disabled?: boolean;
  error?: boolean;
  errorMsg?: string;
  selectValue?: string | number | null;
  selectId?: string;
  placeholder?: string;
  options: Option[];
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  disabled: false,
  error: false,
  errorMsg: "Seleccione una opción válida",
  selectValue: null,
  selectId: "",
  placeholder: "Seleccionar...",
});

const emit = defineEmits<{
  (e: "update:selectValue", value: string | number): void;
  (e: "blur", ev: FocusEvent): void;
  (e: "focus", ev: FocusEvent): void;
  (e: "change", ev: Event): void;
}>();

function onChange(ev: Event) {
  const val = (ev.target as HTMLSelectElement).value;
  emit("update:selectValue", val);
  emit("change", ev);
}

function onBlur(ev: FocusEvent) {
  emit("blur", ev);
}

function onFocus(ev: FocusEvent) {
  emit("focus", ev);
}


const base_classes = {
  wrapper: "relative",
  "label-wrapper": "flex flex-col",
  "label-title": "bt-text-label-title",
  "label-description": "bt-text-label-description",
  select: [
    "flex items-center px-[0.375rem] w-full min-h-[2.75rem] rounded-full border",
    "hover:shadow-bt-elevation-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-bt-grey-500",
    "bt-text-input pl-3.5 pr-10 appearance-none cursor-pointer bg-white",
  ].join(" "),
  "error-container": "",
  error: "",
};

const variants = {
  primary: {
    wrapper: "",
    "label-wrapper": "",
    "label-title": "",
    "label-description": "text-bt-grey-600",
    select: "border-bt-grey-400 focus:ring-bt-focus",
    "error-container": "",
    error: "",
  },
  login: {
    wrapper: "bg-transparent",
    "label-wrapper": "mb-1.5",
    "label-title": "text-white font-medium",
    "label-description": "text-slate-400",
    select:
      "bg-[#0d1117] border-slate-700 text-white focus:ring-blue-500/50 focus:border-blue-400",
    "error-container": "",
    error: "",
  },
};

const disabled_state = {
  primary: {
    wrapper: "",
    "label-wrapper": "",
    "label-title": "text-bt-grey-500 cursor-not-allowed",
    "label-description": "text-bt-grey-500 cursor-not-allowed",
    select: [
      "border-bt-grey-400",
      "disabled:ring-0 disabled:bg-bt-grey-100 disabled:cursor-not-allowed disabled:hover:shadow-none",
    ].join(" "),
    "error-container": "",
    error: "",
  },
  login: {
    wrapper: "",
    "label-wrapper": "",
    "label-title": "text-slate-400 cursor-not-allowed",
    "label-description": "text-slate-400 cursor-not-allowed",
    select: [
      "border-slate-700",
      "disabled:ring-0 disabled:bg-[#0d1117]/50 disabled:cursor-not-allowed disabled:hover:shadow-none",
    ].join(" "),
    "error-container": "",
    error: "",
  },
};

const error_state = {
  primary: {
    wrapper: "",
    "label-wrapper": "",
    "label-title": "",
    "label-description": "",
    select: "border-bt-error-500",
    "error-container":
      "flex items-center text-bt-error-500 cursor-not-allowed mt-1 space-x-1",
    error: "text-bt-error-500 bt-text-label-description cursor-not-allowed",
  },
  login: {
    wrapper: "",
    "label-wrapper": "",
    "label-title": "",
    "label-description": "",
    select: "border-red-500",
    "error-container":
      "flex items-center text-red-500 cursor-not-allowed mt-1 space-x-1",
    error: "text-red-500 bt-text-label-description cursor-not-allowed",
  },
};

const selected_variant = props.disabled
  ? disabled_state[props.variant]
  : props.error
    ? error_state[props.variant]
    : variants[props.variant];

const element_classes = computed(() => ({
  wrapper: [base_classes.wrapper, selected_variant.wrapper].join(" "),
  "label-wrapper": [
    base_classes["label-wrapper"],
    selected_variant["label-wrapper"],
  ].join(" "),
  "label-title": [
    base_classes["label-title"],
    selected_variant["label-title"] ?? "",
  ].join(" "),
  "label-description": [
    base_classes["label-description"],
    selected_variant["label-description"],
  ].join(" "),
  select: [base_classes.select, selected_variant.select].join(" "),
  "error-container": [
    base_classes["error-container"],
    selected_variant["error-container"],
  ].join(" "),
  error: [base_classes.error, selected_variant.error].join(" "),
}));
</script>

<template>
  <div :class="element_classes.wrapper">
    <div :class="element_classes['label-wrapper']">
      <label
        v-if="$slots.label"
        :for="props.selectId"
        :class="element_classes['label-title']"
      >
        <slot name="label">Label</slot>
      </label>

      <span
        v-if="$slots.description"
        :class="element_classes['label-description']"
      >
        <slot name="description">Description</slot>
      </span>
    </div>

    <div class="relative">
      <select
        :id="props.selectId"
        :class="element_classes.select"
        :disabled="props.disabled"
        :value="props.selectValue"
        :aria-invalid="props.error ? 'true' : 'false'"
        @change="onChange"
        @blur="onBlur"
        @focus="onFocus"
      >
        <option :value="null" disabled>{{ props.placeholder }}</option>
        <option
          v-for="option in props.options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
      
      <!-- Dropdown arrow icon -->
      <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg class="w-4 h-4 text-bt-grey-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <div v-if="props.error" :class="element_classes['error-container']">
      <ShieldX :size="14" />
      <p :class="element_classes.error">{{ props.errorMsg }}</p>
    </div>
  </div>
</template>