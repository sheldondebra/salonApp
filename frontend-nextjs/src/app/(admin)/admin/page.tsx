"use client";

import { Suspense, useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import Link from "next/link";
import { Building2, CreditCard, Sparkles, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Tenant } from "@/lib/api/types";

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

type UnpaidUser = {
  id: number;
  name: string;
  email: string;
  selected_plan: string | null;
  onboarding_status: string;
  created_at: string;
  latest_subscription?: { status: string; provider_reference: string | null };
};

function AdminPageContent() {
  useRequireAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [unpaid, setUnpaid] = useState<UnpaidUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tenants" | "payments" | "unpaid">("tenants");

  useEffect(() => {
    const client = createApiClient(getApiClientOptions());
    Promise.all([
      client.get<{ data: Tenant[] }>("/admin/tenants").catch(() => ({ data: [] })),
      client.get<{ data: PaymentRow[] }>("/admin/payments").catch(() => ({ data: [] })),
      client.get<{ data: UnpaidUser[] }>("/admin/signups/unpaid").catch(() => ({ data: [] })),
    ])
      .then(([t, p, u]) => {
        setTenants(Array.isArray(t.data) ? t.data : []);
        setPayments(Array.isArray(p.data) ? p.data : []);
        setUnpaid(Array.isArray(u.data) ? u.data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-accent" />
            SalonApp Admin
          </Link>
          <Button variant="outline" asChild>
            <Link href="/login">Account</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
        <div>
          <Badge className="mb-3">Super Admin · Office Admin</Badge>
          <h1 className="text-3xl font-semibold">Platform operations</h1>
          <p className="mt-1 text-muted-foreground">Tenants, payments, and unpaid salon signups</p>
        </div>

        <div className="flex gap-2 border-b border-border pb-4">
          {(["tenants", "payments", "unpaid"] as const).map((t) => (
            <Button key={t} variant={tab === t ? "default" : "ghost"} size="sm" onClick={() => setTab(t)}>
              {t === "tenants" ? "Tenants" : t === "payments" ? "Payments" : "Unpaid signups"}
            </Button>
          ))}
        </div>

        {tab === "tenants" ? (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-accent" />
                  All tenants
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-48 w-full rounded-xl" />
                ) : tenants.length === 0 ? (
                  <EmptyState
                    icon={Building2}
                    title="No tenants loaded"
                    description="Sign in as admin@salonapp.com and ensure the API is running."
                    actionLabel="Sign in"
                    onAction={() => (window.location.href = "/login")}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenants.map((tenant) => (
                        <TableRow key={tenant.uuid}>
                          <TableCell className="font-medium">{tenant.name}</TableCell>
                          <TableCell>{tenant.slug}</TableCell>
                          <TableCell>{tenant.plan}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{tenant.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
        ) : null}

        {tab === "payments" ? (
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
                            ${(p.final_amount_cents / 100).toFixed(2)} {p.currency}
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
        ) : null}

        {tab === "unpaid" ? (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-accent" />
                  Signups without payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-48 w-full" />
                ) : unpaid.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending salon signups.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unpaid.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.selected_plan ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{u.onboarding_status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
        ) : null}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AdminPageContent />
    </Suspense>
  );
}
