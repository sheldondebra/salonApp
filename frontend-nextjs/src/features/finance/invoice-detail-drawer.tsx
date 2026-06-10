"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { FileText, Send, Smartphone, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmAction } from "@/features/crud/confirm-action";
import { CreatePaymentRequestDialog } from "@/features/payment-requests/create-payment-request-dialog";
import { invoicePaymentPrefill } from "@/features/payment-requests/payment-request-prefill";
import { InvoiceReceiptPreview } from "@/features/finance/invoice-receipt-preview";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format/money";
import type { TenantInvoice } from "@/lib/api/types";

type InvoiceDetailDrawerProps = {
  tenantSlug: string;
  invoice: TenantInvoice;
  tenantName?: string;
  onClose: () => void;
  onUpdated: (invoice: TenantInvoice) => void;
};

function statusVariant(status: string): "success" | "secondary" | "warning" | "outline" {
  if (status === "paid") return "success";
  if (status === "draft") return "outline";
  if (status === "overdue" || status === "cancelled") return "warning";
  return "secondary";
}

export function InvoiceDetailDrawer({
  tenantSlug,
  invoice: initial,
  tenantName,
  onClose,
  onUpdated,
}: InvoiceDetailDrawerProps) {
  const [invoice, setInvoice] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [cashAmount, setCashAmount] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const cur = invoice.currency || "GHS";
  const canSend = invoice.status === "draft";
  const canPay = !["paid", "cancelled", "refunded"].includes(invoice.status) && invoice.balance_due_cents > 0;
  const canCancel = !["paid", "cancelled", "refunded"].includes(invoice.status);
  const momoPrefill = invoicePaymentPrefill(invoice);

  async function runAction(action: "send" | "cancel") {
    setBusy(action);
    try {
      const client = createApiClient(getApiClientOptions());
      const res =
        action === "send"
          ? await client.post<{ data: TenantInvoice; message?: string }>(`/${tenantSlug}/finance/invoices/${invoice.id}/send`)
          : await client.post<{ data: TenantInvoice }>(`/${tenantSlug}/finance/invoices/${invoice.id}/cancel`);

      setInvoice(res.data);
      onUpdated(res.data);
      const message = "message" in res && typeof res.message === "string" ? res.message : "Updated";
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  async function recordCashPayment() {
    const amount = Math.round(parseFloat(cashAmount || "0") * 100);
    if (amount < 1) {
      toast.error("Enter a valid payment amount");
      return;
    }

    setBusy("payment");
    try {
      const res = await createApiClient(getApiClientOptions()).post<{ data: TenantInvoice }>(
        `/${tenantSlug}/finance/invoices/${invoice.id}/payments`,
        { amount_cents: amount, payment_method: "cash" }
      );
      setInvoice(res.data);
      onUpdated(res.data);
      setCashAmount("");
      toast.success("Payment recorded");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not record payment");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-foreground/20 backdrop-blur-sm">
        <button type="button" className="flex-1" aria-label="Close" onClick={onClose} />
        <aside className="flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-elevated">
          <div className="flex items-start justify-between gap-3 border-b border-border p-5">
            <div>
              <p className="text-sm text-muted-foreground">Invoice</p>
              <h2 className="text-xl font-semibold">{invoice.invoice_number}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{invoice.customer?.name ?? "Walk-in client"}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(invoice.status)}>{invoice.status.replace(/_/g, " ")}</Badge>
              {invoice.due_date ? (
                <Badge variant="outline">Due {format(parseISO(invoice.due_date), "MMM d, yyyy")}</Badge>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-semibold">{formatMoney(invoice.total_cents, cur)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Balance due</p>
                <p className="font-semibold">{formatMoney(invoice.balance_due_cents, cur)}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Line items</p>
              <div className="space-y-2">
                {invoice.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 rounded-xl border border-border/60 px-3 py-2">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatMoney(item.unit_price_cents, cur)}
                      </p>
                    </div>
                    <p className="font-medium">{formatMoney(item.line_total_cents, cur)}</p>
                  </div>
                ))}
              </div>
            </div>

            {invoice.payments.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment timeline</p>
                <div className="space-y-3">
                  {invoice.payments.map((payment) => (
                    <div key={payment.id} className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                      <div>
                        <p className="font-medium">
                          {formatMoney(payment.amount_cents, cur)} · {payment.payment_method.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.paid_at ? format(parseISO(payment.paid_at), "MMM d, yyyy h:mm a") : "—"}
                          {payment.reference ? ` · ${payment.reference}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {canPay ? (
              <div className="rounded-xl border border-border/60 p-4">
                <Label className="text-xs">Record cash payment</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    className="rounded-xl"
                    placeholder="Amount"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    disabled={busy !== null}
                    onClick={() => void recordCashPayment()}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Record
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border p-5">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setReceiptOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Receipt
            </Button>
            {canSend ? (
              <Button size="sm" className="rounded-xl" disabled={busy !== null} onClick={() => void runAction("send")}>
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            ) : null}
            {canPay && momoPrefill ? (
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setPaymentOpen(true)}>
                <Smartphone className="mr-2 h-4 w-4" />
                Request payment
              </Button>
            ) : null}
            {canCancel ? (
              <ConfirmAction
                label="Cancel invoice"
                title="Cancel this invoice?"
                confirmMessage="The client will no longer be able to pay this invoice. This cannot be undone."
                confirmLabel="Cancel invoice"
                variant="destructive"
                className="rounded-xl"
                disabled={busy !== null}
                onConfirm={() => runAction("cancel")}
              />
            ) : null}
          </div>
        </aside>
      </div>

      <CreatePaymentRequestDialog
        tenantSlug={tenantSlug}
        currency={cur}
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        prefill={momoPrefill}
        onCreated={() => {
          setPaymentOpen(false);
          void createApiClient(getApiClientOptions())
            .get<{ data: TenantInvoice }>(`/${tenantSlug}/finance/invoices/${invoice.id}`)
            .then((res) => {
              setInvoice(res.data);
              onUpdated(res.data);
            });
        }}
      />

      <InvoiceReceiptPreview
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        invoice={invoice}
        tenantName={tenantName}
      />
    </>
  );
}
