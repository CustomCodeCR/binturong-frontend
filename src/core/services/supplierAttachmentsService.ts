import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import type { SupplierAttachmentCreateResponse } from "@/core/interfaces/suppliers";

type NoContent = Record<string, never>;

export const SupplierAttachmentsService = {
  add(
    supplierId: string,
    file: File,
    documentType: string,
  ): Promise<SupplierAttachmentCreateResponse> {
    const form = new FormData();
    form.append("file", file);
    form.append("documentType", documentType);

    return callEndpoint<SupplierAttachmentCreateResponse>(
      Endpoints.addSupplierAttachment,
      {
        params: { supplierId },
        body: form,
        isFormData: true,
      },
    );
  },

  remove(supplierId: string, attachmentId: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.removeSupplierAttachment, {
      params: { supplierId, attachmentId },
    });
  },
};
