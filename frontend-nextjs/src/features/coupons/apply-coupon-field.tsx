"use client";

import { useEffect, useState } from "react";
import { Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { formatMoney } from "@/lib/pricing/format-money";

type ApplyCouponFieldProps = {
  validatePath: string;
  validateBody: Record<string, unknown>;
  currency?: string;
  subtotalCents: number;
  onApplied: (result: {
    code: string;
    discountCents: number;
    finalCents: number;
  }) => void;
  onCleared?: () => void;
  clientOptions?: Parameters<typeof createApiClient>[0];
};

export function ApplyCouponField({
  validatePath,
  validateBody,
  currency = "GHS",
  subtotalCents,
  onApplied,
  onCleared,
  clientOptions,
}: ApplyCouponFieldProps) {
  const [code, setCode] = useState("");
  const [discountCents, setDiscountCents] = useState(0);
  const [finalCents, setFinalCents] = useState(subtotalCents);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (discountCents === 0) {
      setFinalCents(subtotalCents);
    }
  }, [subtotalCents, discountCents]);

  async function apply() {
    if (!code.trim()) return;
    setValidating(true);
    try {
      const client = createApiClient(clientOptions);
      const res = await client.post<{
        valid: boolean;
        message?: string;
        discount_cents: number;
        final_amount_cents: number;
      }>(validatePath, { code: code.trim(), ...validateBody });

      if (!res.valid) {
        toast.error(res.message ?? "Invalid coupon");
        setDiscountCents(0);
        setFinalCents(subtotalCents);
        onCleared?.();
        return;
      }

      setDiscountCents(res.discount_cents);
      setFinalCents(res.final_amount_cents);
      onApplied({
        code: code.trim().toUpperCase(),
        discountCents: res.discount_cents,
        finalCents: res.final_amount_cents,
      });
      toast.success("Coupon applied");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not validate coupon");
    } finally {
      setValidating(false);
    }
  }

  function clear() {
    setCode("");
    setDiscountCents(0);
    setFinalCents(subtotalCents);
    onCleared?.();
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="coupon-code" className="flex items-center gap-1 text-sm">
        <Tag className="h-4 w-4" /> Coupon code
      </Label>
      <div className="flex gap-2">
        <Input
          id="coupon-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="BOOK15"
          className="rounded-xl"
        />
        <Button type="button" variant="outline" onClick={() => void apply()} disabled={validating}>
          {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {discountCents > 0 ? (
        <div className="flex items-center justify-between text-sm text-emerald-600">
          <span>Discount</span>
          <span>-{formatMoney(discountCents, currency)}</span>
        </div>
      ) : null}
      <div className="flex justify-between text-sm font-medium">
        <span>Total</span>
        <span>{formatMoney(finalCents, currency)}</span>
      </div>
      {discountCents > 0 ? (
        <Button type="button" variant="ghost" size="sm" className="h-8 px-0 text-muted-foreground" onClick={clear}>
          Remove coupon
        </Button>
      ) : null}
    </div>
  );
}
