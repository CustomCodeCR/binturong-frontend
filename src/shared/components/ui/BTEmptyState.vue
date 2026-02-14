<script setup lang="ts">
import { type Component } from 'vue';
import BTButton from './BTButton.vue';

interface Props {
  icon?: Component;
  title: string;
  message?: string;
  actionLabel?: string;
  showAction?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showAction: true,
});

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-10 text-center">
    <component 
      v-if="icon" 
      :is="icon" 
      :size="64" 
      class="text-bt-grey-300" 
    />
    
    <div>
      <h3 class="text-lg font-bold text-bt-grey-800">{{ title }}</h3>
      <p v-if="message" class="text-sm text-bt-grey-500 mt-1">{{ message }}</p>
    </div>
    
    <BTButton 
      v-if="showAction && actionLabel" 
      variant="blue" 
      size="md"
      shape="rounded"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </BTButton>
  </div>
</template>