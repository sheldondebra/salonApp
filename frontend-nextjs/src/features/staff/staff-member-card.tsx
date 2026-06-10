"use client";

import { Calendar, MapPin, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StaffMember } from "@/lib/api/types";
import { employmentStatusLabel, formatPaySummary } from "@/features/staff/staff-ui";

type StaffMemberCardProps = {
  member: StaffMember;
  selected?: boolean;
  currency?: string;
  onSelect: () => void;
};

export function StaffMemberCard({ member, selected, currency = "GHS", onSelect }: StaffMemberCardProps) {
  const accent = member.color_code ?? "#E879A6";
  const pay = member.payroll_summary;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border bg-card text-left shadow-soft transition-all",
        selected
          ? "border-primary ring-2 ring-primary/20 shadow-md"
          : "border-border/60 hover:border-primary/35 hover:shadow-md"
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }}
      />
      <div className="p-4 pt-5">
        <div className="flex items-start gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white shadow-sm"
            style={{ backgroundColor: accent }}
          >
            {member.initials ?? member.display_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-foreground">{member.display_name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {member.job_title ?? member.title ?? "Team member"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full text-[10px] font-semibold",
                  member.employment_status === "active" || !member.employment_status
                    ? "border-emerald-300/60 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                    : ""
                )}
              >
                {employmentStatusLabel(member.employment_status)}
              </Badge>
              {member.is_bookable ? (
                <Badge variant="secondary" className="rounded-full text-[10px]">
                  Bookable
                </Badge>
              ) : null}
              {pay?.pay_role_name ? (
                <Badge
                  variant="outline"
                  className="rounded-full text-[10px]"
                  style={
                    pay.pay_role_color
                      ? { borderColor: `${pay.pay_role_color}55`, color: pay.pay_role_color }
                      : undefined
                  }
                >
                  {pay.pay_role_name}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
          {member.location?.name ? (
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{member.location.name}</span>
            </p>
          ) : null}
          {pay ? (
            <p className="flex items-center gap-1.5 font-medium text-foreground/80">
              <Wallet className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate">{formatPaySummary(pay, currency)}</span>
            </p>
          ) : null}
          <p className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {member.appointments_count ?? 0} appointments
          </p>
        </div>
      </div>
    </button>
  );
}
