import type { GASResponse } from '@/types';
import { config } from '@/config';

export class GASClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'GASClientError';
  }
}

class GASClient {
  private get baseUrl(): string {
    return config.gas.webAppUrl;
  }

  private get secret(): string {
    return config.gas.apiSecret;
  }

  get isConfigured(): boolean {
    return this.baseUrl.length > 0;
  }

  async post<T>(action: string, payload?: Record<string, unknown>): Promise<T> {
    return this.request<T>(action, 'POST', payload);
  }

  async get<T>(action: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(action, 'GET', undefined, params);
  }

  private async request<T>(
    action: string,
    method: 'GET' | 'POST',
    payload?: Record<string, unknown>,
    params?: Record<string, string>,
  ): Promise<T> {
    if (!this.isConfigured) {
      throw new GASClientError('NOT_CONFIGURED', 'GAS Web App URL is not configured');
    }

    const url = method === 'GET'
      ? this.buildUrl(action, params)
      : this.baseUrl;

    const body = method === 'POST'
      ? JSON.stringify({ action, secret: this.secret, ...payload })
      : undefined;

    let lastErr: Error | null = null;

    for (let attempt = 1; attempt <= config.ai.ocr.maxRetries; attempt++) {
      try {
        const res = await fetch(url, {
          method,
          // text/plain avoids CORS preflight (GAS doesn't handle OPTIONS)
          headers: method === 'POST' ? { 'Content-Type': 'text/plain' } : {},
          body,
        });

        if (!res.ok) {
          throw new GASClientError(
            'HTTP_ERROR',
            `GAS responded ${res.status} ${res.statusText}`,
          );
        }

        const json = (await res.json()) as GASResponse<T>;

        if (json.status === 'error') {
          throw new GASClientError('GAS_ERROR', json.error ?? 'Unknown GAS error', json);
        }

        return json.data as T;
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        if (attempt < config.ai.ocr.maxRetries) {
          await new Promise((r) => setTimeout(r, attempt * 1000));
        }
      }
    }

    throw lastErr ?? new GASClientError('UNKNOWN', 'GAS request failed after retries');
  }

  private buildUrl(action: string, params?: Record<string, string>): string {
    const url = new URL(this.baseUrl);
    url.searchParams.set('action', action);
    url.searchParams.set('secret', this.secret);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    return url.toString();
  }
}

export const gasClient = new GASClient();
