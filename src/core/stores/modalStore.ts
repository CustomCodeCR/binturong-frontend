import type { Component } from "vue";
import { defineStore } from "pinia";

export interface ModalOpenOptions<
  TSuccess = any,
  TError = { code: number; message: string },
> {
  component: Component;
  props?: Record<string, any>;
  onSuccess?: (payload: TSuccess) => void;
  onError?: (error: TError) => void;
  blockScroll?: boolean;
}

export const useModalStore = defineStore("modal", {
  state: () => ({
    isOpen: false,
    component: null as Component | null,
    props: {} as Record<string, any>,
    onSuccess: undefined as ((p: any) => void) | undefined,
    onError: undefined as ((e: any) => void) | undefined,
    blockScroll: true as boolean,
  }),

  actions: {
    open<TS = any, TE = { code: number; message: string }>(
      options: ModalOpenOptions<TS, TE>,
    ) {
      this.component = options.component;
      this.props = options.props ?? {};
      this.onSuccess = options.onSuccess as any;
      this.onError = options.onError as any;
      this.blockScroll = options.blockScroll ?? true;
      this.isOpen = true;
      if (this.blockScroll) document.body.style.overflow = "hidden";
    },

    close() {
      this.isOpen = false;
      this.component = null;
      this.props = {};
      this.onSuccess = undefined;
      this.onError = undefined;
      document.body.style.overflow = "";
    },

    setOpen(value: boolean) {
      this.isOpen = value;
      if (!value) this.close();
    },
  },
});
