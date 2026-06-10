import { apiConnectionHint, env } from "@/config/env";

export type MobileApiConfig = {
  token?: string;
  tenantId?: string | number;
  tenantSlug?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildHeaders(config: MobileApiConfig = {}): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-BeautyOS-Client": "mobile",
  };

  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }
  if (config.tenantId) {
    headers["X-Tenant-Id"] = String(config.tenantId);
  }
  if (config.tenantSlug) {
    headers["X-Tenant-Slug"] = config.tenantSlug;
  }

  return headers;
}

function formatErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    if (typeof p.message === "string") return p.message;
    if (p.errors && typeof p.errors === "object") {
      const first = Object.values(p.errors as Record<string, string[]>)[0];
      if (Array.isArray(first) && first[0]) return first[0];
    }
  }
  return status === 0 ? "Cannot reach the API. Check EXPO_PUBLIC_API_URL." : `Request failed (${status})`;
}

async function request<T>(path: string, config: MobileApiConfig, init?: RequestInit): Promise<T> {
  const url = `${env.apiUrl}/api/v1${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { ...buildHeaders(config), ...(init?.headers as Record<string, string>) },
    });
  } catch (cause) {
    const hint = apiConnectionHint();
    const detail = cause instanceof Error ? cause.message : "";
    throw new ApiError(
      `Cannot reach ${env.apiUrl}. ${hint}${detail ? ` (${detail})` : ""}`,
      0
    );
  }

  const text = await response.text();
  let payload: unknown = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    if (!response.ok) {
      throw new ApiError(`Invalid API response (${response.status})`, response.status);
    }
  }

  if (!response.ok) {
    throw new ApiError(formatErrorMessage(payload, response.status), response.status, payload);
  }

  return payload as T;
}

export function createApiClient(config: MobileApiConfig = {}) {
  return {
    get: <T>(path: string) => request<T>(path, config, { method: "GET" }),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, config, {
        method: "POST",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, config, {
        method: "PATCH",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
    put: <T>(path: string, body?: unknown) =>
      request<T>(path, config, {
        method: "PUT",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
    delete: <T>(path: string) => request<T>(path, config, { method: "DELETE" }),
  };
}

export async function checkApiHealth(): Promise<{ status: string; service: string }> {
  const res = await createApiClient().get<{ status: string; service: string }>("/health");
  return res;
}
