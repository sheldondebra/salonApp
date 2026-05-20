"use client";

import { format } from "date-fns";
import { Ban, CheckCircle2, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Appointment } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type PanelConfig = {
  key: "cancelled" | "completed" | "self_bookings";
  title: string;
  description: string;
  icon: typeof Ban;
  accent: string;
  empty: string;
};

const PANELS: PanelConfig[] = [
  {
    key: "cancelled",
    title: "Cancelled",
    description: "This month",
    icon: Ban,
    accent: "text-red-600 bg-red-500/10",
    empty: "No cancelled bookings this month.",
  },
  {
    key: "completed",
    title: "Completed",
    description: "This month",
    icon: CheckCircle2,
    accent: "text-emerald-600 bg-emerald-500/10",
    empty: "No completed bookings this month.",
  },
  {
    key: "self_bookings",
    title: "Self bookings",
    description: "Client booked online",
    icon: Smartphone,
    accent: "text-violet-600 bg-violet-500/10",
    empty: "No online self-service bookings yet.",
  },
];

type DashboardBookingsPanelsProps = {
  cancelled: Appointment[];
  completed: Appointment[];
  self_bookings: Appointment[];
};

function BookingRow({ apt }: { apt: Appointment }) {
  return (
    <li className="flex items-start justify-between gap-3 border-b border-border/40 py-3 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{apt.service?.name ?? "Service"}</p>
        <p className="truncate text-sm text-muted-foreground">
          {apt.client?.name ?? "Walk-in"}
          {apt.starts_at ? ` · ${format(new Date(apt.starts_at), "MMM d")}` : ""}
        </p>
      </div>
      <Badge variant="outline" className="shrink-0 capitalize">
        {apt.status.replace(/_/g, " ")}
      </Badge>
    </li>
  );
}

export function DashboardBookingsPanels({
  cancelled,
  completed,
  self_bookings,
}: DashboardBookingsPanelsProps) {
  const data = { cancelled, completed, self_bookings };

  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3 items-stretch">
      {PANELS.map((panel) => {
        const items = data[panel.key];
        const Icon = panel.icon;

        return (
          <Card
            key={panel.key}
            className="flex h-full min-w-0 flex-col rounded-2xl border-border/60 shadow-soft transition-shadow hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", panel.accent)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{panel.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{panel.description}</p>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{panel.empty}</p>
              ) : (
                <ul>
                  {items.map((apt) => (
                    <BookingRow key={apt.uuid} apt={apt} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
