import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/shared/components/layouts/MainLayout.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/modules/auth/views/LoginView.vue"),
    },

    {
      path: "/",
      component: MainLayout,
      children: [
        {
          path: "home",
          name: "dashboard",
          component: () =>
            import("@/modules/dashboard/views/DashboardView.vue"),
        },
        {
          path: "users",
          name: "users",
          component: () => import("@/modules/users/views/UserView.vue"),
        },
        {
          path: "roles",
          name: "roles",
          component: () => import("@/modules/roles/views/RolesView.vue"),
        },
        {
          path: "clientes",
          name: "clientes",
          component: () => import("@/modules/clients/views/ClientesView.vue"),
        },
        {
          path: "proveedores",
          name: "proveedores",
          component: () =>
            import("@/modules/suppliers/views/ProveedoresView.vue"),
        },
        {
          path: "sucursales",
          name: "sucursales",
          component: () =>
            import("@/modules/branches/views/SucursalesView.vue"),
        },
        {
          path: "empleados",
          name: "empleados",
          component: () =>
            import("@/modules/employees/views/EmpleadosView.vue"),
        },
        {
          path: "inventario",
          name: "inventario",
          component: () =>
            import("@/modules/inventory/views/InventarioView.vue"),
        },
        {
          path: "auditoria",
          name: "auditoria",
          component: () => import("@/modules/auditlog/views/AuditoriaView.vue"),
        },
      ],
    },
  ],
});

import { useAuthStore } from "@/core/stores/auth";

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token")

  // Deja pasar siempre a login
  if (to.path === "/login") {
    // Si ya hay token, no debería volver al login
    if (token) return next("/home")
    return next()
  }

  // Todo lo demás requiere token
  if (!token) return next("/login")

  next()
})

export default router;
