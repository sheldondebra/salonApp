"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { ExpenseCategory, TenantExpense } from "@/lib/api/types";

type CreateExpenseDialogProps = {
  tenantSlug: string;
  open: boolean;
  categories: ExpenseCategory[];
  onClose: () => void;
  onCreated: (expense: TenantExpense) => void;
};

export function CreateExpenseDialog({
  tenantSlug,
  open,
  categories,
  onClose,
  onCreated,
}: CreateExpenseDialogProps) {
  const [categoryId, setCategoryId] = useState("");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && categories.length && !categoryId) {
      setCategoryId(String(categories[0].id));
    }
  }, [open, categories, categoryId]);

  if (!open) return null;

  async function handleSubmit() {
    const amountCents = Math.round(parseFloat(amount || "0") * 100);
    if (!categoryId || amountCents < 1) {
      toast.error("Choose a category and enter an amount");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{ data: TenantExpense }>(
        `/${tenantSlug}/finance/expenses`,
        {
          expense_category_id: Number(categoryId),
          vendor_name: vendor.trim() || null,
          amount_cents: amountCents,
          payment_method: paymentMethod,
          expense_date: expenseDate,
          note: note.trim() || null,
        }
      );
      toast.success("Expense recorded");
      onCreated(res.data);
      onClose();
      setVendor("");
      setAmount("");
      setNote("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save expense");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Record expense</h2>
            <p className="text-sm text-muted-foreground">Track rent, supplies, marketing, and other costs</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Category</Label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs">Vendor (optional)</Label>
            <Input className="mt-1 rounded-xl" placeholder="Who did you pay?" value={vendor} onChange={(e) => setVendor(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Amount</Label>
              <Input className="mt-1 rounded-xl" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" className="mt-1 rounded-xl" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Payment method</Label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile money</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label className="text-xs">Note (optional)</Label>
            <Input className="mt-1 rounded-xl" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was this for?" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="rounded-xl" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? "Saving…" : "Save expense"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
