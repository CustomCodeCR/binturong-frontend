<script setup lang="ts">
import { computed } from 'vue';
import { Check } from 'lucide-vue-next';

interface Props {
  checked?: boolean;
  disabled?: boolean;
  label?: string;
  variant?: 'default' | 'box-only';
}

const props = withDefaults(defineProps<Props>(), {
  checked: false,
  disabled: false,
  label: '',
  variant: 'default',
});

const emit = defineEmits(['update:checked', 'change']);

const toggle = () => {
  if (props.disabled) return;
  const newValue = !props.checked;
  emit('update:checked', newValue);
  emit('change', newValue);
};

const checkboxClasses = computed(() => {
  return [
    'flex h-5 w-5 items-center justify-center rounded border transition-all duration-200',
    props.disabled
      ? 'cursor-not-allowed border-bt-grey-200 bg-bt-grey-100'
      : props.checked
      ? 'border-bt-primary-500 bg-bt-primary-500'
      : 'border-bt-grey-400 bg-white hover:border-bt-primary-400',
  ];
});
</script>

<template>
  <div 
    class="flex cursor-pointer items-center gap-2" 
    @click="toggle"
  >
    <div :class="checkboxClasses">
      <Check 
        v-if="props.checked" 
        class="text-white" 
        :size="14" 
        stroke-width="4"
      />
    </div>
    <span 
      v-if="props.label && props.variant !== 'box-only'" 
      class="text-sm text-bt-grey-700 select-none"
    >
      {{ props.label }}
    </span>
  </div>
</template>