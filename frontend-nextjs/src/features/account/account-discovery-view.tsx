"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Heart, Scissors, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { AccountDiscoveryFeed, AccountDiscoveryItem } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";

type AccountDiscoveryViewProps = {
  tenantSlug: string;
};

function DiscoverySection({
  tenantSlug,
  title,
  description,
  items,
  onToggleFavorite,
}: {
  tenantSlug: string;
  title: string;
  description: string;
  items: AccountDiscoveryItem[];
  onToggleFavorite: (item: AccountDiscoveryItem) => void;
}) {
  return (
    <Card className="rounded-2xl shadow-soft">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No suggestions available right now.</p>
        ) : (
          items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="rounded-2xl border border-border/60 bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold">{item.name}</p>
                  {item.subtitle ? (
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  ) : null}
                </div>
                <Button variant="ghost" size="sm" onClick={() => onToggleFavorite(item)}>
                  <Heart
                    className={`h-4 w-4 ${item.is_favorite ? "fill-primary text-primary" : ""}`}
                  />
                </Button>
              </div>
              {item.description ? (
                <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {typeof item.duration_minutes === "number" ? (
                  <span>{item.duration_minutes} min</span>
                ) : null}
                {typeof item.price_cents === "number" ? (
                  <span>{formatMoney(item.price_cents)}</span>
                ) : null}
                {typeof item.rating === "number" ? <span>{item.rating.toFixed(1)} stars</span> : null}
              </div>
              <Button className="mt-4 w-full rounded-xl" variant="outline" asChild>
                <Link href={item.href.startsWith("/") ? item.href : `/${tenantSlug}${item.href}`}>
                  Open
                </Link>
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function AccountDiscoveryView({ tenantSlug }: AccountDiscoveryViewProps) {
  const [feed, setFeed] = useState<AccountDiscoveryFeed | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<AccountDiscoveryFeed>(
        `/${tenantSlug}/account/discovery`
      );
      setFeed(result);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load discovery feed");
      setFeed(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleFavorite(item: AccountDiscoveryItem) {
    const path = `/${tenantSlug}/account/favorites`;
    try {
      const client = createApiClient(getApiClientOptions());
      if (item.is_favorite) {
        await client.delete(`/${tenantSlug}/account/favorites/${item.type}/${item.id}`);
        toast.success("Removed from favorites");
      } else {
        await client.post(path, { type: item.type, id: item.id });
        toast.success("Added to favorites");
      }
      await load();
    } catch {
      toast.error("Could not update favorites");
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading discovery suggestions...</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            Discover your next favorite
          </CardTitle>
          <CardDescription>
            Personalized suggestions based on your favorites and recent bookings.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Favorites saved</p>
            <p className="mt-2 text-2xl font-semibold">{feed?.favorites_count ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Recommended picks</p>
            <p className="mt-2 text-2xl font-semibold">{feed?.recommended.length ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Trending right now</p>
            <p className="mt-2 text-2xl font-semibold">{feed?.trending.length ?? 0}</p>
          </div>
        </CardContent>
      </Card>

      <DiscoverySection
        tenantSlug={tenantSlug}
        title="Recommended for you"
        description="Services and team members that match your booking habits."
        items={feed?.recommended ?? []}
        onToggleFavorite={toggleFavorite}
      />

      <DiscoverySection
        tenantSlug={tenantSlug}
        title="Trending in this salon"
        description="Popular picks from clients like you."
        items={feed?.trending ?? []}
        onToggleFavorite={toggleFavorite}
      />

      <DiscoverySection
        tenantSlug={tenantSlug}
        title="Book again"
        description="Quick access to services and staff you used recently."
        items={feed?.recently_booked ?? []}
        onToggleFavorite={toggleFavorite}
      />

      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Scissors className="h-4 w-4 text-primary" />
          Smart discovery
        </div>
        <p className="mt-2">
          Use discovery to keep favorite services close while still surfacing new staff, treatments,
          and retail ideas as the salon catalog changes.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 text-primary">
          <TrendingUp className="h-4 w-4" />
          Recommendations update automatically from your activity.
        </div>
      </div>
    </div>
  );
}
