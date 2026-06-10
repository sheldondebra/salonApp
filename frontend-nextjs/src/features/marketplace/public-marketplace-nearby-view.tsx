"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Compass, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createApiClient, ApiError } from "@/lib/api/client";
import type { MarketplaceSearchResponse } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";

export function PublicMarketplaceNearbyView() {
  const [city, setCity] = useState("");
  const [results, setResults] = useState<MarketplaceSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (nextCity?: string) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if ((nextCity ?? city).trim()) query.set("q", nextCity ?? city);
      const raw = await createApiClient().get<{
        data: Array<{
          tenant_slug?: string;
          business_name?: string;
          headline?: string | null;
          city?: string | null;
          country?: string | null;
          distance_km?: number | null;
          average_rating?: number;
          review_count?: number;
          categories?: string[];
          services?: Array<{ price_cents?: number }>;
        }>;
      }>(`/marketplace/search/nearby${query.toString() ? `?${query}` : ""}`);

      const mapped: MarketplaceSearchResponse = {
        filters: { sort: "relevance", city: nextCity ?? city ?? null },
        results: (raw.data ?? []).map((item, index) => ({
          id: index + 1,
          slug: item.tenant_slug ?? "",
          business_name: item.business_name ?? "Salon",
          headline: item.headline ?? null,
          city: item.city ?? null,
          region: item.country ?? null,
          distance_km: item.distance_km ?? null,
          featured: false,
          rating: item.average_rating ?? null,
          review_count: item.review_count ?? 0,
          lowest_price_cents: item.services?.[0]?.price_cents ?? null,
          currency: "GHS",
          service_tags: item.categories ?? [],
          available_today: true,
          cover_image_url: null,
        })),
      };
      setResults(mapped);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load nearby salons");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/20">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div className="space-y-4 text-center">
          <Badge variant="outline" className="mx-auto w-fit rounded-full px-4 py-1">
            Marketplace
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Find salons near you</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Search Schedelux marketplace by city and compare salons by availability, rating, and
            pricing.
          </p>
        </div>

        <Card className="rounded-3xl border-border/60 shadow-soft">
          <CardContent className="flex flex-col gap-3 p-6 md:flex-row">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">City or area</label>
              <Input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Accra, East Legon, Kumasi..."
              />
            </div>
            <Button className="rounded-xl md:self-end" onClick={() => void load()}>
              <Search className="mr-2 h-4 w-4" />
              Search nearby
            </Button>
          </CardContent>
        </Card>

        {results?.nearby_cities?.length ? (
          <div className="flex flex-wrap justify-center gap-2">
            {results.nearby_cities.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCity(item);
                  void load(item);
                }}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(results?.results ?? []).map((item) => (
            <Card key={item.id} className="rounded-3xl border-border/60 shadow-soft">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{item.business_name}</CardTitle>
                    <CardDescription>{item.headline ?? "Beauty marketplace listing"}</CardDescription>
                  </div>
                  {item.featured ? <Badge variant="success">Featured</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {[item.city, item.region].filter(Boolean).join(", ")}
                  </p>
                  <p>
                    {item.distance_km != null ? `${item.distance_km.toFixed(1)} km away` : "Distance unavailable"}
                  </p>
                  <p>
                    {item.rating ? `${item.rating.toFixed(1)} stars` : "New listing"} · {item.review_count} reviews
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.service_tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {typeof item.lowest_price_cents === "number"
                      ? `From ${formatMoney(item.lowest_price_cents, item.currency ?? "GHS")}`
                      : "Pricing on request"}
                  </span>
                  <span className="font-medium text-primary">
                    {item.available_today ? "Available today" : "Book ahead"}
                  </span>
                </div>
                <Button asChild className="w-full rounded-xl">
                  <Link href={`/${item.slug}/book`}>
                    <Compass className="mr-2 h-4 w-4" />
                    View salon
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && (results?.results.length ?? 0) === 0 ? (
          <Card className="rounded-3xl border-dashed border-border/80 shadow-soft">
            <CardContent className="p-10 text-center">
              <p className="text-lg font-semibold">No salons matched this area yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try another city or switch to service search for broader discovery.
              </p>
              <Button className="mt-6 rounded-xl" variant="outline" asChild>
                <Link href="/marketplace/services">Search by service instead</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
