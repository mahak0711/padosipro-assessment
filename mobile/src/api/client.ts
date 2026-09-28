import { getApiUrl } from './serverConfig';

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: { field: string; message: string }[];

  constructor(status: number, code: string, message: string, fields?: { field: string; message: string }[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;
  const apiUrl = await getApiUrl();

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      `Could not reach the server at ${apiUrl}. Check your connection, or update the server address from the login screen.`
    );
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // No JSON body (e.g. empty response) — fine for 2xx, but bad for errors.
  }

  if (!response.ok) {
    const error = data?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? 'Something went wrong. Please try again.',
      error?.fields
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { method: 'GET', token }),
  post: <T>(path: string, body?: unknown, token?: string | null) => request<T>(path, { method: 'POST', body, token }),
  put: <T>(path: string, body?: unknown, token?: string | null) => request<T>(path, { method: 'PUT', body, token }),
};
