"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, FolderTree, MapPin, Network } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { BranchGroupOverview } from "@/lib/api/types";

type BranchGroupsViewProps = {
  tenantSlug: string;
};

export function BranchGroupsView({ tenantSlug }: BranchGroupsViewProps) {
  const [overview, setOverview] = useState<BranchGroupOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<BranchGroupOverview>(
        `/${tenantSlug}/branches/groups`
      );
      setOverview(result);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load branch groups");
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Regions" value={String(overview?.summary.regions ?? 0)} icon={MapPin} />
        <MetricCard title="Branch groups" value={String(overview?.summary.groups ?? 0)} icon={FolderTree} />
        <MetricCard title="Covered branches" value={String(overview?.summary.covered_branches ?? 0)} icon={Building2} />
        <MetricCard title="Unassigned" value={String(overview?.summary.unassigned_branches ?? 0)} icon={Network} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Regions</CardTitle>
            <CardDescription>Regional clusters used for approvals, reporting, and leadership scope.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(overview?.regions ?? []).map((region) => (
              <div key={region.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{region.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {region.branch_count} branches{region.manager_name ? ` · ${region.manager_name}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline">Region</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Branch groups</CardTitle>
            <CardDescription>
              Multi-branch groups can roll up commercial performance and approvals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  id: "name",
                  header: "Group",
                  mobilePrimary: true,
                  cell: (row) => (
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.region_name ?? "No region"}</p>
                    </div>
                  ),
                },
                { id: "branch_count", header: "Branches", cell: (row) => row.branch_count },
                {
                  id: "manager_name",
                  header: "Lead",
                  cell: (row) => row.manager_name ?? "Unassigned",
                },
                {
                  id: "is_active",
                  header: "Status",
                  cell: (row) => (
                    <Badge variant={row.is_active ? "success" : "secondary"}>
                      {row.is_active ? "Active" : "Draft"}
                    </Badge>
                  ),
                },
              ]}
              data={overview?.groups ?? []}
              rowKey={(row) => String(row.id)}
              loading={loading}
              emptyIcon={FolderTree}
              emptyTitle="No branch groups"
              emptyDescription="Create branch groups to manage regional reporting and leadership coverage."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
