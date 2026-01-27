import { createRouter, createWebHistory } from "vue-router";
import HelloWorld from "@/components/HelloWorld.vue";
import Login from "@/components/Login.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/home",
      name: "home",
      component: HelloWorld,
    },
    {
      path: "/",
      name: "login",
      component: Login,
    },
  ],
});

export default router;
