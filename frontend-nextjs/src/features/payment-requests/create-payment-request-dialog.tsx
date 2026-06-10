"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, Smartphone, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerSelect } from "@/components/shared/entity-selects";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/features/booking/booking-helpers";
import { PAYMENT_REQUEST_REASON_LABELS } from "@/features/payment-requests/payment-request-status-badge";
import type { PaymentRequestPrefill } from "@/features/payment-requests/payment-request-prefill";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { PaymentRequest, PaymentRequestReason } from "@/lib/api/types";

type Step = "form" | "confirm" | "waiting";

type Gateway = "paystack" | "flutterwave" | "mtn_momo";

type CreatePaymentRequestDialogProps = {
  tenantSlug: string;
  currency?: string;
  open: boolean;
  onClose: () => void;
  prefill?: PaymentRequestPrefill | null;
  onCreated?: (request: PaymentRequest) => void;
};

const REASONS: PaymentRequestReason[] = [
  "booking_payment",
  "deposit_payment",
  "invoice_payment",
  "pos_sale",
  "sms_package_invoice",
  "other",
];

function gatewayLabel(gateway: string): string {
  if (gateway === "mtn_momo") return "MTN MoMo Direct";
  return gateway.charAt(0).toUpperCase() + gateway.slice(1);
}

