import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";

import type {
  AttachmentDownloadResponse,
  AttachmentModule,
} from "@/core/interfaces/attachments";

export const AttachmentsService = {
  getDownloadUrl(
    module: AttachmentModule,
    attachmentId: string,
  ): Promise<AttachmentDownloadResponse> {
    return callEndpoint<AttachmentDownloadResponse>(
      Endpoints.downloadAttachment,
      {
        params: {
          module,
          attachmentId,
        },
      },
    );
  },

  async openAttachment(
    module: AttachmentModule,
    attachmentId: string,
  ): Promise<void> {
    const result = await this.getDownloadUrl(module, attachmentId);

    window.open(result.url, "_blank", "noopener,noreferrer");
  },
};
