export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface Endpoint {
  method: HttpMethod;
  path: string;
  headers?: Record<string, string>;
}

export type EndpointsMap = Record<string, Endpoint>;

export const Endpoints: Record<string, Endpoint> = {
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
  createSupplier: {
    method: "POST",
    path: "/api/suppliers",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  },
  browseSuppliers: {
    method: "GET",
    path: "/api/suppliers",
    headers: { Accept: "application/json" },
  },
  readSupplierById: {
    method: "GET",
    path: "/api/suppliers/{{id}}",
    headers: { Accept: "application/json" },
  },
  updateSupplier: {
    method: "PUT",
    path: "/api/suppliers/{{id}}",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  },
  deleteSupplier: {
    method: "DELETE",
    path: "/api/suppliers/{{id}}",
    headers: { Accept: "application/json" },
  },
  updateSupplierCredit: {
    method: "PUT",
    path: "/api/suppliers/{{id}}/credit",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  },
  createSupplierContact: {
    method: "POST",
    path: "/api/suppliers/{{supplierId}}/contacts",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  },
  updateSupplierContact: {
    method: "PUT",
    path: "/api/suppliers/{{supplierId}}/contacts/{{contactId}}",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  },
  deleteSupplierContact: {
    method: "DELETE",
    path: "/api/suppliers/{{supplierId}}/contacts/{{contactId}}",
    headers: { Accept: "application/json" },
  },
  setPrimarySupplierContact: {
    method: "PUT",
    path: "/api/suppliers/{{supplierId}}/contacts/{{contactId}}/primary",
    headers: { Accept: "application/json" },
  },
  addSupplierAttachment: {
    method: "POST",
    path: "/api/suppliers/{{supplierId}}/attachments",
    headers: { Accept: "application/json" },
  },
  removeSupplierAttachment: {
    method: "DELETE",
    path: "/api/suppliers/{{supplierId}}/attachments/{{attachmentId}}",
    headers: { Accept: "application/json" },
  },
  supplierPurchaseHistory: {
    method: "GET",
    path: "/api/suppliers/{{id}}/purchase-history",
    headers: { Accept: "application/json" },
  },
  supplierPurchaseHistoryPdf: {
    method: "GET",
    path: "/api/suppliers/{{id}}/purchase-history/pdf",
    headers: { Accept: "application/pdf" },
  },
  supplierPurchaseHistoryExcel: {
    method: "GET",
    path: "/api/suppliers/{{id}}/purchase-history/excel",
    headers: {
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  },
  createSupplierEvaluation: {
    method: "POST",
    path: "/api/suppliers/evaluations",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  },
  browseSupplierEvaluationsBySupplierId: {
    method: "GET",
    path: "/api/suppliers/evaluations/{{supplierId}}",
    headers: { Accept: "application/json" },
  },
  createSupplierQuote: {
    method: "POST",
    path: "/api/suppliers/quotes",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  },
  browseSupplierQuotes: {
    method: "GET",
    path: "/api/suppliers/quotes",
    headers: { Accept: "application/json" },
  },
  readSupplierQuoteById: {
    method: "GET",
    path: "/api/suppliers/quotes/{{id}}",
    headers: { Accept: "application/json" },
  },
  respondSupplierQuote: {
    method: "POST",
    path: "/api/suppliers/quotes/{{id}}/respond",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  },
  rejectSupplierQuote: {
    method: "POST",
    path: "/api/suppliers/quotes/{{id}}/reject",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  },
  createQuote: {
    method: "POST",
    path: "/api/quotes",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  createQuoteDetail: {
    method: "POST",
    path: "/api/quotes/{{id}}/details",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  browseQuotes: {
    method: "GET",
    path: "/api/quotes",
    headers: {
      Accept: "application/json",
    },
  },
  readQuoteById: {
    method: "GET",
    path: "/api/quotes/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  sendQuote: {
    method: "POST",
    path: "/api/quotes/{{id}}/send",
    headers: {
      Accept: "application/json",
    },
  },
  acceptQuote: {
    method: "POST",
    path: "/api/quotes/{{id}}/accept",
    headers: {
      Accept: "application/json",
    },
  },
  rejectQuote: {
    method: "POST",
    path: "/api/quotes/{{id}}/reject",
    headers: {
      Accept: "application/json",
    },
  },
  expireQuote: {
    method: "POST",
    path: "/api/quotes/{{id}}/expire",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  createClient: {
    method: "POST",
    path: "/api/clients",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  browseClients: {
    method: "GET",
    path: "/api/clients",
    headers: {
      Accept: "application/json",
    },
  },
  readClientById: {
    method: "GET",
    path: "/api/clients/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  updateClient: {
    method: "PUT",
    path: "/api/clients/{{id}}",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  deleteClient: {
    method: "DELETE",
    path: "/api/clients/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  clientHistory: {
    method: "GET",
    path: "/api/clients/{{id}}/history",
    headers: {
      Accept: "application/json",
    },
  },
  clientHistoryPdf: {
    method: "GET",
    path: "/api/clients/{{id}}/history/pdf",
    headers: {
      Accept: "application/pdf",
    },
  },
  createClientContact: {
    method: "POST",
    path: "/api/clients/{{clientId}}/contacts",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  updateClientContact: {
    method: "PUT",
    path: "/api/clients/{{clientId}}/contacts/{{contactId}}",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  deleteClientContact: {
    method: "DELETE",
    path: "/api/clients/{{clientId}}/contacts/{{contactId}}",
    headers: {
      Accept: "application/json",
    },
  },
  setPrimaryClientContact: {
    method: "PUT",
    path: "/api/clients/{{clientId}}/contacts/{{contactId}}/primary",
    headers: {
      Accept: "application/json",
    },
  },
  addClientAttachment: {
    method: "POST",
    path: "/api/clients/{{clientId}}/attachments",
    headers: {
      Accept: "application/json",
    },
  },
  deleteClientAttachment: {
    method: "DELETE",
    path: "/api/clients/{{clientId}}/attachments/{{attachmentId}}",
    headers: {
      Accept: "application/json",
    },
  },
  addClientAddress: {
    method: "POST",
    path: "/api/clients/{{clientId}}/addresses",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  updateClientAddress: {
    method: "PUT",
    path: "/api/clients/{{clientId}}/addresses/{{addressId}}",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  deleteClientAddress: {
    method: "DELETE",
    path: "/api/clients/{{clientId}}/addresses/{{addressId}}",
    headers: {
      Accept: "application/json",
    },
  },
  setPrimaryClientAddress: {
    method: "PUT",
    path: "/api/clients/{{clientId}}/addresses/{{addressId}}/primary",
    headers: {
      Accept: "application/json",
    },
  },
  createSalesOrder: {
    method: "POST",
    path: "/api/sales-orders",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  browseSalesOrders: {
    method: "GET",
    path: "/api/sales-orders",
    headers: {
      Accept: "application/json",
    },
  },
  readSalesOrderById: {
    method: "GET",
    path: "/api/sales-orders/{{id}}",
    headers: {
      Accept: "application/json",
    },
  },
  createSalesOrderFromQuote: {
    method: "POST",
    path: "/api/sales-orders/from-quote/{{quoteId}}",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  confirmSalesOrder: {
    method: "POST",
    path: "/api/sales-orders/{{id}}/confirm",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
};
