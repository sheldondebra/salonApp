"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Scissors, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createApiClient, ApiError } from "@/lib/api/client";
import type { MarketplaceSearchResponse } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";

export function PublicMarketplaceServicesView() {
  const [service, setService] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [results, setResults] = useState<MarketplaceSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (nextService?: string) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      const serviceValue = nextService ?? service;
      if (serviceValue.trim()) query.set("service", serviceValue);
      if (priceMax.trim()) query.set("price_max", String(Math.round(Number(priceMax) * 100)));
      const result = await createApiClient().get<MarketplaceSearchResponse>(
        `/marketplace/search/services${query.toString() ? `?${query}` : ""}`
      );
      setResults(result);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load service search");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [priceMax, service]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-surface via-background to-secondary/20">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div className="space-y-4 text-center">
          <Badge variant="outline" className="mx-auto w-fit rounded-full px-4 py-1">
            Service search
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Search by service</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Start with the treatment you need, then filter by price, availability, and salon fit.
          </p>
        </div>

        <Card className="rounded-3xl border-border/60 shadow-soft">
          <CardContent className="grid gap-3 p-6 md:grid-cols-[1.2fr_0.8fr_auto]">
            <div>
              <label className="mb-2 block text-sm font-medium">Service</label>
              <Input
                value={service}
                onChange={(event) => setService(event.target.value)}
                placeholder="Braids, gel manicure, balayage..."
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Max price (optional)</label>
              <Input
                value={priceMax}
                onChange={(event) => setPriceMax(event.target.value)}
                placeholder="250"
                type="number"
                min={0}
              />
            </div>
            <Button className="rounded-xl md:self-end" onClick={() => void load()}>
              <Search className="mr-2 h-4 w-4" />
              Search services
            </Button>
          </CardContent>
        </Card>

        {results?.popular_services?.length ? (
          <div className="flex flex-wrap justify-center gap-2">
            {results.popular_services.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setService(item);
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
                    <CardDescription>{item.headline ?? "Marketplace listing"}</CardDescription>
                  </div>
                  {item.available_today ? <Badge variant="success">Today</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Scissors className="h-4 w-4" />
                  {item.service_tags.slice(0, 3).join(", ") || "Service details coming soon"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.service_tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <p>
                    {typeof item.lowest_price_cents === "number"
                      ? `From ${formatMoney(item.lowest_price_cents, item.currency ?? "GHS")}`
                      : "Pricing unavailable"}
                  </p>
                  <p>
                    {item.rating ? `${item.rating.toFixed(1)} stars` : "New listing"} · {item.review_count} reviews
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="flex-1 rounded-xl">
                    <Link href={`/${item.slug}/book`}>Book now</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href="/marketplace">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Nearby
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && (results?.results.length ?? 0) === 0 ? (
          <Card className="rounded-3xl border-dashed border-border/80 shadow-soft">
            <CardContent className="p-10 text-center">
              <p className="text-lg font-semibold">No salons matched that service yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a broader treatment term or remove the max price filter.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
