<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import { useModalStore } from "@/core/stores/modal";
const store = useModalStore();

function handleSuccess(payload: any) {
  try {
    store.onSuccess?.(payload);
  } finally {
    store.close();
  }
}
function handleError(error: any) {
  try {
    store.onError?.(error);
  } finally {
    store.close();
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && store.isOpen) store.close();
}
onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Teleport to="body">
    <Transition name="fade" mode="out-in">
      <div
        v-if="store.component && store.isOpen"
        class="fixed inset-0 z-[9999]"
        aria-live="assertive"
      >
        <!-- Overlay -->
        <Transition name="fade">
          <div
            class="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            @click="store.close"
          />
        </Transition>

        <!-- Panel wrapper -->
        <Transition name="scale-fade">
          <div
            class="relative inset-0 min-h-screen flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Modal"
          >
            <div class="relative w-full max-w-2xl" @click.stop>
              <component
                :is="store.component"
                v-bind="store.props"
                v-model:open="store.isOpen"
                @success="handleSuccess"
                @error="handleError"
                @update:open="store.setOpen"
              />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-fade-enter-active,
.scale-fade-leave-active {
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}
.scale-fade-enter-from,
.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
