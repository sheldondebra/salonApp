"use client";

import { useEffect, useState } from "react";
import { Heart, Scissors, User } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

type FavoriteService = { id: number; name: string; duration_minutes: number; price_cents: number };
type FavoriteStaff = { id: number; display_name: string; title: string | null };

type FavoritesResponse = {
  services: FavoriteService[];
  staff: FavoriteStaff[];
};

export default function AccountFavoritesPage({ params }: { params: { tenantSlug: string } }) {
  const [services, setServices] = useState<FavoriteService[]>([]);
  const [staff, setStaff] = useState<FavoriteStaff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    createApiClient(getApiClientOptions())
      .get<FavoritesResponse>(`/${params.tenantSlug}/account/favorites`)
      .then((res) => {
        if (!cancelled) {
          setServices(res.services ?? []);
          setStaff(res.staff ?? []);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.tenantSlug]);

  async function reload() {
    const res = await createApiClient(getApiClientOptions()).get<FavoritesResponse>(
      `/${params.tenantSlug}/account/favorites`
    );
    setServices(res.services ?? []);
    setStaff(res.staff ?? []);
  }

  async function remove(type: "service" | "staff", id: number) {
    try {
      await createApiClient(getApiClientOptions()).delete(
        `/${params.tenantSlug}/account/favorites/${type}/${id}`
      );
      toast.success("Removed from favorites");
      await reload();
    } catch {
      toast.error("Could not remove favorite");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-accent" />
            Favorite services
          </CardTitle>
          <CardDescription>Quick access when you book your next visit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No favorite services yet.</p>
          ) : (
            services.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.duration_minutes} min · ${(s.price_cents / 100).toFixed(2)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove("service", s.id)}>
                  Remove
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-accent" />
            Favorite stylists
          </CardTitle>
          <CardDescription>Your preferred team members.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : staff.length === 0 ? (
            <p className="text-sm text-muted-foreground">No favorite stylists yet.</p>
          ) : (
            staff.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">{m.display_name}</p>
                    {m.title ? <p className="text-xs text-muted-foreground">{m.title}</p> : null}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove("staff", m.id)}>
                  Remove
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
