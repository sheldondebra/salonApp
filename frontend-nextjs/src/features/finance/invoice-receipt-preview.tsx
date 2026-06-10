"use client";

import { format, parseISO } from "date-fns";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format/money";
import type { TenantInvoice } from "@/lib/api/types";

type InvoiceReceiptPreviewProps = {
  open: boolean;
  onClose: () => void;
  invoice: TenantInvoice;
  tenantName?: string;
};

export function InvoiceReceiptPreview({ open, onClose, invoice, tenantName }: InvoiceReceiptPreviewProps) {
  if (!open) return null;

  const cur = invoice.currency || "GHS";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card shadow-elevated">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">Receipt preview</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 p-6 text-sm">
          <div className="text-center">
            <p className="text-lg font-semibold">{tenantName ?? "Your business"}</p>
            <p className="text-muted-foreground">Invoice {invoice.invoice_number}</p>
            {invoice.paid_at ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Paid {format(parseISO(invoice.paid_at), "MMM d, yyyy")}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-dashed border-border/80 p-4">
            <p className="font-medium">{invoice.customer?.name ?? "Client"}</p>
            {invoice.customer?.email ? <p className="text-muted-foreground">{invoice.customer.email}</p> : null}
            {invoice.customer?.phone ? <p className="text-muted-foreground">{invoice.customer.phone}</p> : null}
          </div>

          <div className="space-y-2">
            {invoice.items.map((item) => (
              <div className="flex justify-between gap-3" key={item.id}>
                <span>{item.description}</span>
                <span>{formatMoney(item.line_total_cents, cur)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(invoice.subtotal_cents, cur)}</span>
            </div>
            {invoice.discount_total_cents > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatMoney(invoice.discount_total_cents, cur)}</span>
              </div>
            ) : null}
            {invoice.tax_total_cents > 0 ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatMoney(invoice.tax_total_cents, cur)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatMoney(invoice.total_cents, cur)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span>{formatMoney(invoice.amount_paid_cents, cur)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Balance</span>
              <span>{formatMoney(invoice.balance_due_cents, cur)}</span>
            </div>
          </div>

          {invoice.notes ? <p className="text-xs text-muted-foreground">{invoice.notes}</p> : null}
        </div>

        <div className="border-t border-border px-5 py-4">
          <Button className="w-full rounded-xl" onClick={() => window.print()}>
            Print receipt
          </Button>
        </div>
      </div>
    </div>
  );
}
