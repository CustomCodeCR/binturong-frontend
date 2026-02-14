<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { X } from 'lucide-vue-next';
import BTButton from './BTButton.vue';

interface Props {
  modelValue: boolean;
  title: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  showFooter?: boolean;
  showClose?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  showFooter: true,
  showClose: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
}>();

function close() {
  emit('update:modelValue', false);
  emit('cancel');
}

function confirm() {
  emit('confirm');
}

// Close on ESC key
onMounted(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.modelValue) close();
  };
  window.addEventListener('keydown', handleEsc);
  onUnmounted(() => window.removeEventListener('keydown', handleEsc));
});

const sizeClasses = {
  small: 'max-w-md',
  medium: 'max-w-2xl',
  large: 'max-w-4xl',
  fullscreen: 'max-w-7xl h-[90vh]',
};
</script>

<template>
  <Teleport to="body">
    <Transition name="bt-modal">
      <div 
        v-if="modelValue" 
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="close"
      >
        <div :class="['bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col w-full', sizeClasses[size]]">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-bt-grey-200">
            <h3 class="text-lg font-semibold text-bt-grey-900">{{ title }}</h3>
            <button 
              v-if="showClose"
              @click="close" 
              class="p-1 hover:bg-bt-grey-100 rounded transition-colors"
            >
              <X :size="20" class="text-bt-grey-600" />
            </button>
          </div>
          
          <!-- Body -->
          <div class="px-6 py-4 overflow-y-auto flex-1">
            <slot />
          </div>
          
          <!-- Footer -->
          <div v-if="showFooter" class="px-6 py-4 border-t border-bt-grey-200 flex justify-end gap-3">
            <slot name="footer">
              <BTButton @click="close" variant="secondary" size="md" shape="rounded">
                Cancelar
              </BTButton>
              <BTButton @click="confirm" variant="blue" size="md" shape="rounded">
                Confirmar
              </BTButton>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bt-modal-enter-active,
.bt-modal-leave-active {
  transition: all 0.3s ease;
}

.bt-modal-enter-from,
.bt-modal-leave-to {
  opacity: 0;
}

.bt-modal-enter-from > div,
.bt-modal-leave-to > div {
  transform: scale(0.95);
}
</style>