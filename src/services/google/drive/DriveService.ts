import { gasClient } from '../GASClient';
import { config } from '@/config';

export interface UploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  downloadUrl: string;
}

class DriveService {
  async uploadPDF(fileBase64: string, fileName: string): Promise<UploadResult> {
    return gasClient.post<UploadResult>('uploadFile', {
      fileBase64,
      fileName,
      mimeType: 'application/pdf',
      folderId: config.google.drive.pdfFolderId,
    });
  }

  async uploadExcel(fileBase64: string, fileName: string): Promise<UploadResult> {
    return gasClient.post<UploadResult>('uploadFile', {
      fileBase64,
      fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      folderId: config.google.drive.excelFolderId,
    });
  }

  async uploadPDFBatch(
    files: Array<{ base64: string; name: string }>,
  ): Promise<PromiseSettledResult<UploadResult>[]> {
    return Promise.allSettled(
      files.map(({ base64, name }) => this.uploadPDF(base64, name)),
    );
  }

  async getFileUrl(fileId: string): Promise<string> {
    const result = await gasClient.get<{ url: string }>('getFileUrl', { fileId });
    return result.url;
  }
}

export const driveService = new DriveService();
