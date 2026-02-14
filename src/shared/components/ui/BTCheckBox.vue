<script setup lang="ts">
import { computed } from 'vue';
import { Check, ShieldX } from 'lucide-vue-next'; // ← ADD ShieldX

interface Props {
  checked?: boolean;
  disabled?: boolean;
  label?: string;
  variant?: 'default' | 'box-only';
  error?: boolean;        // ← ADD THIS
  errorMsg?: string;      // ← ADD THIS
}

const props = withDefaults(defineProps<Props>(), {
  checked: false,
  disabled: false,
  label: '',
  variant: 'default',
  error: false,           // ← ADD THIS
  errorMsg: 'Selección requerida',  // ← ADD THIS
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
      : props.error                                    
        ? 'border-bt-error-500 bg-white'             
        : props.checked
          ? 'border-bt-primary-500 bg-bt-primary-500'
          : 'border-bt-grey-400 bg-white hover:border-bt-primary-400',
  ];
});
</script>

<template>
  <!-- ← WRAP EVERYTHING IN A COLUMN CONTAINER -->
  <div class="flex flex-col gap-1">
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
      
      <!-- ← CHANGE TO USE SLOT (more flexible like BTInput) -->
      <span 
        v-if="($slots.label || props.label) && props.variant !== 'box-only'" 
        class="text-sm text-bt-grey-700 select-none"
      >
        <slot name="label">{{ props.label }}</slot>
      </span>
    </div>
    
    <!-- ← ADD ERROR MESSAGE SECTION (matches BTInput exactly) -->
    <div 
      v-if="props.error" 
      class="flex items-center text-bt-error-500 mt-1 space-x-1"
    >
      <ShieldX :size="14" />
      <p class="text-bt-error-500 text-xs">{{ props.errorMsg }}</p>
    </div>
  </div>
</template>