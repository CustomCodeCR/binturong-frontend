<script setup lang="ts">
import { ShieldX } from "lucide-vue-next";
import { computed } from "vue";

export interface Props {
  variant?: "primary" | "login";
  disabled?: boolean;
  error?: boolean;
  errorMsg?: string;
  textValue?: string;
  textId?: string;
  textPlaceholder?: string;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  disabled: false,
  error: false,
  errorMsg: "Error message",
  textValue: "",
  textId: "",
  textPlaceholder: "",
  rows: 4,
  showCount: false,
});

const emit = defineEmits<{
  (e: "update:textValue", value: string): void;
  (e: "blur", ev: FocusEvent): void;
  (e: "focus", ev: FocusEvent): void;
  (e: "change", ev: Event): void;
}>();

function onInput(ev: Event) {
  const val = (ev.target as HTMLTextAreaElement).value;
  emit("update:textValue", val);
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

const characterCount = computed(() => {
  if (!props.showCount) return null;
  const current = props.textValue?.length || 0;
  return props.maxLength ? `${current}/${props.maxLength}` : `${current}`;
});

// Same class system as BTInput
const base_classes = {
  wrapper: "relative",
  "label-wrapper": "flex flex-col",
  "label-title": "bt-text-label-title",
  "label-description": "bt-text-label-description",
  textarea: [
    "flex items-start px-[0.375rem] w-full rounded-2xl border py-2.5",
    "hover:shadow-bt-elevation-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-bt-grey-500",
    "bt-text-input pl-3.5 resize-vertical",
  ].join(" "),
  "count-wrapper": "flex justify-end mt-1",
  count: "text-xs text-bt-grey-600",
  "error-container": "",
  error: "",
};

const variants = {
  primary: {
    wrapper: "",
    "label-wrapper": "",
    "label-title": "",
    "label-description": "text-bt-grey-600",
    textarea: "border-bt-grey-400 focus:ring-bt-focus",
    "count-wrapper": "",
    count: "",
    "error-container": "",
    error: "",
  },
  login: {
    wrapper: "bg-transparent",
    "label-wrapper": "mb-1.5",
    "label-title": "text-white font-medium",
    "label-description": "text-slate-400",
    textarea:
      "bg-[#0d1117] border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-400",
    "count-wrapper": "",
    count: "text-slate-400",
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
    textarea: [
      "border-bt-grey-400",
      "disabled:ring-0 disabled:bg-bt-grey-100 disabled:cursor-not-allowed disabled:hover:shadow-none",
    ].join(" "),
    "count-wrapper": "",
    count: "text-bt-grey-500",
    "error-container": "",
    error: "",
  },
  login: {
    wrapper: "",
    "label-wrapper": "",
    "label-title": "text-slate-400 cursor-not-allowed",
    "label-description": "text-slate-400 cursor-not-allowed",
    textarea: [
      "border-slate-700",
      "disabled:ring-0 disabled:bg-[#0d1117]/50 disabled:cursor-not-allowed disabled:hover:shadow-none",
    ].join(" "),
    "count-wrapper": "",
    count: "text-slate-400",
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
    textarea: "border-bt-error-500",
    "count-wrapper": "",
    count: "",
    "error-container":
      "flex items-center text-bt-error-500 cursor-not-allowed mt-1 space-x-1",
    error: "text-bt-error-500 bt-text-label-description cursor-not-allowed",
  },
  login: {
    wrapper: "",
    "label-wrapper": "",
    "label-title": "",
    "label-description": "",
    textarea: "border-red-500",
    "count-wrapper": "",
    count: "",
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
  textarea: [base_classes.textarea, selected_variant.textarea].join(" "),
  "count-wrapper": [
    base_classes["count-wrapper"],
    selected_variant["count-wrapper"],
  ].join(" "),
  count: [base_classes.count, selected_variant.count].join(" "),
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
        :for="props.textId"
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

    <textarea
      :id="props.textId"
      :class="element_classes.textarea"
      :disabled="props.disabled"
      :value="props.textValue"
      :placeholder="props.textPlaceholder"
      :rows="props.rows"
      :maxlength="props.maxLength"
      :aria-invalid="props.error ? 'true' : 'false'"
      @input="onInput"
      @change="onChange"
      @blur="onBlur"
      @focus="onFocus"
    />

    <div v-if="characterCount" :class="element_classes['count-wrapper']">
      <span :class="element_classes.count">{{ characterCount }}</span>
    </div>

    <div v-if="props.error" :class="element_classes['error-container']">
      <ShieldX :size="14" />
      <p :class="element_classes.error">{{ props.errorMsg }}</p>
    </div>
  </div>
</template>