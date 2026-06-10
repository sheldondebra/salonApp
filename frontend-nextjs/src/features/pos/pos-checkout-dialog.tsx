"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApplyCouponField } from "@/features/coupons/apply-coupon-field";
import { formatMoney } from "@/lib/format/money";
import { POS_PAYMENT_METHODS, type PosPaymentMethod } from "./pos-types";

type PosCheckoutDialogProps = {
  open: boolean;
  currency: string;
  tenantSlug: string;
  cartLineCount: number;
  subtotalCents: number;
  taxCents: number;
  serviceChargeCents: number;
  tipCents: number;
  couponDiscountCents: number;
  manualDiscountCents: number;
  totalCents: number;
  serviceIdsInCart: number[];
  paymentMethod: PosPaymentMethod;
  taxPercent: string;
  serviceChargePercent: string;
  tipCentsInput: string;
  manualDiscountInput: string;
  saleNotes: string;
  checkingOut: boolean;
  canApplyManualDiscount: boolean;
  discountThresholdPercent: number;
  discountPercent: number;
  requiresApproval: boolean;
  hasApproval: boolean;
  requestingApproval: boolean;
  onPaymentMethodChange: (method: PosPaymentMethod) => void;
  onTaxPercentChange: (value: string) => void;
  onServiceChargePercentChange: (value: string) => void;
  onTipInputChange: (value: string) => void;
  onManualDiscountInputChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onCouponApplied: (code: string, discountCents: number) => void;
  onCouponCleared: () => void;
  onRequestApproval: () => void;
  onClose: () => void;
  onComplete: () => void;
};

export function PosCheckoutDialog({
  open,
  currency,
  tenantSlug,
  cartLineCount,
  subtotalCents,
  taxCents,
  serviceChargeCents,
  tipCents,
  couponDiscountCents,
  manualDiscountCents,
  totalCents,
  serviceIdsInCart,
  paymentMethod,
  taxPercent,
  serviceChargePercent,
  tipCentsInput,
  manualDiscountInput,
  saleNotes,
  checkingOut,
  canApplyManualDiscount,
  discountThresholdPercent,
  discountPercent,
  requiresApproval,
  hasApproval,
  requestingApproval,
  onPaymentMethodChange,
  onTaxPercentChange,
  onServiceChargePercentChange,
  onTipInputChange,
  onManualDiscountInputChange,
  onNotesChange,
  onCouponApplied,
  onCouponCleared,
  onRequestApproval,
  onClose,
  onComplete,
}: PosCheckoutDialogProps) {
  if (!open) return null;

  const totalDiscountCents = couponDiscountCents + manualDiscountCents;
  const blockedByApproval = requiresApproval && !hasApproval;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-soft">
        <CardHeader>
          <CardTitle>Complete payment</CardTitle>
          <CardDescription>
            {cartLineCount} items · {formatMoney(subtotalCents, currency)} subtotal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <Label>Payment method</Label>
            <select
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              value={paymentMethod}
              onChange={(e) => onPaymentMethodChange(e.target.value as PosPaymentMethod)}
            >
              {POS_PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tax %</Label>
              <Input className="mt-1 rounded-xl" type="number" min={0} step="0.1" value={taxPercent} onChange={(e) => onTaxPercentChange(e.target.value)} />
            </div>
            <div>
              <Label>Service charge %</Label>
              <Input
                className="mt-1 rounded-xl"
                type="number"
                min={0}
                step="0.1"
                value={serviceChargePercent}
                onChange={(e) => onServiceChargePercentChange(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Tip ({currency})</Label>
            <Input
              className="mt-1 rounded-xl"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={tipCentsInput}
              onChange={(e) => onTipInputChange(e.target.value)}
            />
          </div>
          {canApplyManualDiscount ? (
            <div>
              <Label>Manual discount ({currency})</Label>
              <Input
                className="mt-1 rounded-xl"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={manualDiscountInput}
                onChange={(e) => onManualDiscountInputChange(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Manager approval required at {discountThresholdPercent}% or above (current{" "}
                {discountPercent.toFixed(1)}%).
              </p>
            </div>
          ) : null}
          <div>
            <Label>Notes (optional)</Label>
            <Input className="mt-1 rounded-xl" value={saleNotes} onChange={(e) => onNotesChange(e.target.value)} placeholder="Receipt note" />
          </div>
          {subtotalCents > 0 ? (
            <ApplyCouponField
              validatePath={`/${tenantSlug}/sales/validate-coupon`}
              validateBody={{
                amount_cents: subtotalCents,
                service_ids: serviceIdsInCart,
              }}
              subtotalCents={subtotalCents}
              currency={currency}
              onApplied={({ code, discountCents: d }) => onCouponApplied(code, d)}
              onCleared={onCouponCleared}
            />
          ) : null}
          {requiresApproval ? (
            <div
              className={`rounded-xl border p-3 text-sm ${
                hasApproval
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              <div className="flex items-start gap-2">
                {hasApproval ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <div className="space-y-2">
                  <p>
                    {hasApproval
                      ? "Manager approved this discount. You can complete checkout."
                      : `Discount of ${discountPercent.toFixed(1)}% exceeds the ${discountThresholdPercent}% limit. Request manager approval before charging.`}
                  </p>
                  {!hasApproval ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      disabled={requestingApproval || checkingOut}
                      onClick={onRequestApproval}
                    >
                      {requestingApproval ? "Requesting…" : "Request manager approval"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          <div className="rounded-xl border bg-muted/30 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatMoney(subtotalCents, currency)}</span>
            </div>
            {taxCents > 0 ? (
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatMoney(taxCents, currency)}</span>
              </div>
            ) : null}
            {serviceChargeCents > 0 ? (
              <div className="flex justify-between">
                <span>Service charge</span>
                <span>{formatMoney(serviceChargeCents, currency)}</span>
              </div>
            ) : null}
            {tipCents > 0 ? (
              <p className="flex justify-between">
                <span>Tip</span>
                <span>{formatMoney(tipCents, currency)}</span>
              </p>
            ) : null}
            {couponDiscountCents > 0 ? (
              <div className="flex justify-between text-emerald-600">
                <span>Coupon</span>
                <span>-{formatMoney(couponDiscountCents, currency)}</span>
              </div>
            ) : null}
            {manualDiscountCents > 0 ? (
              <div className="flex justify-between text-emerald-600">
                <span>Manual discount</span>
                <span>-{formatMoney(manualDiscountCents, currency)}</span>
              </div>
            ) : null}
            {totalDiscountCents > 0 && couponDiscountCents > 0 && manualDiscountCents > 0 ? (
              <div className="flex justify-between font-medium text-emerald-700 border-t pt-1">
                <span>Total discount</span>
                <span>-{formatMoney(totalDiscountCents, currency)}</span>
              </div>
            ) : null}
            <div className="flex justify-between font-semibold text-base border-t pt-2 mt-2">
              <span>Amount due</span>
              <span>{formatMoney(totalCents, currency)}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 rounded-xl h-11"
              disabled={checkingOut || blockedByApproval}
              onClick={onComplete}
            >
              {checkingOut ? "Processing…" : `Charge ${formatMoney(totalCents, currency)}`}
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
