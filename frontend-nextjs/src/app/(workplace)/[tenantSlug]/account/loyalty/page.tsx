"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Gift } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

type LoyaltyResponse = {
  wallet: { points_balance: number; lifetime_points: number };
  transactions: {
    id: number;
    points: number;
    type: string;
    description: string | null;
    created_at: string | null;
  }[];
};

export default function AccountLoyaltyPage({ params }: { params: { tenantSlug: string } }) {
  const [data, setData] = useState<LoyaltyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<LoyaltyResponse>(`/${params.tenantSlug}/account/loyalty`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.tenantSlug]);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/20 via-card to-accent/10 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent" />
            Loyalty points
          </CardTitle>
          <CardDescription>Earn points on every completed appointment.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-4xl font-semibold tabular-nums">{data?.wallet.points_balance ?? 0}</p>
                <p className="text-sm text-muted-foreground">Available points</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{data?.wallet.lifetime_points ?? 0}</p>
                <p className="text-sm text-muted-foreground">Lifetime earned</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !data?.transactions.length ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            data.transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{t.description ?? t.type}</p>
                  {t.created_at ? (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(t.created_at), "MMM d, yyyy")}
                    </p>
                  ) : null}
                </div>
                <span className={t.points >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-destructive"}>
                  {t.points >= 0 ? "+" : ""}
                  {t.points}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
