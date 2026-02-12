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
          component: () => import("@/modules/dashboard/DashboardView.vue"),
        },
        {
          path: "users",
          name: "users",
          component: () => import("@/modules/users/views/UserView.vue"),
        },
        {
          path: "/roles",
          name: "roles",
          component: () => import("@/modules/roles/RolesView.vue"),
        },
        {
          path: "clientes",
          name: "clientes",
          component: () => import("@/modules/clients/ClientesView.vue"),
        },
        {
          path: "proveedores",
          name: "proveedores",
          component: () => import("@/modules/suppliers/ProveedoresView.vue"),
        },
        {
          path: "sucursales",
          name: "sucursales",
          component: () => import("@/modules/branches/SucursalesView.vue"),
        },
        {
          path: "empleados",
          name: "empleados",
          component: () => import("@/modules/employees/EmpleadosView.vue"),
        },
        {
          path: "inventario",
          name: "inventario",
          component: () => import("@/modules/inventory/InventarioView.vue"),
        },
        {
          path: "auditoria",
          name: "auditoria",
          component: () => import("@/modules/auditlog/AuditoriaView.vue"),
        },
      ],
    },
  ],
});

export default router;
