"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { OnboardingProgress } from "@/features/onboarding/types";

type OnboardingRow = {
  type: string;
  user_name: string;
  user_email: string;
  tenant_name: string | null;
  tenant_slug: string | null;
  business_type_label?: string | null;
  onboarding_status: string | null;
  progress: OnboardingProgress;
};

export default function AdminOnboardingPage() {
  const [rows, setRows] = useState<OnboardingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<{ data: OnboardingRow[] }>("/admin/onboarding")
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      title="Tenant onboarding"
      description="Track setup progress for every salon signup and workspace"
    >
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Onboarding funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No onboarding activity yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Salon</TableHead>
                  <TableHead>Business type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Current step</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={`${row.user_email}-${i}`}>
                    <TableCell>
                      <div className="font-medium">{row.user_name}</div>
                      <div className="text-xs text-muted-foreground">{row.user_email}</div>
                    </TableCell>
                    <TableCell>
                      {row.tenant_name ? (
                        <>
                          <div className="font-medium">{row.tenant_name}</div>
                          <div className="text-xs text-muted-foreground">/{row.tenant_slug}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Not created yet</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.business_type_label ?? row.progress.business_type_label ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.onboarding_status ?? row.type}</Badge>
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      <div className="mb-1 text-xs text-muted-foreground">{row.progress.percent}%</div>
                      <Progress value={row.progress.percent} />
                    </TableCell>
                    <TableCell className="capitalize text-sm">
                      {row.progress.current_step?.replace("_", " ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}

