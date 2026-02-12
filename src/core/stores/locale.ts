import { defineStore } from "pinia";

// ============================================================================
// Types & Interfaces
// ============================================================================
type locales = "en" | "es";

interface useLocaleState {
  locale: locales;
}

// ============================================================================
// Constants
// ============================================================================
const DEFAULT_LOCALE = "en";

// ============================================================================
// Store definition
// ============================================================================
export const useLocale = defineStore("useLocaleStore", {
  // ----------------------------------
  // State
  // ---------------------------------
  state: (): useLocaleState => ({
    locale: "en",
  }),

  // ----------------------------------
  // Actions
  // ---------------------------------
  actions: {
    setLocale(locale: locales) {
      this.locale = locale;
    },

    getLocale(): locales {
      if (this.locale == null) return DEFAULT_LOCALE;
      else return this.locale;
    },
  },
});
