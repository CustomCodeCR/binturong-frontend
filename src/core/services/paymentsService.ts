import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  Payment,
  PaymentsBrowseQuery,
  RegisterPaymentCashRequest,
  RegisterPaymentCashResponse,
  RegisterPaymentTransferRequest,
  RegisterPaymentTransferResponse,
  RegisterPaymentCardRequest,
  RegisterPaymentCardResponse,
  RegisterPartialPaymentRequest,
  RegisterPartialPaymentResponse,
  ReportPaymentQuery,
} from "@/core/interfaces/payments";

export const PaymentsService = {
  // -------------------------
  // Register Payment Cash
  // -------------------------
  registerPaymentCash(
    payload: RegisterPaymentCashRequest,
  ): Promise<RegisterPaymentCashResponse> {
    return callEndpoint<
      RegisterPaymentCashResponse,
      RegisterPaymentCashRequest
    >(Endpoints.registerPaymentCash, { body: payload });
  },

  // -------------------------
  // Register Payment Transfer
  // -------------------------
  registerPaymentTransfer(
    payload: RegisterPaymentTransferRequest,
  ): Promise<RegisterPaymentTransferResponse> {
    return callEndpoint<
      RegisterPaymentTransferResponse,
      RegisterPaymentTransferRequest
    >(Endpoints.registerPaymentTransfer, { body: payload });
  },

  // -------------------------
  // Register Payment Card
  // -------------------------
  registerPaymentCard(
    payload: RegisterPaymentCardRequest,
  ): Promise<RegisterPaymentCardResponse> {
    return callEndpoint<
      RegisterPaymentCardResponse,
      RegisterPaymentCardRequest
    >(Endpoints.registerPaymentCard, { body: payload });
  },

  // -------------------------
  // Register Partial Payment
  // -------------------------
  registerPartialPayment(
    payload: RegisterPartialPaymentRequest,
  ): Promise<RegisterPartialPaymentResponse> {
    return callEndpoint<
      RegisterPartialPaymentResponse,
      RegisterPartialPaymentRequest
    >(Endpoints.registerPartialPayment, { body: payload });
  },

  // -------------------------
  // Get Payments
  // -------------------------
  getPayments(query?: PaymentsBrowseQuery): Promise<Payment[]> {
    const endpointWithQuery =
      Endpoints.getPayments.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Payment[]>({
      ...Endpoints.getPayments,
      path: endpointWithQuery,
    });
  },

  // -------------------------
  // Get Payment By Id
  // -------------------------
  getPaymentById(id: string): Promise<Payment> {
    return callEndpoint<Payment>(Endpoints.getPaymentById, { params: { id } });
  },

  // -------------------------
  // Report Payment PDF (Blob)
  // -------------------------
  reportPaymentPdf(query?: ReportPaymentQuery): Promise<Blob> {
    const endpointWithQuery =
      Endpoints.reportPaymentPdf.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    // ⚠️ Requiere que fetchClient soporte responseType "blob" (ver fix mínimo abajo)
    return callEndpoint<Blob>({
      ...Endpoints.reportPaymentPdf,
      path: endpointWithQuery,
      // extraHeaders opcional si querés forzar accept
      // extraHeaders: { Accept: "application/pdf" },
    });
  },

  // -------------------------
  // Report Payment Excel (Blob)
  // -------------------------
  reportPaymentExcel(query?: ReportPaymentQuery): Promise<Blob> {
    const endpointWithQuery =
      Endpoints.reportPaymentExcel.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    // ⚠️ Requiere que fetchClient soporte responseType "blob" (ver fix mínimo abajo)
    return callEndpoint<Blob>({
      ...Endpoints.reportPaymentExcel,
      path: endpointWithQuery,
    });
  },
};
