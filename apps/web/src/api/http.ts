import { apiErrorSchema, type ApiError } from '@hero-factory/contracts';
import { z, type ZodType } from 'zod';

const DEFAULT_API_URL = 'http://localhost:3333';
const runtimeEnv: unknown = import.meta.env;

function getApiBaseUrl(): string {
  const configuredUrl =
    typeof runtimeEnv === 'object' &&
    runtimeEnv !== null &&
    'VITE_API_URL' in runtimeEnv &&
    typeof runtimeEnv.VITE_API_URL === 'string'
      ? runtimeEnv.VITE_API_URL.trim()
      : '';

  return configuredUrl || DEFAULT_API_URL;
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly fields: ApiError['error']['fields'] | undefined;
  readonly status: number;

  constructor(
    message: string,
    options: {
      status: number;
      code: string;
      fields?: ApiError['error']['fields'];
    },
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code;
    this.fields = options.fields;
  }
}

export function buildApiUrl(path: string, baseUrl = getApiBaseUrl()) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const pathWithoutDuplicatePrefix =
    normalizedBaseUrl.endsWith('/api') &&
    (normalizedPath === '/api' || normalizedPath.startsWith('/api/'))
      ? normalizedPath.slice(4) || '/'
      : normalizedPath;

  return `${normalizedBaseUrl}${pathWithoutDuplicatePrefix}`;
}

async function readBody(response: Response): Promise<unknown> {
  const body = await response.text();

  if (!body) return null;

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

export async function apiRequest<T>(
  path: string,
  schema: ZodType<T>,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), { ...init, headers });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;

    throw new ApiClientError('Não foi possível conectar à API. Tente novamente.', {
      status: 0,
      code: 'NETWORK_ERROR',
    });
  }

  const body = await readBody(response);

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(body);

    if (parsedError.success) {
      throw new ApiClientError(parsedError.data.error.message, {
        status: response.status,
        code: parsedError.data.error.code,
        fields: parsedError.data.error.fields,
      });
    }

    throw new ApiClientError('A API não conseguiu concluir a solicitação.', {
      status: response.status,
      code: 'UNEXPECTED_API_ERROR',
    });
  }

  const parsedBody = schema.safeParse(body);

  if (!parsedBody.success) {
    throw new ApiClientError('A API retornou uma resposta em formato inesperado.', {
      status: 502,
      code: 'INVALID_API_RESPONSE',
    });
  }

  return parsedBody.data;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof z.ZodError) return 'Alguns dados recebidos são inválidos.';
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
