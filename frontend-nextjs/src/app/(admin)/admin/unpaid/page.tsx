"use client";

import { useEffect, useState } from "react";
import { UserX } from "lucide-react";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

type UnpaidUser = {
  id: number;
  name: string;
  email: string;
  selected_plan: string | null;
  onboarding_status: string;
  created_at: string;
};

export default function AdminUnpaidPage() {
  const [unpaid, setUnpaid] = useState<UnpaidUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<{ data: UnpaidUser[] }>("/admin/signups/unpaid")
      .then((res) => setUnpaid(Array.isArray(res.data) ? res.data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell title="Unpaid signups" description="Salon owners who registered but have not completed checkout">
      <RequirePlatformPermission permission={Permissions.billing.manage}>
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
      </RequirePlatformPermission>
    </AdminShell>
  );
}
