"use client";

import { useEffect, useState } from "react";
import { createApiClient } from "@/lib/api/client";
import { bookingApiBase, tenantApiBase } from "@/lib/api/tenant-path";
import type { PortfolioGalleryItem } from "@/features/onboarding/types";
import type { Location, Service, StaffMember, Tenant, TenantBookingConfig } from "@/lib/api/types";
import { getApiClientOptions } from "@/lib/auth/session";

type TenantContextResponse = {
  tenant: Tenant;
  resolution?: string;
  booking?: TenantBookingConfig;
  portfolio_gallery?: PortfolioGalleryItem[] | { data: PortfolioGalleryItem[] };
};

export function usePublicBooking(slug?: string | null) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [booking, setBooking] = useState<TenantBookingConfig | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioGalleryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const client = createApiClient(getApiClientOptions(undefined, slug ?? undefined));
    const bookBase = bookingApiBase(slug);

    setLoading(true);
    Promise.all([
      client.get<TenantContextResponse>(`${tenantApiBase(slug)}/context`),
      client.get<{ data: Service[] }>(`${bookBase}/services`).catch(() => ({ data: [] })),
      client.get<{ data: StaffMember[] }>(`${bookBase}/staff`).catch(() => ({ data: [] })),
      client.get<{ data: Location[] }>(`${bookBase}/locations`).catch(() => ({ data: [] })),
    ])
      .then(([ctx, svc, st, loc]) => {
        if (cancelled) return;
        setTenant(ctx.tenant);
        setBooking(ctx.booking ?? null);
        const gal = ctx.portfolio_gallery;
        setPortfolio(
          Array.isArray(gal) ? gal : Array.isArray(gal?.data) ? gal.data : []
        );
        setServices(Array.isArray(svc.data) ? svc.data : []);
        setStaff(Array.isArray(st.data) ? st.data : []);
        setLocations(Array.isArray(loc.data) ? loc.data : []);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load booking page");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { tenant, booking, portfolio, locations, services, staff, loading, error };
}
