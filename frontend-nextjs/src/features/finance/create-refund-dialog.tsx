"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format/money";
import type { FinanceRefund, FinanceRefundPreview } from "@/lib/api/types";

const REFUND_REASONS = [
  { value: "customer_request", label: "Customer request" },
  { value: "duplicate_charge", label: "Duplicate charge" },
  { value: "service_issue", label: "Service issue" },
  { value: "wrong_amount", label: "Wrong amount" },
  { value: "other", label: "Other" },
];

const REFUND_METHODS = [
  { value: "cash", label: "Cash / manual" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "gateway", label: "Gateway (queued)" },
];

type CreateRefundDialogProps = {
  tenantSlug: string;
  open: boolean;
  sourceType: "pos_sale" | "payment_request";
  sourceId: number;
  onClose: () => void;
  onCreated: (refund: FinanceRefund) => void;
};

export function CreateRefundDialog({
  tenantSlug,
  open,
  sourceType,
  sourceId,
  onClose,
  onCreated,
}: CreateRefundDialogProps) {
  const [preview, setPreview] = useState<FinanceRefundPreview | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("customer_request");
  const [method, setMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingPreview(true);
    const params = new URLSearchParams({
      source_type: sourceType,
      source_id: String(sourceId),
    });
    void createApiClient(getApiClientOptions())
      .get<{ data: FinanceRefundPreview }>(`/${tenantSlug}/finance/refunds/preview?${params}`)
      .then((res) => {
        setPreview(res.data);
        setAmount(String((res.data.max_refundable_cents / 100).toFixed(2)));
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Could not load refund details");
        setPreview(null);
      })
      .finally(() => setLoadingPreview(false));
  }, [open, tenantSlug, sourceType, sourceId]);

  if (!open) return null;

  async function handleSubmit() {
    const amountCents = Math.round(parseFloat(amount || "0") * 100);
    if (amountCents < 1) {
      toast.error("Enter a valid refund amount");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{ data: FinanceRefund }>(
        `/${tenantSlug}/finance/refunds`,
        {
          source_type: sourceType,
          source_id: sourceId,
          amount_cents: amountCents,
          refund_method: method,
          reason,
          notes: notes.trim() || null,
        }
      );
      toast.success("Refund recorded");
      onCreated(res.data);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not record refund");
    } finally {
      setSubmitting(false);
    }
  }

  const currency = preview?.currency ?? "GHS";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-elevated">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Issue refund</h3>
            <p className="text-sm text-muted-foreground">
              {preview?.label ?? "Loading…"}
              {preview ? ` · up to ${formatMoney(preview.max_refundable_cents, currency)}` : ""}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="refund-amount">Amount</Label>
            <Input
              id="refund-amount"
              className="mt-1 rounded-xl"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              disabled={loadingPreview || submitting}
            />
          </div>
          <div>
            <Label htmlFor="refund-reason">Reason</Label>
            <select
              id="refund-reason"
              className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
            >
              {REFUND_REASONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="refund-method">Method</Label>
            <select
              id="refund-method"
              className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              disabled={submitting}
            >
              {REFUND_METHODS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="refund-notes">Note (optional)</Label>
            <Input
              id="refund-notes"
              className="mt-1 rounded-xl"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal note for audit trail"
              disabled={submitting}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" className="rounded-xl" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" className="rounded-xl" onClick={() => void handleSubmit()} disabled={submitting || loadingPreview || !preview?.max_refundable_cents}>
            {submitting ? "Saving…" : "Record refund"}
          </Button>
        </div>
      </div>
    </div>
  );
}
