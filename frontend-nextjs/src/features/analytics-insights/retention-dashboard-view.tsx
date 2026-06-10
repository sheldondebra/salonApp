"use client";

import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HeartHandshake, Repeat, Users } from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { RetentionAnalytics } from "@/lib/api/types";

export function RetentionDashboardView({ tenantSlug }: { tenantSlug: string }) {
  const [analytics, setAnalytics] = useState<RetentionAnalytics | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await createApiClient(getApiClientOptions()).get<RetentionAnalytics>(
        `/${tenantSlug}/analytics/retention`
      );
      setAnalytics(result);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load retention analytics");
      setAnalytics(null);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Retention" value={`${Math.round(analytics?.summary.retention_percent ?? 0)}%`} icon={HeartHandshake} />
        <MetricCard title="Repeat clients" value={String(analytics?.summary.repeat_clients ?? 0)} icon={Repeat} />
        <MetricCard title="Lapsed clients" value={String(analytics?.summary.lapsed_clients ?? 0)} icon={Users} />
        <MetricCard title="Days between visits" value={String(Math.round(analytics?.summary.average_days_between_visits ?? 0))} icon={Repeat} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Retention trend</CardTitle>
            <CardDescription>Return-rate movement over recent periods.</CardDescription>
          </CardHeader>
          <CardContent className="h-[24rem]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.timeline ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${value}%`, "Retained"]} />
                <Line type="monotone" dataKey="retained_percent" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="lapsed_percent" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Cohort retention</CardTitle>
            <CardDescription>See which client cohorts are returning best.</CardDescription>
          </CardHeader>
          <CardContent className="h-[24rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.cohorts ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${value}%`, "Retained"]} />
                <Bar dataKey="retained_percent" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
