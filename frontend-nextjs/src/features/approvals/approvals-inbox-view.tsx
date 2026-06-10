"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCheck, Clock3, Inbox, XCircle } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import type { ApprovalRequestRow } from "@/lib/api/types";

type ApprovalsInboxViewProps = {
  tenantSlug: string;
};

export function ApprovalsInboxView({ tenantSlug }: ApprovalsInboxViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canManage = can(Permissions.approvals.manage);

  const [items, setItems] = useState<ApprovalRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingUuid, setActingUuid] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<{
        data: ApprovalRequestRow[];
      }>(`/${tenantSlug}/approvals/inbox?per_page=50`);
      setItems(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load approvals inbox");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pending = items.filter((item) => item.status === "pending");
    return {
      pending: pending.length,
      overdue: pending.filter((item) => {
        if (!item.created_at) return false;
        const created = new Date(item.created_at);
        return created.getTime() < Date.now() - 2 * 24 * 60 * 60 * 1000;
      }).length,
      approved_today: items.filter((item) => {
        if (item.status !== "approved" || !item.reviewed_at) return false;
        return new Date(item.reviewed_at) >= today;
      }).length,
      rejected_today: items.filter((item) => {
        if (item.status !== "rejected" || !item.reviewed_at) return false;
        return new Date(item.reviewed_at) >= today;
      }).length,
    };
  }, [items]);

  async function resolve(uuid: string, action: "approve" | "reject") {
    setActingUuid(uuid);
    try {
      await createApiClient(getApiClientOptions()).post(
        `/${tenantSlug}/approvals/${uuid}/${action}`,
        {}
      );
      toast.success(action === "approve" ? "Request approved" : "Request rejected");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update approval");
    } finally {
      setActingUuid(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Pending" value={String(summary.pending)} icon={Inbox} />
        <MetricCard title="Overdue" value={String(summary.overdue)} icon={Clock3} />
        <MetricCard title="Approved today" value={String(summary.approved_today)} icon={CheckCheck} />
        <MetricCard title="Rejected today" value={String(summary.rejected_today)} icon={XCircle} />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Approvals inbox</CardTitle>
          <CardDescription>
            Central review queue for requests that need a manager or enterprise approver.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                id: "title",
                header: "Request",
                mobilePrimary: true,
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.description ?? row.type}
                      {row.type === "pos_discount" && row.payload?.discount_cents != null
                        ? ` · ${String(row.payload.discount_cents)} off`
                        : ""}
                    </p>
                  </div>
                ),
              },
              {
                id: "requester",
                header: "Requester",
                cell: (row) => row.requested_by?.name ?? "—",
              },
              {
                id: "priority",
                header: "Priority",
                cell: (row) => (
                  <Badge variant={row.is_urgent ? "warning" : "secondary"}>
                    {row.is_urgent ? "high" : "medium"}
                  </Badge>
                ),
              },
              {
                id: "status",
                header: "Status",
                cell: (row) => (
                  <Badge variant={row.status === "approved" ? "success" : "secondary"}>
                    {row.status}
                  </Badge>
                ),
              },
              ...(canManage
                ? [
                    {
                      id: "actions",
                      header: "",
                      cell: (row: ApprovalRequestRow) =>
                        row.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="rounded-lg h-8"
                              disabled={actingUuid === row.uuid}
                              onClick={() => void resolve(row.uuid, "approve")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg h-8"
                              disabled={actingUuid === row.uuid}
                              onClick={() => void resolve(row.uuid, "reject")}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          "—"
                        ),
                    },
                  ]
                : []),
            ]}
            data={items}
            rowKey={(row) => row.uuid}
            loading={loading}
            emptyIcon={Inbox}
            emptyTitle="No approvals waiting"
            emptyDescription="Approval requests will show here when finance, scheduling, or setup changes need review."
          />
        </CardContent>
      </Card>
    </div>
  );
}
