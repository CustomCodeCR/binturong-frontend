import "./assets/base.css";
import "./assets/main.css";

import { createApp, watch } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";

import es from "./i18n/es.json";
import en from "./i18n/en.json";

import App from "./App.vue";
import router from "./router";
import { useLocale } from "@/stores/locale.ts";

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
