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
          component: () => import("@/modules/branches/views/BranchesView.vue"),
        },
        {
          path: "employees",
          name: "employees",
          component: () =>
            import("@/modules/employees/views/EmployeesView.vue"),
        },
        {
          path: "audits",
          name: "audits",
          component: () => import("@/modules/auditlog/views/AuditoriaView.vue"),
        },
        {
          path: "data/taxes",
          name: "taxes",
          component: () => import("@/modules/taxes/views/TaxesView.vue"),
        },
        {
          path: "data/unit-of-measure",
          name: "unit-of-measure",
          component: () =>
            import("@/modules/unitOfMeasure/views/UnitOfMeasureView.vue"),
        },
        {
          path: "data/categories",
          name: "categories",
          component: () =>
            import("@/modules/categories/views/CategoriesView.vue"),
        },
        {
          path: "data/payment-methods",
          name: "payment-methods",
          component: () =>
            import("@/modules/paymentMethods/views/PaymentMehodsView.vue"),
        },
        {
          path: "inventory/products",
          name: "products",
          component: () => import("@/modules/products/views/ProductsView.vue"),
        },
        {
          path: "inventory/inventory-transfer",
          name: "inventory-trnasfer",
          component: () =>
            import("@/modules/inventory/views/InventoryView.vue"),
        },
        {
          path: "suppliers",
          name: "suppliers",
          component: () =>
            import("@/modules/suppliers/views/SuppliersView.vue"),
        },
        {
          path: "purchases",
          name: "purchases",
          component: () =>
            import("@/modules/purchases/views/PurchasesView.vue"),
        },
        {
          path: "quotes",
          name: "quotes",
          component: () => import("@/modules/quotes/views/QuotesView.vue"),
        },
        {
          path: "contracts",
          name: "contracts",
          component: () =>
            import("@/modules/contracts/views/ContractsView.vue"),
        },
        {
          path: "sales",
          name: "sales",
          component: () => import("@/modules/sales/views/SalesOrdersView.vue"),
        },
        {
          path: "billing",
          name: "billing",
          component: () => import("@/modules/billing/views/BillingView.vue"),
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
