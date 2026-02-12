import "./assets/main.css";
import "./assets/base.css";

import { createApp, watch } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";

import es from "./core/i18n/es.json";
import en from "./core/i18n/en.json";

import App from "./App.vue";
import router from "./core/router";
import { useLocale } from "@/core/stores/locale";

const app = createApp(App);

app.use(createPinia());
app.use(router);

// ===========================================
// plugins setup
// ===========================================
const localStore = useLocale();
const i18n = createI18n({
  locale: "en",
  fallbackLocale: "en",
  messages: {
    en: en,
    es: es,
  },
});

watch(
  () => localStore.getLocale(),
  (newLocale) => {
    i18n.global.locale = newLocale;
  },
);

app.use(i18n);

// ===========================================
// app mounting
// ===========================================
app.mount("#app");
