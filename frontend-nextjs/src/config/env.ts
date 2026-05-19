/**
 * API base URL for browser requests.
 * In the browser we always use the current origin so /api/v1/* is proxied by Next.js
 * (see next.config.mjs) — avoids CORS and credentials issues with localhost:8000.
 */
function resolveApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (typeof window !== "undefined") {
    if (configured) {
      try {
        const apiHost = new URL(configured).host;
        if (apiHost === window.location.host) {
          return configured.replace(/\/$/, "");
        }
      } catch {
        // invalid URL — fall through to same-origin
      }
    }
    return window.location.origin;
  }

  return configured?.replace(/\/$/, "") ?? "";
}

export const env = {
  get apiUrl() {
    return resolveApiUrl();
  },
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  workplaceHost: process.env.NEXT_PUBLIC_WORKPLACE_HOST ?? "workplace.localhost:3000",
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost",
} as const;
