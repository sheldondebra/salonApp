"use client";

import { useCallback, useEffect, useState } from "react";
import { Filter, MessageSquare, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsSectionHeader } from "@/features/settings/settings-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

type SmsRow = {
  id: number;
  recipient: string;
  type?: string;
  status: string;
  body: string;
  created_at: string;
  sent_at?: string | null;
};

type Summary = {
  usage: { period: string; sent: number; failed: number };
  total: number;
  sent: number;
  queued: number;
  failed: number;
};

type TenantSmsLogProps = {
  tenantSlug: string;
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "queued", label: "Queued" },
  { value: "failed", label: "Failed" },
] as const;

function statusVariant(status: string): "default" | "secondary" | "warning" | "outline" {
  if (status === "sent") return "default";
  if (status === "failed" || status === "error") return "warning";
  return "secondary";
}

export function TenantSmsLog({ tenantSlug }: TenantSmsLogProps) {
  const [rows, setRows] = useState<SmsRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    createApiClient(getApiClientOptions())
      .get<{ data: SmsRow[]; summary: Summary }>(`/${tenantSlug}/sms?${params}`)
      .then((res) => {
        setRows(Array.isArray(res.data) ? res.data : []);
        setSummary(res.summary ?? null);
      })
      .catch(() => {
        setRows([]);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, [tenantSlug, search, status]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <Card id="sms-delivery-log" className="scroll-mt-24 rounded-2xl shadow-soft">
      <SettingsSectionHeader
        icon={MessageSquare}
        title="SMS delivery log"
        description="Recent messages sent from your salon."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            disabled={loading}
            onClick={() => load()}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />
      <CardContent className="space-y-4 pt-0">
        {summary ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3">
              <p className="text-xs text-muted-foreground">This month</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {summary.usage.sent}{" "}
                <span className="text-sm font-normal text-muted-foreground">sent</span>
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3">
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-amber-800">
                {summary.usage.failed}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3">
              <p className="text-xs text-muted-foreground">All time</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{summary.total}</p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="rounded-xl pl-9"
              placeholder="Search by phone number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="mr-1 hidden h-4 w-4 text-muted-foreground sm:block" />
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value || "all"}
                type="button"
                size="sm"
                variant={status === f.value ? "default" : "outline"}
                className="rounded-full h-8 px-3 text-xs"
                onClick={() => setStatus(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 py-10 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-medium">No messages yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Confirm a booking with SMS enabled to see entries here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm">{m.recipient}</TableCell>
                    <TableCell className="text-xs capitalize text-muted-foreground">
                      {(m.type ?? "general").replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(m.status)} className="rounded-full capitalize">
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate text-muted-foreground sm:max-w-xs">
                      {m.body}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(m.sent_at ?? m.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