export function CreatePaymentRequestDialog({
  tenantSlug,
  currency = "GHS",
  open,
  onClose,
  prefill,
  onCreated,
}: CreatePaymentRequestDialogProps) {
  const [step, setStep] = useState<Step>("form");
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [created, setCreated] = useState<PaymentRequest | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [formCurrency, setFormCurrency] = useState(currency);
  const [gateway, setGateway] = useState<Gateway>("mtn_momo");
  const [reason, setReason] = useState<PaymentRequestReason>("other");
  const [description, setDescription] = useState("");
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [posSaleId, setPosSaleId] = useState<number | null>(null);
  const [smsInvoiceId, setSmsInvoiceId] = useState<number | null>(null);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);

  const resetForm = useCallback(() => {
    const p = prefill ?? {};
    setCustomerId(p.customer_id ? String(p.customer_id) : "");
    setCustomerName(p.customer_name ?? "");
    setCustomerSearch(p.customer_name ?? "");
    setPhone(p.phone ?? "");
    setEmail(p.email ?? "");
    setAmountInput(p.amount_cents != null ? String((p.amount_cents / 100).toFixed(2)) : "");
    setFormCurrency(p.currency ?? currency);
    setGateway((p.gateway as Gateway) ?? "mtn_momo");
    setReason(p.reason ?? "other");
    setDescription(p.description ?? "");
    setBookingId(p.booking_id ?? null);
    setPosSaleId(p.pos_sale_id ?? null);
    setSmsInvoiceId(p.sms_purchase_invoice_id ?? null);
    setInvoiceId(p.invoice_id ?? null);
    setBranchId(p.branch_id ?? null);
    setStep("form");
    setCreated(null);
  }, [currency, prefill]);

  useEffect(() => {
    if (!open) return;
    resetForm();
  }, [open, resetForm]);

  const refreshStatus = useCallback(async () => {
    if (!created || created.gateway !== "mtn_momo") return;
    setRefreshing(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{ data: PaymentRequest }>(
        `/${tenantSlug}/payment-requests/${created.id}/verify`
      );
      setCreated(res.data);
      onCreated?.(res.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not refresh status");
    } finally {
      setRefreshing(false);
    }
  }, [created, onCreated, tenantSlug]);

  useEffect(() => {
    if (step !== "waiting" || !created || created.gateway !== "mtn_momo") return;
    if (created.status === "success" || created.status === "failed" || created.status === "cancelled") {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshStatus();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [step, created, refreshStatus]);

  const amountCents = Math.max(0, Math.round((parseFloat(amountInput) || 0) * 100));

  function onCustomerPick(client: { id: number; name: string; email: string; phone: string | null } | null) {
    if (client) {
      setCustomerName(client.name);
      setPhone(client.phone ?? phone);
      setEmail(client.email ?? email);
    }
  }

  function validateForm(): boolean {
    if (!phone.trim()) {
      toast.error("Customer phone number is required");
      return false;
    }
    if (amountCents < 100) {
      toast.error("Amount must be at least 1.00");
      return false;
    }
    return true;
  }

  function buildPayload() {
    return {
      customer_id: customerId ? Number(customerId) : null,
      booking_id: bookingId,
      pos_sale_id: posSaleId,
      sms_purchase_invoice_id: smsInvoiceId,
      invoice_id: invoiceId,
      branch_id: branchId,
      amount_cents: amountCents,
      currency: formCurrency,
      phone: phone.trim(),
      email: email.trim() || null,
      gateway,
      payment_channel: "mobile_money" as const,
      reason,
      description: description.trim() || null,
    };
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{
        data: PaymentRequest;
        message?: string;
      }>(`/${tenantSlug}/payment-requests`, buildPayload());
      setCreated(res.data);
      setStep("waiting");
      onCreated?.(res.data);
      toast.success(res.message ?? "Payment request sent");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create payment request");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const customerLabel = customerName || prefill?.customer_name || "Customer";

  const waitingResolved =
    created?.status === "success" || created?.status === "failed" || created?.status === "cancelled";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <Card className="flex max-h-[90vh] w-full max-w-lg flex-col shadow-soft">
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5 text-accent" />
              Request MoMo payment
            </CardTitle>
            <CardDescription>
              {step === "waiting"
                ? "Waiting for customer approval on their phone"
                : "Customer approves on their own device — never ask for their PIN"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto pt-6">
          {step === "form" ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-3 text-xs text-muted-foreground">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  The customer will receive a Mobile Money prompt on <strong>their phone</strong> and enter
                  their PIN privately. Schedelux never collects or stores MoMo PINs.
                </span>
              </div>

              <div className="space-y-2">
                <Label>Customer</Label>
                <CustomerSelect
                  tenantSlug={tenantSlug}
                  value={customerId}
                  onValueChange={setCustomerId}
                  searchQuery={customerSearch}
                  onSearchQueryChange={setCustomerSearch}
                  onCustomerPick={onCustomerPick}
                  placeholder="Search client (optional)"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="momo-phone">Phone *</Label>
                  <Input
                    id="momo-phone"
                    type="tel"
                    className="rounded-xl"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0244123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="momo-email">Email</Label>
                  <Input
                    id="momo-email"
                    type="email"
                    className="rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="momo-amount">Amount ({formCurrency}) *</Label>
                  <Input
                    id="momo-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    className="rounded-xl"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gateway</Label>
                  <Select value={gateway} onValueChange={(v) => setGateway(v as Gateway)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mtn_momo">MTN MoMo Direct</SelectItem>
                      <SelectItem value="paystack">Paystack</SelectItem>
                      <SelectItem value="flutterwave">Flutterwave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Select value={reason} onValueChange={(v) => setReason(v as PaymentRequestReason)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {PAYMENT_REQUEST_REASON_LABELS[r] ?? r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="momo-note">Note (optional)</Label>
                <Input
                  id="momo-note"
                  className="rounded-xl"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Balance for haircut appointment"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1 rounded-xl" onClick={() => (validateForm() ? setStep("confirm") : null)}>
                  Review & send
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          {step === "confirm" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-2">
                <p>
                  <span className="text-muted-foreground">Customer:</span> {customerLabel}
                </p>
                <p>
                  <span className="text-muted-foreground">Phone:</span> {phone}
                </p>
                <p>
                  <span className="text-muted-foreground">Amount:</span>{" "}
                  <span className="font-semibold">{formatMoney(amountCents, formCurrency)}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Gateway:</span> {gatewayLabel(gateway)}
                </p>
                <p>
                  <span className="text-muted-foreground">Reason:</span>{" "}
                  {PAYMENT_REQUEST_REASON_LABELS[reason] ?? reason}
                </p>
                {description ? (
                  <p>
                    <span className="text-muted-foreground">Note:</span> {description}
                  </p>
                ) : null}
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  Confirm you are <strong>not</strong> collecting the customer&apos;s MoMo PIN. They will
                  approve this payment on their own phone.
                </span>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 rounded-xl" disabled={submitting} onClick={() => void submit()}>
                  {submitting ? "Sending…" : "Send payment request"}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setStep("form")}>
                  Back
                </Button>
              </div>
            </div>
          ) : null}

          {step === "waiting" && created ? (
            <div className="space-y-4 text-center">
              {created.status === "success" ? (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
              ) : created.status === "failed" || created.status === "cancelled" ? (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
                  <XCircle className="h-7 w-7 text-destructive" />
                </div>
              ) : (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
                  <Clock className="h-7 w-7 text-accent animate-pulse" />
                </div>
              )}
              <div>
                <p className="text-lg font-semibold">
                  {created.status === "success"
                    ? "Payment received"
                    : created.status === "failed"
                      ? "Payment failed"
                      : "Waiting for customer approval"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {created.status === "success"
                    ? "MTN confirmed this payment."
                    : created.status === "failed"
                      ? created.failed_reason ?? "The customer did not complete payment."
                      : `Ask ${customerLabel} to check their phone and approve the ${gatewayLabel(created.gateway)} prompt.`}
                </p>
              </div>
              <p className="font-mono text-xs text-muted-foreground">{created.reference}</p>
              <p className="text-sm font-medium">{formatMoney(created.amount_cents, created.currency)}</p>
              {created.provider_status ? (
                <p className="text-xs text-muted-foreground">MTN status: {created.provider_status}</p>
              ) : null}
              {created.gateway === "mtn_momo" && !waitingResolved ? (
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  disabled={refreshing}
                  onClick={() => void refreshStatus()}
                >
                  {refreshing ? "Refreshing…" : "Refresh status"}
                </Button>
              ) : null}
              <Button className="w-full rounded-xl" onClick={onClose}>
                Done
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
