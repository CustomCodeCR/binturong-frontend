<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import { useModalStore } from "@/core/stores/modalStore";
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

        <!--
          El contenedor externo es `fixed inset-0` (alto = viewport). Antes el
          panel usaba `min-h-screen` sin scroll propio, así que un formulario
          más alto que la pantalla quedaba recortado y el botón de guardar no
          se podía alcanzar. Ahora el wrapper hace scroll y el panel se centra
          solo cuando cabe.
        -->
        <Transition name="scale-fade">
          <div
            class="absolute inset-0 overflow-y-auto overscroll-contain p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Modal"
          >
            <div class="flex min-h-full items-center justify-center">
              <!--
                Cada modal declara su propio `max-w-*`; el contenedor ya no lo
                limita a `max-w-2xl` para que los formularios anchos no queden
                comprimidos en pantallas grandes.
              -->
              <div class="relative flex w-full justify-center" @click.stop>
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
