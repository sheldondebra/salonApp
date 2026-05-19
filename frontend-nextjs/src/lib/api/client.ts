import { env } from "@/config/env";

export type ApiClientOptions = {
  token?: string;
  tenantId?: string | number;
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

export class ApiClient {
  constructor(private readonly options: ApiClientOptions = {}) {}

  private headers(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (this.options.token) {
      headers.Authorization = `Bearer ${this.options.token}`;
    }

    if (this.options.tenantId) {
      headers["X-Tenant-Id"] = String(this.options.tenantId);
    }

    return headers;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = env.apiUrl ? `${env.apiUrl}/api/v1${path}` : `/api/v1${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers: { ...this.headers(), ...(init?.headers as Record<string, string>) },
        credentials: "omit",
        cache: "no-store",
      });
    } catch {
      throw new ApiError(
        "Cannot reach the API. Start the backend: cd backend-laravel && php artisan serve",
        0
      );
    }

    const text = await response.text();
    let payload: unknown = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      if (!response.ok) {
        throw new ApiError(
          `API error: ${response.status}. Is Laravel running? (php artisan serve)`,
          response.status
        );
      }
      throw new ApiError(
        "Invalid response from API. Restart the backend with: php artisan serve",
        response.status
      );
    }

    if (!response.ok) {
      const message = formatApiErrorMessage(payload, response.status);
      throw new ApiError(message, response.status, payload);
    }

    return payload as T;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
}

function formatApiErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "object" && payload) {
    const errors = (payload as { errors?: Record<string, string[]> }).errors;
    if (errors) {
      const first = Object.values(errors).flat()[0];
      if (first) return first;
    }
    if ("message" in payload && typeof (payload as { message: unknown }).message === "string") {
      const msg = (payload as { message: string }).message;
      if (msg !== "The given data was invalid.") return msg;
    }
  }
  return `API error: ${status}`;
}

export function createApiClient(options?: ApiClientOptions) {
  return new ApiClient(options);
}
