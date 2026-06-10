"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomerSelect } from "@/components/shared/entity-selects";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { TenantInvoice } from "@/lib/api/types";

type LineItem = {
  description: string;
  quantity: string;
  unitPrice: string;
};

type CreateInvoiceDialogProps = {
  tenantSlug: string;
  open: boolean;
  onClose: () => void;
  onCreated: (invoice: TenantInvoice) => void;
};

const emptyLine = (): LineItem => ({ description: "", quantity: "1", unitPrice: "" });

export function CreateInvoiceDialog({ tenantSlug, open, onClose, onCreated }: CreateInvoiceDialogProps) {
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function handleSubmit() {
    const payloadItems = items
      .map((row) => ({
        description: row.description.trim(),
        quantity: Math.max(1, parseInt(row.quantity || "1", 10) || 1),
        unit_price_cents: Math.round(parseFloat(row.unitPrice || "0") * 100),
      }))
      .filter((row) => row.description && row.unit_price_cents > 0);

    if (payloadItems.length === 0) {
      toast.error("Add at least one line item with a description and price");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{ data: TenantInvoice }>(
        `/${tenantSlug}/finance/invoices`,
        {
          customer_id: customerId ? Number(customerId) : null,
          due_date: dueDate || null,
          notes: notes.trim() || null,
          items: payloadItems,
        }
      );
      toast.success("Invoice created");
      onCreated(res.data);
      onClose();
      setCustomerId("");
      setCustomerSearch("");
      setDueDate("");
      setNotes("");
      setItems([emptyLine()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create invoice");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-elevated">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Create invoice</h2>
            <p className="text-sm text-muted-foreground">Manual invoice with line items</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Client</Label>
            <CustomerSelect
              tenantSlug={tenantSlug}
              value={customerId}
              searchQuery={customerSearch}
              onSearchQueryChange={setCustomerSearch}
              onValueChange={setCustomerId}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Due date</Label>
            <Input type="date" className="mt-1 rounded-xl" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Line items</Label>
            {items.map((row, index) => (
              <div key={index} className="grid grid-cols-[1fr_70px_90px_36px] gap-2">
                <Input
                  placeholder="Description"
                  className="rounded-xl"
                  value={row.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                />
                <Input
                  placeholder="Qty"
                  className="rounded-xl"
                  value={row.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                />
                <Input
                  placeholder="Price"
                  className="rounded-xl"
                  value={row.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={items.length === 1}
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setItems((p) => [...p, emptyLine()])}>
              <Plus className="mr-2 h-4 w-4" />
              Add line
            </Button>
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Input className="mt-1 rounded-xl" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for the client" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="rounded-xl" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? "Creating…" : "Create draft"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
