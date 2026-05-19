import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveTenantFromHost } from "@/lib/tenant/resolve-tenant";

export function middleware(request: NextRequest) {
  const resolution = resolveTenantFromHost(
    request.headers.get("host") ?? "localhost",
    request.nextUrl.pathname,
  );

  const response = NextResponse.next();
  response.headers.set("x-portal", resolution.portal);

  if (resolution.tenantSlug) {
    response.headers.set("x-tenant-slug", resolution.tenantSlug);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
