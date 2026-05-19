import { env } from "@/config/env";

export type ApiClientOptions = {
  token?: string;
  tenantId?: string | number;
};

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

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${env.apiUrl}/api/v1${path}`, {
      headers: this.headers(),
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}

export const api = new ApiClient();
