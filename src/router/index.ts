import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/auth/LoginView.vue"),
    },

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
          component: () => import("@/views/roles/RolesView.vue"),
        },
        {
          path: "clientes",
          name: "clientes",
          component: () => import("@/views/clients/ClientesView.vue"),
        },
        {
          path: "proveedores",
          name: "proveedores",
          component: () => import("@/views/suppliers/ProveedoresView.vue"),
        },
        {
          path: "sucursales",
          name: "sucursales",
          component: () => import("@/views/branches/SucursalesView.vue"),
        },
        {
          path: "empleados",
          name: "empleados",
          component: () => import("@/views/employees/EmpleadosView.vue"),
        },
        {
          path: "inventario",
          name: "inventario",
          component: () => import("@/views/inventory/InventarioView.vue"),
        },
        {
          path: "auditoria",
          name: "auditoria",
          component: () => import("@/views/auditlog/AuditoriaView.vue"),
        },
      ],
    },
  ],
});

export default router;
