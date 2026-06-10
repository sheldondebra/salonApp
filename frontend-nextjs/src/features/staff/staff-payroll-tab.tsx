"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { StaffMember, StaffPayRole, StaffPayrollProfile, StaffPayType } from "@/lib/api/types";
import { PAY_TYPE_LABELS } from "@/features/staff/staff-ui";
import { formatMoney } from "@/lib/format/money";
import { crudRequest } from "@/features/crud/use-paginated-resource";

type StaffPayrollTabProps = {
  tenantSlug: string;
  staff: StaffMember;
  currency?: string;
  canEdit: boolean;
  payRoles: StaffPayRole[];
  onSaved?: () => void;
};

function centsFromInput(value: string): number {
  const n = parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function centsToInput(cents: number): string {
  if (!cents) return "";
  return (cents / 100).toFixed(2);
}

export function StaffPayrollTab({
  tenantSlug,
  staff,
  currency = "GHS",
  canEdit,
  payRoles,
  onSaved,
}: StaffPayrollTabProps) {
  const [profile, setProfile] = useState<StaffPayrollProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [payRoleId, setPayRoleId] = useState("");
  const [payType, setPayType] = useState<StaffPayType>("salary");
  const [baseSalary, setBaseSalary] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [commissionType, setCommissionType] = useState("");
  const [tipEligible, setTipEligible] = useState(true);
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutName, setPayoutName] = useState("");
  const [payoutNumber, setPayoutNumber] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [notes, setNotes] = useState("");

  const applyProfile = useCallback((p: StaffPayrollProfile) => {
    setProfile(p);
    setPayRoleId(p.pay_role_id ? String(p.pay_role_id) : "");
    setPayType(p.pay_type);
    setBaseSalary(centsToInput(p.base_salary_cents));
    setHourlyRate(centsToInput(p.hourly_rate_cents));
    setCommissionRate(p.commission_rate ? String(p.commission_rate) : "");
    setCommissionType(p.commission_type ?? "");
    setTipEligible(p.tip_eligible);
    setPayoutMethod(p.payout_method ?? "");
    setPayoutName(p.payout_account_name ?? "");
    setPayoutNumber("");
    setEffectiveFrom(p.effective_from ?? "");
    setNotes(p.notes ?? "");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: StaffPayrollProfile }>(
        `/${tenantSlug}/staff-members/${staff.id}/payroll`
      );
      applyProfile(res.data);
    } catch {
      toast.error("Could not load payroll profile");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, staff.id, applyProfile]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(applyRoleDefaults = false) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        pay_role_id: payRoleId ? Number(payRoleId) : null,
        pay_type: payType,
        base_salary_cents: centsFromInput(baseSalary),
        hourly_rate_cents: centsFromInput(hourlyRate),
        commission_rate: commissionRate ? parseFloat(commissionRate) : 0,
        commission_type: commissionType || null,
        tip_eligible: tipEligible,
        payout_method: payoutMethod || null,
        payout_account_name: payoutName || null,
        effective_from: effectiveFrom || null,
        notes: notes || null,
      };
      if (payoutNumber.trim()) {
        body.payout_account_number = payoutNumber.trim();
      }
      if (applyRoleDefaults) {
        body.apply_role_defaults = true;
      }

      const res = await crudRequest<{ data: StaffPayrollProfile; message: string }>(
        tenantSlug,
        "patch",
        `/staff-members/${staff.id}/payroll`,
        body
      );
      if (res?.data) applyProfile(res.data);
      toast.success(res?.message ?? "Payroll saved");
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save payroll");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  const previewSalary = centsFromInput(baseSalary);
  const previewHourly = centsFromInput(hourlyRate);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monthly salary</p>
          <p className="text-lg font-bold">{formatMoney(previewSalary, currency)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hourly rate</p>
          <p className="text-lg font-bold">{formatMoney(previewHourly, currency)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Commission</p>
          <p className="text-lg font-bold">{commissionRate ? `${commissionRate}%` : "—"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Pay role template</Label>
          <select
            disabled={!canEdit}
            className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
            value={payRoleId}
            onChange={(e) => setPayRoleId(e.target.value)}
          >
            <option value="">Custom compensation</option>
            {payRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name} — {PAY_TYPE_LABELS[role.pay_type]}
              </option>
            ))}
          </select>
          {canEdit && payRoleId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={saving}
              onClick={() => void save(true)}
            >
              Apply role defaults
            </Button>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Pay structure</Label>
          <select
            disabled={!canEdit}
            className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
            value={payType}
            onChange={(e) => setPayType(e.target.value as StaffPayType)}
          >
            {(Object.keys(PAY_TYPE_LABELS) as StaffPayType[]).map((key) => (
              <option key={key} value={key}>
                {PAY_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Effective from</Label>
          <Input
            type="date"
            disabled={!canEdit}
            className="rounded-xl"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
          />
        </div>

        {(payType.includes("salary") || payType === "commission") && (
          <div className="space-y-2">
            <Label>Base salary ({currency})</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              disabled={!canEdit}
              className="rounded-xl"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              placeholder="2500.00"
            />
          </div>
        )}

        {payType.includes("hourly") && (
          <div className="space-y-2">
            <Label>Hourly rate ({currency})</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              disabled={!canEdit}
              className="rounded-xl"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="25.00"
            />
          </div>
        )}

        {payType.includes("commission") && (
          <>
            <div className="space-y-2">
              <Label>Commission rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.1"
                disabled={!canEdit}
                className="rounded-xl"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Commission type</Label>
              <select
                disabled={!canEdit}
                className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
                value={commissionType}
                onChange={(e) => setCommissionType(e.target.value)}
              >
                <option value="">—</option>
                <option value="percent_of_service">% of service price</option>
                <option value="percent_of_revenue">% of revenue</option>
                <option value="flat_per_service">Flat per service</option>
              </select>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>Payout method</Label>
          <select
            disabled={!canEdit}
            className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
            value={payoutMethod}
            onChange={(e) => setPayoutMethod(e.target.value)}
          >
            <option value="">—</option>
            <option value="momo">Mobile Money</option>
            <option value="bank">Bank transfer</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Account name</Label>
          <Input
            disabled={!canEdit}
            className="rounded-xl"
            value={payoutName}
            onChange={(e) => setPayoutName(e.target.value)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Account / MoMo number</Label>
          <Input
            disabled={!canEdit}
            className="rounded-xl font-mono text-sm"
            value={payoutNumber}
            onChange={(e) => setPayoutNumber(e.target.value)}
            placeholder={profile?.has_payout_account_number ? profile.payout_account_number_masked ?? "••••••" : "233…"}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Notes</Label>
          <Input
            disabled={!canEdit}
            className="rounded-xl"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            disabled={!canEdit}
            checked={tipEligible}
            onChange={(e) => setTipEligible(e.target.checked)}
          />
          Eligible for tips
        </label>
      </div>

      {canEdit ? (
        <Button className="rounded-xl" disabled={saving} onClick={() => void save(false)}>
          {saving ? "Saving…" : "Save payroll"}
        </Button>
      ) : null}
    </div>
  );
}
