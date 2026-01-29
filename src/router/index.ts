import { createRouter, createWebHistory } from "vue-router";
import Login from "@/layouts/MainLayout.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "login",
      component: Login,
    },
    {
      path: "/home",
      name: "dashboard",
      component: () => import("@/views/dashboard/DashboardView.vue"),
    },
    {
      path: "/users",
      name: "users",
      component: () => import("@/views/users/UserView.vue"),
    },
  ],
});

export default router;
