"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminToolbar } from "@/features/admin/admin-toolbar";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

type DomainRow = {
  id: number;
  domain: string;
  type: string;
  is_primary: boolean;
  verified_at: string | null;
  tenant?: { name: string; slug: string };
};

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = search ? `?q=${encodeURIComponent(search)}` : "";
    createApiClient(getApiClientOptions())
      .get<{ data: DomainRow[] }>(`/admin/domains${params}`)
      .then((res) => setDomains(Array.isArray(res.data) ? res.data : []))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <AdminShell title="Domains" description="Custom domains and CNAME records for tenants">
      <RequirePlatformPermission permission={Permissions.tenants.view}>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent" />
              Tenant domains
            </CardTitle>
            <AdminToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Domain or salon name" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : domains.length === 0 ? (
              <p className="text-sm text-muted-foreground">No domains configured.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Primary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.domain}</TableCell>
                      <TableCell>
                        {d.tenant?.name ?? "—"}
                        <div className="text-xs text-muted-foreground">/{d.tenant?.slug}</div>
                      </TableCell>
                      <TableCell className="capitalize">{d.type}</TableCell>
                      <TableCell>
                        <Badge variant={d.verified_at ? "default" : "outline"}>
                          {d.verified_at ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>{d.is_primary ? "Yes" : "—"}</TableCell>
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
