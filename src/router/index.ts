import { createRouter, createWebHistory } from "vue-router"
import MainLayout from "@/layouts/MainLayout.vue"

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: MainLayout,
      children: [
        {
          path: "home",
          name: "dashboard",
          component: () => import("@/views/dashboard/DashboardView.vue"),
        },
        {
          path: "users",
          name: "users",
          component: () => import("@/views/users/UserView.vue"),
        },
        {
          path: "/roles",
          name: "roles",
          component: () => import("@/views/roles/RolesView.vue")
        }

      ],
    },
  ],
})

export default router
