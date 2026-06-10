"use client";

import { Mail, Phone, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/features/crud/confirm-action";
import type { StaffMember } from "@/lib/api/types";
import { employmentStatusLabel } from "@/features/staff/staff-ui";
import { StaffServicesTab } from "@/features/staff/staff-services-tab";
import { StaffWorkingHoursTab } from "@/features/staff/staff-working-hours-tab";
import { StaffBreaksTab } from "@/features/staff/staff-breaks-tab";
import { StaffTimeOffTab } from "@/features/staff/staff-time-off-tab";
import { StaffPayrollTab } from "@/features/staff/staff-payroll-tab";
import { StaffProfileForm } from "@/features/staff/staff-profile-form";
import { StaffSelfEmployedTab } from "@/features/staff/staff-self-employed-tab";
import type { StaffPayRole } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export type StaffDetailTab =
  | "profile"
  | "self_employed"
  | "services"
  | "hours"
  | "breaks"
  | "time_off"
  | "payroll";

const TABS: { id: StaffDetailTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "payroll", label: "Pay & salary" },
  { id: "self_employed", label: "Self-employed" },
  { id: "services", label: "Services" },
  { id: "hours", label: "Hours" },
  { id: "breaks", label: "Breaks" },
  { id: "time_off", label: "Time off" },
];

type StaffDetailPanelProps = {
  tenantSlug: string;
  currency?: string;
  mode: "view" | "create";
  staff: StaffMember | null;
  allStaff: StaffMember[];
  tab: StaffDetailTab;
  onTabChange: (tab: StaffDetailTab) => void;
  payRoles: StaffPayRole[];
  locations: { id: number; name: string }[];
  canUpdate: boolean;
  canDelete: boolean;
  canCreate: boolean;
  onSaved: () => void;
  onDeactivate: (staff: StaffMember) => void;
  onCancelCreate: () => void;
};

export function StaffDetailPanel({
  tenantSlug,
  currency = "GHS",
  mode,
  staff,
  allStaff,
  tab,
  onTabChange,
  payRoles,
  locations,
  canUpdate,
  canDelete,
  canCreate,
  onSaved,
  onDeactivate,
  onCancelCreate,
}: StaffDetailPanelProps) {
  if (mode === "create") {
    return (
      <div className="rounded-2xl border border-border/60 bg-card shadow-soft">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">Add team member</h2>
          <p className="text-sm text-muted-foreground">Create a staff profile, then set pay and schedule.</p>
        </div>
        <div className="p-5">
          <StaffProfileForm
            tenantSlug={tenantSlug}
            staff={null}
            locations={locations}
            canSave={canCreate}
            onSaved={onSaved}
            onCancel={onCancelCreate}
          />
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center">
        <UserCircle className="mb-3 h-12 w-12 text-muted-foreground/50" />
        <h2 className="text-lg font-semibold">Select a team member</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Choose someone from the list to view profile, payroll, services, and schedule — all on this page.
        </p>
      </div>
    );
  }

  const accent = staff.color_code ?? "#E879A6";

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
      <div
        className="relative border-b border-border px-5 py-5"
        style={{ background: `linear-gradient(135deg, ${accent}18, transparent 60%)` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-md"
              style={{ backgroundColor: accent }}
            >
              {staff.initials}
            </div>
            <div>
              <h2 className="text-xl font-bold">{staff.display_name}</h2>
              <p className="text-muted-foreground">{staff.job_title ?? staff.title ?? "Team member"}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="rounded-full capitalize">
                  {employmentStatusLabel(staff.employment_status)}
                </Badge>
                {staff.is_bookable ? <Badge variant="secondary" className="rounded-full">Bookable</Badge> : null}
                {staff.payroll_summary?.pay_role_name ? (
                  <Badge variant="outline" className="rounded-full">
                    {staff.payroll_summary.pay_role_name}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {staff.user?.email ? (
              <Button variant="outline" size="sm" className="rounded-xl gap-1" asChild>
                <a href={`mailto:${staff.user.email}`}>
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              </Button>
            ) : null}
            {staff.user?.phone ? (
              <Button variant="outline" size="sm" className="rounded-xl gap-1" asChild>
                <a href={`tel:${staff.user.phone}`}>
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              </Button>
            ) : null}
            {canDelete ? (
              <ConfirmAction
                label="Deactivate"
                variant="destructive"
                confirmMessage={`Deactivate ${staff.display_name}?`}
                onConfirm={() => onDeactivate(staff)}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border px-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={cn(
              "shrink-0 px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "profile" ? (
          <StaffProfileForm
            tenantSlug={tenantSlug}
            staff={staff}
            locations={locations}
            canSave={canUpdate}
            onSaved={onSaved}
          />
        ) : tab === "payroll" ? (
          <StaffPayrollTab
            tenantSlug={tenantSlug}
            staff={staff}
            currency={currency}
            canEdit={canUpdate}
            payRoles={payRoles}
            onSaved={onSaved}
          />
        ) : tab === "self_employed" ? (
          <StaffSelfEmployedTab
            tenantSlug={tenantSlug}
            staff={staff}
            currency={currency}
            canEdit={canUpdate}
            onSaved={onSaved}
          />
        ) : tab === "services" ? (
          <StaffServicesTab tenantSlug={tenantSlug} staff={staff} canEdit={canUpdate} />
        ) : tab === "hours" ? (
          <StaffWorkingHoursTab tenantSlug={tenantSlug} staff={staff} canEdit={canUpdate} allStaff={allStaff} />
        ) : tab === "breaks" ? (
          <StaffBreaksTab tenantSlug={tenantSlug} staff={staff} canEdit={canUpdate} />
        ) : (
          <StaffTimeOffTab tenantSlug={tenantSlug} staff={staff} canEdit={canUpdate} />
        )}
      </div>
    </div>
  );
}
