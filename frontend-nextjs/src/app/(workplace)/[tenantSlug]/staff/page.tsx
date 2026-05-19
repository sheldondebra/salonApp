"use client";

import { Calendar, Clock } from "lucide-react";
import { WorkplaceShell } from "@/components/layout/workplace-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/use-tenant";
import { Skeleton } from "@/components/ui/skeleton";

export default function StaffPortalPage({ params }: { params: { tenantSlug: string } }) {
  const { tenant, loading } = useTenant(params.tenantSlug);

  if (loading) {
    return <Skeleton className="m-8 h-64 rounded-2xl" />;
  }

  return (
    <WorkplaceShell
      tenantSlug={params.tenantSlug}
      tenantName={tenant?.name ?? params.tenantSlug}
      tagline="Staff portal"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">My schedule</h1>
          <p className="text-muted-foreground">Today&apos;s appointments and availability</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Today</CardTitle>
              <Badge>3 appointments</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { time: "10:00 AM", client: "Emma Wilson", service: "Signature Blowout" },
                { time: "2:00 PM", client: "Walk-in", service: "Gel Manicure" },
              ].map((item) => (
                <div key={item.time} className="flex gap-3 rounded-xl border border-border/60 p-3">
                  <Clock className="mt-0.5 h-4 w-4 text-accent" />
                  <div>
                    <p className="font-medium">{item.service}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.time} · {item.client}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                Quick actions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Mark breaks, view client notes, and update appointment status from the full dashboard (coming
              soon).
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkplaceShell>
  );
}
