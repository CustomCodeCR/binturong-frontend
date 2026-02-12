import type { Component } from "vue";
import { defineStore } from "pinia";

export type DrawerDirection = "left" | "right";
export type DrawerSize = "sm" | "md" | "lg" | "xl" | string;

export interface DrawerOptions {
  component: Component;
  props?: Record<string, any>;
  direction?: DrawerDirection;
  title?: string;
  description?: string;
  size?: DrawerSize;
}

export const useDrawerStore = defineStore("drawer", {
  state: () => ({
    isOpen: false,
    component: null as Component | null,
    props: {} as Record<string, any>,
    direction: "right" as DrawerDirection,
    title: undefined as string | undefined,
    description: undefined as string | undefined,
    size: "md" as DrawerSize,
  }),
  actions: {
    openDrawer(options: DrawerOptions) {
      this.component = options.component;
      this.props = options.props || {};
      this.direction = options.direction || "right";
      this.title = options.title;
      this.description = options.description;
      this.size = options.size || "md";
      this.isOpen = true;
    },
    closeDrawer() {
      this.isOpen = false;
      this.component = null;
      this.props = {};
      this.title = undefined;
    },
    toggleDrawer(options?: DrawerOptions) {
      if (this.isOpen) {
        this.closeDrawer();
      } else if (options) {
        this.openDrawer(options);
      }
    },
  },
});
