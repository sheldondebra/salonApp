"use client";

import { Minus, Plus, ShoppingCart, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { TenantClient } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";
import type { PosCartLine } from "./pos-types";

type PosCheckoutPanelProps = {
  currency: string;
  cart: PosCartLine[];
  clients: TenantClient[];
  clientUserId: string;
  onClientChange: (id: string) => void;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  canCheckout: boolean;
  locationReady: boolean;
  onUpdateQty: (key: string, delta: number) => void;
  onClear: () => void;
  onCheckout: () => void;
};

export function PosCheckoutPanel({
  currency,
  cart,
  clients,
  clientUserId,
  onClientChange,
  subtotalCents,
  discountCents,
  totalCents,
  canCheckout,
  locationReady,
  onUpdateQty,
  onClear,
  onCheckout,
}: PosCheckoutPanelProps) {
  return (
    <Card className="shadow-soft xl:sticky xl:top-4 h-fit border-primary/15">
      <CardHeader className="border-b border-border/60 bg-primary/5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Cart
          </CardTitle>
          {cart.length > 0 ? (
            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground h-8" onClick={onClear}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          ) : null}
        </div>
        <CardDescription>{cart.length} line{cart.length === 1 ? "" : "s"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div>
          <Label className="flex items-center gap-1 text-xs">
            <User className="h-3 w-3" /> Customer
          </Label>
          <select
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            value={clientUserId}
            onChange={(e) => onClientChange(e.target.value)}
          >
            <option value="">Walk-in customer</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 max-h-52 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Select items from the catalog</p>
          ) : (
            cart.map((line) => (
              <div
                key={line.key}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{line.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {line.type} · {formatMoney(line.unitCents, currency)}
                    {line.maxQty !== undefined ? ` · max ${line.maxQty}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button type="button" size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => onUpdateQty(line.key, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center font-medium">{line.quantity}</span>
                  <Button type="button" size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => onUpdateQty(line.key, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatMoney(subtotalCents, currency)}</span>
          </div>
          {discountCents > 0 ? (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span>-{formatMoney(discountCents, currency)}</span>
            </div>
          ) : null}
          <div className="flex justify-between font-semibold text-base pt-1 text-foreground">
            <span>Total</span>
            <span>{formatMoney(totalCents, currency)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Tax, tips & coupons applied at checkout</p>
        </div>

        <Button
          className="w-full rounded-xl h-11 text-base"
          disabled={!canCheckout || cart.length === 0 || !locationReady}
          onClick={onCheckout}
        >
          Checkout · {formatMoney(totalCents, currency)}
        </Button>
      </CardContent>
    </Card>
  );
}
