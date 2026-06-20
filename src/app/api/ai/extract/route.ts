import { type NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/services/ai/AIService';
import type { APIResponse, ExtractionResult } from '@/types';
import type { Invoice } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const courierHint = formData.get('courierHint') as string | null;

    if (!file) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: { code: 'MISSING_FILE', message: 'No file provided' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: { code: 'INVALID_FILE_TYPE', message: 'Only PDF files are accepted' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await aiService.extractFromPDF({
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type,
      courierHint,
    });

    return NextResponse.json<APIResponse<ExtractionResult<Partial<Invoice>[]>>>(
      {
        success: result.success,
        data: result,
        error: result.error ? { code: result.error.code, message: result.error.message } : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: result.success ? 200 : 422 },
    );
  } catch (err) {
    console.error('[/api/ai/extract]', err);
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during extraction',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
