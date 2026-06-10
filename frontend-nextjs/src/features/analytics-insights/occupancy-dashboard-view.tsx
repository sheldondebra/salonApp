"use client";

import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CalendarRange, Users } from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { OccupancyAnalytics } from "@/lib/api/types";

export function OccupancyDashboardView({ tenantSlug }: { tenantSlug: string }) {
  const [analytics, setAnalytics] = useState<OccupancyAnalytics | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await createApiClient(getApiClientOptions()).get<OccupancyAnalytics>(
        `/${tenantSlug}/analytics/occupancy`
      );
      setAnalytics(result);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load occupancy analytics");
      setAnalytics(null);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Average occupancy" value={`${Math.round(analytics?.summary.average_occupancy_percent ?? 0)}%`} icon={Activity} />
        <MetricCard title="Utilization hours" value={String(Math.round(analytics?.summary.utilization_hours ?? 0))} icon={CalendarRange} />
        <MetricCard title="Peak day" value={analytics?.summary.peak_day_label ?? "—"} icon={Users} />
        <MetricCard title="Lowest day" value={analytics?.summary.lowest_day_label ?? "—"} icon={Users} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Occupancy trend</CardTitle>
            <CardDescription>Booked hours versus available hours over time.</CardDescription>
          </CardHeader>
          <CardContent className="h-[24rem]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.timeline ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${value}%`, "Occupancy"]} />
                <Line type="monotone" dataKey="occupancy_percent" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Occupancy by team member</CardTitle>
            <CardDescription>Who is fully utilized and who still has calendar capacity.</CardDescription>
          </CardHeader>
          <CardContent className="h-[24rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.by_staff ?? []} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value}%`, "Occupancy"]} />
                <Bar dataKey="occupancy_percent" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
