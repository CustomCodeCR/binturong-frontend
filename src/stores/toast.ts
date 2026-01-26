import { defineStore } from "pinia";
import { toCapitalized } from "@/utils/strings.ts";

const DEFAULT_DURATION = 4000;

export type ToastSeverity =
  | "success"
  | "info"
  | "warning"
  | "error"
  | "default";
export type ToastLocation =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center";
export interface Toast {
  id: string;
  title?: string;
  message: string;
  severity?: ToastSeverity;
  location?: ToastLocation;
  duration?: number;
}

export const useToastStore = defineStore("toast", {
  state: () => ({
    toasts: [] as Toast[],
  }),
  actions: {
    addToast(toast: Omit<Toast, "id">) {
      const newToast = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        severity: "success",
        location: "top-right",
        duration: DEFAULT_DURATION,
        ...toast,
      } as Toast;
      if (newToast.title == undefined) {
        newToast.title = toCapitalized(newToast.severity!);
      }
      this.toasts.push(newToast);

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          this.removeToast(newToast.id);
        }, newToast.duration);
      }
    },
    removeToast(id: string) {
      this.toasts = this.toasts.filter((toast) => toast.id !== id);
    },
  },
});
