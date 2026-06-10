"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, FileBarChart2, TableProperties } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { PageTabs } from "@/components/shared/page-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/permissions";
import { useAbilities } from "@/hooks/use-abilities";
import type { ReportDefinition, ReportPreview, ScheduledReport } from "@/lib/api/types";

type ReportBuilderViewProps = {
  tenantSlug: string;
  initialTab?: "builder" | "scheduled";
};

export function ReportBuilderView({ tenantSlug, initialTab = "builder" }: ReportBuilderViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.reports.create);

  const [tab, setTab] = useState<"builder" | "scheduled">(initialTab);
  const [definitions, setDefinitions] = useState<ReportDefinition[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledReport[]>([]);
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    source: "sales",
    description: "",
    fields: "date,total,location",
    group_by: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = createApiClient(getApiClientOptions());
      const [definitionsRes, scheduledRes] = await Promise.all([
        client.get<{ data: ReportDefinition[] }>(`/${tenantSlug}/report-definitions?per_page=50`),
        client.get<{ data: ScheduledReport[] }>(`/${tenantSlug}/scheduled-reports?per_page=50`),
      ]);
      setDefinitions(Array.isArray(definitionsRes.data) ? definitionsRes.data : []);
      setScheduled(Array.isArray(scheduledRes.data) ? scheduledRes.data : []);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load report builder");
      setDefinitions([]);
      setScheduled([]);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function previewDefinition() {
    setSaving(true);
    try {
      const result = await createApiClient(getApiClientOptions()).post<ReportPreview>(
        `/${tenantSlug}/report-definitions/preview`,
        {
          source: draft.source,
          fields: draft.fields.split(",").map((value) => value.trim()).filter(Boolean),
          group_by: draft.group_by || null,
        }
      );
      setPreview(result);
      toast.success("Preview generated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not preview report");
      setPreview(null);
    } finally {
      setSaving(false);
    }
  }

  async function saveDefinition() {
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/report-definitions`, {
        name: draft.name.trim(),
        source: draft.source,
        description: draft.description.trim() || null,
        fields: draft.fields.split(",").map((value) => value.trim()).filter(Boolean),
        group_by: draft.group_by || null,
      });
      toast.success("Report definition saved");
      setDraft({
        name: "",
        source: "sales",
        description: "",
        fields: "date,total,location",
        group_by: "",
      });
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save report definition");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Definitions" value={String(definitions.length)} icon={FileBarChart2} />
        <MetricCard title="Scheduled reports" value={String(scheduled.length)} icon={CalendarClock} />
        <MetricCard title="Preview columns" value={String(preview?.columns.length ?? 0)} icon={TableProperties} />
        <MetricCard title="Preview rows" value={String(preview?.rows.length ?? 0)} icon={TableProperties} />
      </div>

      <PageTabs
        tabs={[
          { id: "builder", label: "Builder" },
          { id: "scheduled", label: "Scheduled reports" },
        ]}
        value={tab}
        onChange={(value) => setTab(value as "builder" | "scheduled")}
      />

      {tab === "builder" ? (
        <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>Report builder</CardTitle>
              <CardDescription>Create reusable definitions before scheduling or exporting them.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <select
                  value={draft.source}
                  onChange={(event) => setDraft((current) => ({ ...current, source: event.target.value }))}
                  className="min-h-touch rounded-xl border border-input bg-card px-3 text-sm"
                >
                  <option value="sales">Sales</option>
                  <option value="appointments">Appointments</option>
                  <option value="clients">Clients</option>
                  <option value="inventory">Inventory</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-24 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Fields (comma separated)</Label>
                <Input value={draft.fields} onChange={(event) => setDraft((current) => ({ ...current, fields: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Group by</Label>
                <Input value={draft.group_by} onChange={(event) => setDraft((current) => ({ ...current, group_by: event.target.value }))} placeholder="date, location, staff…" />
              </div>
              <div className="flex gap-2">
                <Button className="rounded-xl" disabled={!canCreate || saving} onClick={() => void previewDefinition()}>
                  Preview
                </Button>
                <Button className="rounded-xl" variant="outline" disabled={!canCreate || saving || !draft.name.trim()} onClick={() => void saveDefinition()}>
                  Save definition
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-2xl border-border/60 shadow-soft">
              <CardHeader>
                <CardTitle>Definitions</CardTitle>
                <CardDescription>Saved report recipes your managers can reuse and schedule.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    {
                      id: "name",
                      header: "Report",
                      mobilePrimary: true,
                      cell: (row) => (
                        <div>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.description || row.source}</p>
                        </div>
                      ),
                    },
                    { id: "source", header: "Source", cell: (row) => row.source },
                    { id: "fields", header: "Fields", cell: (row) => row.fields.join(", ") },
                    { id: "updated", header: "Updated", cell: (row) => row.updated_at ? new Date(row.updated_at).toLocaleDateString() : "Recently" },
                  ]}
                  data={definitions}
                  rowKey={(row) => String(row.id)}
                  loading={loading}
                  emptyIcon={FileBarChart2}
                  emptyTitle="No report definitions yet"
                  emptyDescription="Build a report recipe here, preview it, then schedule it for delivery."
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 shadow-soft">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Sanity-check the output columns and sample rows before saving.</CardDescription>
              </CardHeader>
              <CardContent>
                {preview ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {preview.columns.map((column) => (
                        <span key={column} className="rounded-full border border-border px-3 py-1 text-xs">
                          {column}
                        </span>
                      ))}
                    </div>
                    <pre className="overflow-x-auto rounded-xl bg-muted/50 p-4 text-xs">
                      {JSON.stringify(preview.rows.slice(0, 5), null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Generate a preview from the builder to inspect result rows.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "scheduled" ? (
        <DataTable
          columns={[
            {
              id: "name",
              header: "Schedule",
              mobilePrimary: true,
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.report_definition?.name ?? "Linked definition"}</p>
                </div>
              ),
            },
            { id: "cadence", header: "Cadence", cell: (row) => row.cadence },
            { id: "format", header: "Format", cell: (row) => row.format },
            { id: "next", header: "Next run", cell: (row) => row.next_run_at ? new Date(row.next_run_at).toLocaleString() : "Queued" },
            { id: "recipients", header: "Recipients", cell: (row) => row.recipients.join(", ") || "No recipients" },
          ]}
          data={scheduled}
          rowKey={(row) => String(row.id)}
          loading={loading}
          emptyIcon={CalendarClock}
          emptyTitle="No scheduled reports yet"
          emptyDescription="Schedules created by the backend will appear here for managers to review."
        />
      ) : null}
    </div>
  );
}
