import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { Component } from "vue";

import {
  LayoutDashboard,
  Users,
  Shield,
  ShoppingCart,
  ShoppingBag,
  Building2,
  UserRound,
  Truck,
  Briefcase,
  WalletCards,
  Boxes,
  FileSignature,
  ReceiptText,
  CreditCard,
  FileText,
  ClipboardList,
  Database,
  Ruler,
  BadgePercent,
  Tags,
  Package,
  Wrench,
} from "lucide-vue-next";

export interface SidebarItem {
  labelKey: string;
  icon: Component;
  to?: string;
  name?: string;
  children?: SidebarItem[];
}

export interface SidebarSection {
  sectionKey?: string;
  items: SidebarItem[];
}

export interface SidebarItemView extends SidebarItem {
  label: string;
  children?: SidebarItemView[];
}

export interface SidebarSectionView {
  section: string;
  items: SidebarItemView[];
}

const SIDEBAR_NAVIGATION: SidebarSection[] = [
  {
    items: [
      {
        labelKey: "sidebar.dashboard",
        icon: LayoutDashboard,
        to: "/home",
        name: "dashboard",
      },
      {
        labelKey: "sidebar.users",
        icon: Users,
        to: "/users",
        name: "users",
      },
      {
        labelKey: "sidebar.roles",
        icon: Shield,
        to: "/roles",
        name: "roles",
      },
      {
        labelKey: "sidebar.purchases",
        icon: ShoppingCart,
        to: "/purchases",
        name: "purchases",
      },
      {
        labelKey: "sidebar.sales",
        icon: ShoppingBag,
        to: "/sales",
        name: "sales",
      },
      {
        labelKey: "sidebar.branches",
        icon: Building2,
        to: "/branches",
        name: "branches",
      },
      {
        labelKey: "sidebar.clients",
        icon: UserRound,
        to: "/clients",
        name: "clients",
      },
      {
        labelKey: "sidebar.suppliers",
        icon: Truck,
        to: "/suppliers",
        name: "suppliers",
      },
      {
        labelKey: "sidebar.employees",
        icon: Briefcase,
        to: "/employees",
        name: "employees",
      },
      {
        labelKey: "sidebar.services",
        icon: Wrench,
        to: "/services",
        name: "services",
      },
      {
        labelKey: "sidebar.payroll",
        icon: WalletCards,
        to: "/payroll",
        name: "payroll",
      },
      {
        labelKey: "sidebar.inventory",
        icon: Boxes,
        name: "inventory",
        children: [
          {
            labelKey: "sidebar.products",
            icon: Package,
            to: "/inventory/products",
            name: "products",
          },
          {
            labelKey: "sidebar.inventory",
            icon: Boxes,
            to: "/inventory/inventory-transfer",
            name: "inventory-transfer",
          },
        ],
      },
      {
        labelKey: "sidebar.contracts",
        icon: FileSignature,
        to: "/contracts",
        name: "contracts",
      },
      {
        labelKey: "sidebar.billing",
        icon: ReceiptText,
        to: "/billing",
        name: "billing",
      },
      {
        labelKey: "sidebar.payments",
        icon: CreditCard,
        to: "/payments",
        name: "payments",
      },
      {
        labelKey: "sidebar.quotes",
        icon: FileText,
        to: "/quotes",
        name: "quotes",
      },
      {
        labelKey: "sidebar.audits",
        icon: ClipboardList,
        to: "/audits",
        name: "audits",
      },
      {
        labelKey: "sidebar.data",
        icon: Database,
        name: "data",
        children: [
          {
            labelKey: "sidebar.unitOfMeasure",
            icon: Ruler,
            to: "/data/unit-of-measure",
            name: "unit-of-measure",
          },
          {
            labelKey: "sidebar.taxes",
            icon: BadgePercent,
            to: "/data/taxes",
            name: "taxes",
          },
          {
            labelKey: "sidebar.categories",
            icon: Tags,
            to: "/data/categories",
            name: "categories",
          },
          {
            labelKey: "sidebar.paymentMethods",
            icon: CreditCard,
            to: "/data/payment-methods",
            name: "payment-methods",
          },
        ],
      },
    ],
  },
];

export function useSidebarItems() {
  const { t } = useI18n();

  const navigation = computed<SidebarSectionView[]>(() =>
    SIDEBAR_NAVIGATION.map((section) => ({
      section: section.sectionKey ? t(section.sectionKey) : "",
      items: section.items.map((item) => mapItem(item, t)),
    })),
  );

  return {
    navigation,
  };
}

function mapItem(
  item: SidebarItem,
  t: (key: string) => string,
): SidebarItemView {
  return {
    ...item,
    label: t(item.labelKey),
    children: item.children?.map((child) => mapItem(child, t)),
  };
}

export { SIDEBAR_NAVIGATION };
