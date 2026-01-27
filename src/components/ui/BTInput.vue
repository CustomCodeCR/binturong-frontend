<script setup lang="ts">
import { ShieldX } from "lucide-vue-next";
import { computed } from "vue";

export interface Props {
  variant?: "primary";
  disabled?: boolean;
  error?: boolean;
  errorMsg?: string;
  inputValue?: string;
  inputId?: string;
  inputType?: HTMLInputElement["type"];
  inputPlaceholder?: string;
  inputAutocomplete?: "on" | "off";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  disabled: false,
  error: false,
  errorMsg: "Error message",
  inputValue: "",
  inputId: "",
  inputPlaceholder: "",
  inputType: "text",
  inputAutocomplete: "off",
});

const emit = defineEmits<{
  (e: "update:inputValue", value: string): void;
  (e: "blur", ev: FocusEvent): void;
  (e: "focus", ev: FocusEvent): void;
  (e: "change", ev: Event): void;
}>();

function onInput(ev: Event) {
  const val = (ev.target as HTMLInputElement).value;
  emit("update:inputValue", val);
}
function onChange(ev: Event) {
  emit("change", ev);
}
function onBlur(ev: FocusEvent) {
  emit("blur", ev);
}
function onFocus(ev: FocusEvent) {
  emit("focus", ev);
}

// Base classes
const base_classes = {
  wrapper: "relative",
  "label-wrapper": "flex flex-col",
  "label-title": "bt-text-label-title",
  "label-description": "bt-text-label-description",
  input: [
    "flex items-center px-[0.375rem] w-full min-h-[2.75rem] rounded-full border",
    "hover:shadow-bt-elevation-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-bt-grey-500",
    "bt-text-input pl-3.5",
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
    input: "border-bt-grey-400 focus:ring-bt-focus",
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
    input: [
      "border-bt-grey-400",
      "disabled:ring-0 disabled:bg-bt-grey-100 disabled:cursor-not-allowed disabled:hover:shadow-none",
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
    input: "border-bt-error-500",
    "error-container":
      "flex items-center text-bt-error-500 cursor-not-allowed mt-1 space-x-1",
    error: "text-bt-error-500 bt-text-label-description cursor-not-allowed",
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
  input: [base_classes.input, selected_variant.input].join(" "),
  "error-container": [
    base_classes["error-container"],
    selected_variant["error-container"],
  ].join(" "),
  error: [base_classes.error, selected_variant.error].join(" "),
}));

// Prevent Invalid Keys When inputType === 'number'
const preventInvalidKeys = (event: KeyboardEvent) => {
  if (props.inputType !== "number") return;

  const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
  if (allowedKeys.includes(event.key)) return;

  const isNumber = /^[0-9.]$/.test(event.key);
  if (!isNumber) event.preventDefault();
};
</script>

<template>
  <div :class="element_classes.wrapper">
    <div :class="element_classes['label-wrapper']">
      <label
        v-if="$slots.label"
        :for="props.inputId"
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

    <input
      class="appearance-none"
      :id="props.inputId"
      :type="props.inputType"
      :class="[
        element_classes.input,
        props.inputType === 'number'
          ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          : '',
      ]"
      :disabled="props.disabled"
      :value="props.inputValue"
      :placeholder="props.inputPlaceholder"
      :autocomplete="props.inputAutocomplete"
      :aria-invalid="props.error ? 'true' : 'false'"
      @input="onInput"
      @change="onChange"
      @blur="onBlur"
      @focus="onFocus"
      @keydown="preventInvalidKeys"
    />

    <div v-if="props.error" :class="element_classes['error-container']">
      <ShieldX :size="14" />
      <p :class="element_classes.error">{{ props.errorMsg }}</p>
    </div>
  </div>
</template>
