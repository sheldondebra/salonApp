"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/pricing/format-money";

type FailureRow = {
  id: number;
  provider: string;
  provider_reference: string | null;
  purpose: string;
  amount_cents: number;
  currency: string;
  failure_reason: string;
  created_at: string;
  tenant?: { slug: string; name: string } | null;
  user?: { name: string; email: string } | null;
};

export default function AdminPaymentFailuresPage() {
  const [failures, setFailures] = useState<FailureRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<{ data: FailureRow[] }>("/admin/payments/failures")
      .then((res) => {
        const raw = res as { data?: FailureRow[] };
        setFailures(Array.isArray(raw.data) ? raw.data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell title="Payment failures" description="Failed charges and verification errors">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Failure log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : failures.length === 0 ? (
            <p className="text-sm text-muted-foreground">No failed payments logged.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">When</th>
                    <th className="pb-2 pr-4">Tenant</th>
                    <th className="pb-2 pr-4">Gateway</th>
                    <th className="pb-2 pr-4">Purpose</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {failures.map((row) => (
                    <tr key={row.id} className="border-b border-border/40">
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {format(new Date(row.created_at), "MMM d, yyyy · HH:mm")}
                      </td>
                      <td className="py-3 pr-4">{row.tenant?.name ?? "—"}</td>
                      <td className="py-3 pr-4 capitalize">{row.provider}</td>
                      <td className="py-3 pr-4 capitalize">{row.purpose}</td>
                      <td className="py-3 pr-4">
                        {formatMoney(row.amount_cents, row.currency)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{row.failure_reason}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
