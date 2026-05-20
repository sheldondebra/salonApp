"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <Card className="max-w-5xl shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-5 w-5 text-accent" />
          SMS delivery log
        </CardTitle>
        <CardDescription>
          Messages sent via MNotify for this salon. Without an API key, demo mode logs attempts only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary ? (
          <div className="flex flex-wrap gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
            <span>
              <span className="text-muted-foreground">This month:</span>{" "}
              <strong>{summary.usage.sent}</strong> sent · <strong>{summary.usage.failed}</strong>{" "}
              failed
            </span>
            <span className="text-muted-foreground">
              All time: {summary.total} total · {summary.queued} queued
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-xs rounded-xl"
            placeholder="Search recipient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-xl border border-input bg-card px-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="sent">Sent</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {loading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No SMS logged yet. Confirm a booking or run OTP with SMS enabled to see entries.
          </p>
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
                      <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{m.body}</TableCell>
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
