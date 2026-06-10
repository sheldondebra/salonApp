"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { StaffMember, StaffSelfEmployedProfile } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";

type StaffSelfEmployedTabProps = {
  tenantSlug: string;
  staff: StaffMember;
  currency?: string;
  canEdit: boolean;
  onSaved?: () => void;
};

const emptyProfile: StaffSelfEmployedProfile = {
  legal_name: "",
  trading_name: "",
  tax_id: "",
  vat_number: "",
  agreement_type: "chair_renter",
  commission_rate: 0,
  rent_cents: 0,
  payout_method: "bank",
  payout_reference: "",
  contract_start_at: "",
  contract_end_at: "",
  notes: "",
  is_active: true,
};

export function StaffSelfEmployedTab({
  tenantSlug,
  staff,
  currency = "GHS",
  canEdit,
  onSaved,
}: StaffSelfEmployedTabProps) {
  const [profile, setProfile] = useState<StaffSelfEmployedProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await createApiClient(getApiClientOptions()).get<{
        data: StaffSelfEmployedProfile;
      }>(`/${tenantSlug}/staff-members/${staff.id}/self-employed`);
      setProfile({ ...emptyProfile, ...result.data });
    } catch {
      setProfile(emptyProfile);
    } finally {
      setLoading(false);
    }
  }, [staff.id, tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const monthlyPreview = useMemo(() => formatMoney(profile.rent_cents ?? 0, currency), [currency, profile.rent_cents]);

  async function save() {
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).patch(
        `/${tenantSlug}/staff-members/${staff.id}/self-employed`,
        {
          ...profile,
          legal_name: profile.legal_name?.trim() || null,
          trading_name: profile.trading_name?.trim() || null,
          tax_id: profile.tax_id?.trim() || null,
          vat_number: profile.vat_number?.trim() || null,
          payout_reference: profile.payout_reference?.trim() || null,
          contract_start_at: profile.contract_start_at || null,
          contract_end_at: profile.contract_end_at || null,
          notes: profile.notes?.trim() || null,
        }
      );
      toast.success("Self-employed settings saved");
      onSaved?.();
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save self-employed settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-72 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Agreement type
          </p>
          <p className="text-lg font-semibold capitalize">
            {profile.agreement_type.replace(/_/g, " ")}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Commission
          </p>
          <p className="text-lg font-semibold">
            {profile.commission_rate ? `${profile.commission_rate}%` : "No commission"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Monthly rent
          </p>
          <p className="text-lg font-semibold">{monthlyPreview}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Legal name</Label>
          <Input
            disabled={!canEdit}
            value={profile.legal_name ?? ""}
            onChange={(event) => setProfile((current) => ({ ...current, legal_name: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Trading name</Label>
          <Input
            disabled={!canEdit}
            value={profile.trading_name ?? ""}
            onChange={(event) =>
              setProfile((current) => ({ ...current, trading_name: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Tax ID</Label>
          <Input
            disabled={!canEdit}
            value={profile.tax_id ?? ""}
            onChange={(event) => setProfile((current) => ({ ...current, tax_id: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>VAT number</Label>
          <Input
            disabled={!canEdit}
            value={profile.vat_number ?? ""}
            onChange={(event) =>
              setProfile((current) => ({ ...current, vat_number: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Agreement type</Label>
          <select
            disabled={!canEdit}
            className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
            value={profile.agreement_type}
            onChange={(event) =>
              setProfile((current) => ({ ...current, agreement_type: event.target.value }))
            }
          >
            <option value="chair_renter">Chair renter</option>
            <option value="commission_only">Commission only</option>
            <option value="booth_renter">Booth renter</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Payout method</Label>
          <select
            disabled={!canEdit}
            className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
            value={profile.payout_method ?? "bank"}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                payout_method: event.target.value as StaffSelfEmployedProfile["payout_method"],
              }))
            }
          >
            <option value="bank">Bank</option>
            <option value="momo">Mobile money</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Commission rate (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step="0.1"
            disabled={!canEdit}
            value={String(profile.commission_rate ?? 0)}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                commission_rate: Number(event.target.value || 0),
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Monthly rent ({currency})</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            disabled={!canEdit}
            value={String((profile.rent_cents ?? 0) / 100)}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                rent_cents: Math.round(Number(event.target.value || 0) * 100),
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Contract start</Label>
          <Input
            type="date"
            disabled={!canEdit}
            value={profile.contract_start_at ?? ""}
            onChange={(event) =>
              setProfile((current) => ({ ...current, contract_start_at: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Contract end</Label>
          <Input
            type="date"
            disabled={!canEdit}
            value={profile.contract_end_at ?? ""}
            onChange={(event) =>
              setProfile((current) => ({ ...current, contract_end_at: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Payout reference</Label>
          <Input
            disabled={!canEdit}
            value={profile.payout_reference ?? ""}
            onChange={(event) =>
              setProfile((current) => ({ ...current, payout_reference: event.target.value }))
            }
            placeholder="Bank account, MoMo number, or note"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Notes</Label>
          <textarea
            disabled={!canEdit}
            className="min-h-28 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
            value={profile.notes ?? ""}
            onChange={(event) => setProfile((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Independent-contractor notes, invoicing expectations, or workspace rules"
          />
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <BriefcaseBusiness className="h-4 w-4 text-primary" />
          Self-employed profile
        </div>
        <p className="mt-2">
          Use this section for chair renters, booth renters, or commission-only contractors that are
          not managed as salaried employees.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={!canEdit || saving} onClick={() => void save()}>
          <Wallet className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save self-employed settings"}
        </Button>
        <Button variant="outline" disabled={saving} onClick={() => void load()}>
          Reset
        </Button>
      </div>
    </div>
  );
}
