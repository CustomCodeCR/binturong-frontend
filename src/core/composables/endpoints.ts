export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface Endpoint {
  method: HttpMethod;
  path: string;
  headers?: Record<string, string>;
}

export type EndpointsMap = Record<string, Endpoint>;

export const Endpoints: Record<string, Endpoint> = {
  // ... tus endpoints existentes
  login: {
    method: "POST",
    path: "/api/auth/login",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  createWarehouse: {
    method: "POST",
    path: "/api/warehouses",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  updateWarehouse: {
    method: "PUT",
    path: "/api/warehouses/{{id}}",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  deleteWarehouse: {
    method: "DELETE",
    path: "/api/warehouses/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  createUser: {
    method: "POST",
    path: "/api/users",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  browseUsers: {
    method: "GET",
    path: "/api/users",
    headers: {
      Accept: "application/json",
    },
  },
  readUserById: {
    method: "GET",
    path: "/api/users/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  updateUser: {
    method: "PUT",
    path: "/api/users/{{id}}",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  deleteUser: {
    method: "DELETE",
    path: "/api/users/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  modifyUserRole: {
    method: "PUT",
    path: "/api/users/{{id}}/role",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  removeUserRole: {
    method: "DELETE",
    path: "/api/users/{{id}}/role/{{roleId}}",
    headers: {
      Accept: "application/json",
    },
  },
  addUserScopes: {
    method: "PUT",
    path: "/api/users/{{id}}/scopes",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  createUnitOfMeasure: {
    method: "POST",
    path: "/api/units-of-measure",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  browseUnitsOfMeasure: {
    method: "GET",
    path: "/api/units-of-measure",
    headers: {
      Accept: "application/json",
    },
  },
  readUnitOfMeasureById: {
    method: "GET",
    path: "/api/units-of-measure/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  updateUnitOfMeasure: {
    method: "PUT",
    path: "/api/units-of-measure/{{id}}",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  deleteUnitOfMeasure: {
    method: "DELETE",
    path: "/api/units-of-measure/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  createTax: {
    method: "POST",
    path: "/api/taxes",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  browseTaxes: {
    method: "GET",
    path: "/api/taxes",
    headers: {
      Accept: "application/json",
    },
  },
  readTaxById: {
    method: "GET",
    path: "/api/taxes/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  updateTax: {
    method: "PUT",
    path: "/api/taxes/{{id}}",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  deleteTax: {
    method: "DELETE",
    path: "/api/taxes/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  createProductCategory: {
    method: "POST",
    path: "/api/product-categories",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  browseProductCategories: {
    method: "GET",
    path: "/api/product-categories",
    headers: {
      Accept: "application/json",
    },
  },
  readProductCategoryById: {
    method: "GET",
    path: "/api/product-categories/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  updateProductCategory: {
    method: "PUT",
    path: "/api/product-categories/{{id}}",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  deleteProductCategory: {
    method: "DELETE",
    path: "/api/product-categories/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  createProduct: {
    method: "POST",
    path: "/api/products",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  browseProducts: {
    method: "GET",
    path: "/api/products",
    headers: {
      Accept: "application/json",
    },
  },
  readProductById: {
    method: "GET",
    path: "/api/products/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  updateProduct: {
    method: "PUT",
    path: "/api/products/{{id}}",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  deleteProduct: {
    method: "DELETE",
    path: "/api/products/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  createEmployee: {
    method: "POST",
    path: "/api/employees",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  browseEmployees: {
    method: "GET",
    path: "/api/employees",
    headers: {
      Accept: "application/json",
    },
  },
  readEmployeeById: {
    method: "GET",
    path: "/api/employees/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  updateEmployee: {
    method: "PUT",
    path: "/api/employees/{{id}}",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  deleteEmployee: {
    method: "DELETE",
    path: "/api/employees/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  checkInEmployee: {
    method: "POST",
    path: "/api/employees/{{id}}/check-in",
    headers: {
      Accept: "application/json",
    },
  },
  checkOutEmployee: {
    method: "POST",
    path: "/api/employees/{{id}}/check-out",
    headers: {
      Accept: "application/json",
    },
  },
  createPurchaseRequest: {
    method: "POST",
    path: "/api/purchases/requests",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  browsePurchaseRequests: {
    method: "GET",
    path: "/api/purchases/requests",
    headers: {
      Accept: "application/json",
    },
  },
  readPurchaseRequestById: {
    method: "GET",
    path: "/api/purchases/requests/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  createPurchaseOrder: {
    method: "POST",
    path: "/api/purchases/orders",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  browsePurchaseOrders: {
    method: "GET",
    path: "/api/purchases/orders",
    headers: {
      Accept: "application/json",
    },
  },
  readPurchaseOrderById: {
    method: "GET",
    path: "/api/purchases/orders/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  createPurchaseReceipt: {
    method: "POST",
    path: "/api/purchases/receipts",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  browsePurchaseReceipts: {
    method: "GET",
    path: "/api/purchases/receipts",
    headers: {
      Accept: "application/json",
    },
  },
  readPurchaseReceiptById: {
    method: "GET",
    path: "/api/purchases/receipts/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  rejectPurchaseReceipt: {
    method: "POST",
    path: "/api/purchases/receipts/{{id}}/reject",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
};
