import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveTenantFromHost } from "@/lib/tenant/resolve-tenant";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "localhost";
  const { pathname } = request.nextUrl;
  const resolution = resolveTenantFromHost(host, pathname);

  const response = NextResponse.next();
  response.headers.set("x-portal", resolution.portal);

  if (resolution.tenantSlug) {
    response.headers.set("x-tenant-slug", resolution.tenantSlug);
  }

  // Custom CNAME: serve branded public booking at site root
  if (resolution.portal === "custom_domain" && (pathname === "/" || pathname === "")) {
    const url = request.nextUrl.clone();
    url.pathname = "/book-custom";
    return NextResponse.rewrite(url, {
      headers: response.headers,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
