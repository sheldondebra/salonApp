"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/pricing/format-money";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

type PaymentRow = {
  id: number;
  plan_id: string;
  status: string;
  final_amount_cents: number;
  currency: string;
  provider: string | null;
  paid_at: string | null;
  user?: { name: string; email: string };
  invoice?: { invoice_number: string };
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<{ data: PaymentRow[] }>("/admin/payments")
      .then((res) => {
        const raw = res as { data?: PaymentRow[] };
        setPayments(Array.isArray(raw.data) ? raw.data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell title="Payments" description="Platform subscription payments and invoices">
      <RequirePlatformPermission permission={Permissions.billing.manage}>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-accent" />
            All payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscription payments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.user?.name}</div>
                      <div className="text-xs text-muted-foreground">{p.user?.email}</div>
                    </TableCell>
                    <TableCell>{p.plan_id}</TableCell>
                    <TableCell>
                      {formatMoney(p.final_amount_cents, p.currency)}
                    </TableCell>
                    <TableCell className="capitalize">{p.provider ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{p.invoice?.invoice_number ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </RequirePlatformPermission>
    </AdminShell>
  );
}
