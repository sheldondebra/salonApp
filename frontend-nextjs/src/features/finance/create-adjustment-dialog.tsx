"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { FinanceAdjustment, FinanceLedgerEntry } from "@/lib/api/types";

type CreateAdjustmentDialogProps = {
  tenantSlug: string;
  open: boolean;
  entry: FinanceLedgerEntry | null;
  onClose: () => void;
  onCreated: (adjustment: FinanceAdjustment) => void;
};

export function CreateAdjustmentDialog({
  tenantSlug,
  open,
  entry,
  onClose,
  onCreated,
}: CreateAdjustmentDialogProps) {
  const [direction, setDirection] = useState<"credit" | "debit">("debit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open || !entry) return null;

  const activeEntry = entry;

  async function handleSubmit() {
    const amountCents = Math.round(parseFloat(amount || "0") * 100);
    if (amountCents < 1 || !reason.trim()) {
      toast.error("Enter amount and reason");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{ data: FinanceAdjustment }>(
        `/${tenantSlug}/finance/adjustments`,
        {
          ledger_reference: activeEntry.id,
          source_type: activeEntry.source_type,
          source_id: activeEntry.source_id,
          direction,
          amount_cents: amountCents,
          currency: activeEntry.currency,
          reason: reason.trim(),
          notes: notes.trim() || null,
        }
      );
      toast.success("Adjustment recorded");
      onCreated(res.data);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not record adjustment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-elevated">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Adjust transaction</h3>
            <p className="text-sm text-muted-foreground">{activeEntry.description}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Direction</Label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={direction}
              onChange={(e) => setDirection(e.target.value as "credit" | "debit")}
              disabled={submitting}
            >
              <option value="debit">Debit (reduce revenue)</option>
              <option value="credit">Credit (add revenue)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="adjust-amount">Amount</Label>
            <Input
              id="adjust-amount"
              className="mt-1 rounded-xl"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              disabled={submitting}
            />
          </div>
          <div>
            <Label htmlFor="adjust-reason">Reason</Label>
            <Input
              id="adjust-reason"
              className="mt-1 rounded-xl"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this adjustment needed?"
              disabled={submitting}
            />
          </div>
          <div>
            <Label htmlFor="adjust-notes">Note (optional)</Label>
            <Input
              id="adjust-notes"
              className="mt-1 rounded-xl"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" className="rounded-xl" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" className="rounded-xl" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? "Saving…" : "Save adjustment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
