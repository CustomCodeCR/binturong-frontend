import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/shared/components/layouts/MainLayout.vue";
import { useAuthStore } from "../stores/authStore";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/modules/auth/views/LoginView.vue"),
      meta: {
        public: true,
      },
    },

    {
      path: "/",
      redirect: () => {
        const authStore = useAuthStore();
        return authStore.hasValidSession() ? "/home" : "/login";
      },
    },

    {
      path: "/",
      component: MainLayout,
      meta: {
        requiresAuth: true,
      },
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
          path: "clients",
          name: "clients",
          component: () => import("@/modules/clients/views/ClientesView.vue"),
        },
        {
          path: "branches",
          name: "branches",
          component: () =>
            import("@/modules/branches/views/SucursalesView.vue"),
        },
        {
          path: "employees",
          name: "employees",
          component: () =>
            import("@/modules/employees/views/EmpleadosView.vue"),
        },
        {
          path: "audits",
          name: "audits",
          component: () => import("@/modules/auditlog/views/AuditoriaView.vue"),
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  authStore.initialize();

  const isPublic = to.meta.public === true;
  const hasSession = authStore.hasValidSession();

  if (to.path === "/login" && hasSession) {
    return "/home";
  }

  if (!isPublic && !hasSession) {
    return "/login";
  }

  return true;
});

export default router;
