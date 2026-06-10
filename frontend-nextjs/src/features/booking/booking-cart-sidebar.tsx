"use client";

import { format, parseISO } from "date-fns";
import { CalendarCheck, CreditCard, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatMoney } from "./booking-helpers";
import type { Appointment, Service, TenantBookingConfig } from "@/lib/api/types";
import { bookingPrimaryButtonClass } from "@/features/booking/booking-ui";
import { cn } from "@/lib/utils";

function PrimaryButtonContent({
  loading,
  label,
}: {
  loading?: boolean;
  label: string;
}) {
  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-white" />;
  }

  const showConfirmIcon =
    label.toLowerCase().includes("confirm") ||
    label.toLowerCase().includes("waitlist") ||
    label.toLowerCase().includes("payment");

  return (
    <>
      {showConfirmIcon ? (
        <CalendarCheck className="mr-2 h-5 w-5 shrink-0 text-white" />
      ) : null}
      <span className="text-white">{label}</span>
    </>
  );
}

export type BookingCartSidebarProps = {
  services: Service[];
  currency: string;
  totalDuration: number;
  totalPrice: number;
  date?: string;
  timeLabel?: string | null;
  staffName?: string | null;
  locationSummary?: string | null;
  joinWaitlist?: boolean;
  paymentsEnabled?: boolean;
  depositCents?: number;
  depositLabel?: string;
  onRemoveService: (id: number) => void;
  onPrimaryAction: () => void;
  onBack?: (() => void) | null;
  primaryLabel: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  showBack?: boolean;
  /** After booking — show pay CTA */
  paymentMode?: {
    appointment: Appointment;
    onPay: () => void;
    onSkip?: () => void;
    paying?: boolean;
    payLabel: string;
  };
  className?: string;
  compact?: boolean;
  /** Order summary only — no navigation buttons */
  readOnly?: boolean;
};

export function BookingCartSidebar({
  services,
  currency,
  totalDuration,
  totalPrice,
  date,
  timeLabel,
  staffName,
  locationSummary,
  joinWaitlist,
  paymentsEnabled,
  depositCents,
  depositLabel,
  onRemoveService,
  onPrimaryAction,
  onBack,
  primaryLabel,
  primaryDisabled,
  primaryLoading,
  showBack = true,
  paymentMode,
  className,
  compact,
  readOnly,
}: BookingCartSidebarProps) {
  const hasItems = services.length > 0;
  const scheduleLine =
    date && (joinWaitlist ? `Waitlist · ${format(parseISO(`${date}T12:00:00`), "EEE, MMM d")}` : timeLabel
      ? `${format(parseISO(`${date}T12:00:00`), "EEE, MMM d")} · ${timeLabel}`
      : format(parseISO(`${date}T12:00:00`), "EEE, MMM d"));

  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-accent" />
          <h3 className="font-semibold tracking-tight">Your appointment</h3>
        </div>
        {hasItems ? (
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-foreground">
            {services.length} item{services.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div className={cn("mt-4 space-y-2", compact && "max-h-36 overflow-y-auto")}>
        {!hasItems ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
            Select services to see your total
          </p>
        ) : (
          services.map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.duration_minutes} min · {formatMoney(s.price_cents, currency)}
                </p>
              </div>
              {!paymentMode ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${s.name}`}
                  onClick={() => onRemoveService(s.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ))
        )}
      </div>

      {scheduleLine || staffName || locationSummary ? (
        <div className="mt-4 space-y-1 rounded-xl bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
          {scheduleLine ? <p className="font-medium text-foreground">{scheduleLine}</p> : null}
          {staffName ? <p>With {staffName}</p> : null}
          {locationSummary ? <p>{locationSummary}</p> : null}
        </div>
      ) : null}

      <Separator className="my-4" />

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Duration</dt>
          <dd className="font-medium">{hasItems ? `${totalDuration} min` : "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="font-semibold tabular-nums">
            {hasItems ? formatMoney(totalPrice, currency) : "—"}
          </dd>
        </div>
        {paymentsEnabled && depositCents != null && depositCents > 0 && hasItems ? (
          <div className="flex justify-between gap-4 text-accent">
            <dt className="text-sm">{depositLabel ?? "Due today"}</dt>
            <dd className="text-sm font-medium tabular-nums">
              {formatMoney(depositCents, currency)}
            </dd>
          </div>
        ) : null}
      </dl>

      {!readOnly ? (
      <div className="mt-6 space-y-3">
        {paymentMode ? (
          <>
            <Button
              type="button"
              size="lg"
              className={cn(
                "h-12 w-full rounded-xl text-base font-semibold shadow-soft",
                bookingPrimaryButtonClass
              )}
              disabled={paymentMode.paying}
              onClick={paymentMode.onPay}
            >
              {paymentMode.paying ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5 shrink-0 text-white" />
                  <span className="text-white">{paymentMode.payLabel}</span>
                </>
              )}
            </Button>
            {paymentMode.onSkip ? (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="w-full rounded-xl"
                onClick={paymentMode.onSkip}
              >
                Pay later at the salon
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <Button
              type="button"
              size="lg"
              className={cn(
                "h-12 w-full rounded-xl text-base font-semibold shadow-soft",
                bookingPrimaryButtonClass
              )}
              disabled={primaryDisabled || primaryLoading}
              onClick={onPrimaryAction}
            >
              <PrimaryButtonContent loading={primaryLoading} label={primaryLabel} />
            </Button>
            {showBack && onBack ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full rounded-xl"
                onClick={onBack}
              >
                Back
              </Button>
            ) : null}
          </>
        )}
      </div>
      ) : null}
    </>
  );

  if (compact && !readOnly) {
    return (
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 px-5 py-5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/90 sm:px-8",
          className
        )}
      >
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold tabular-nums">
              {hasItems ? formatMoney(totalPrice, currency) : "—"}
            </p>
          </div>
          {showBack && onBack ? (
            <Button type="button" variant="outline" size="lg" className="rounded-xl" onClick={onBack}>
              Back
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            className={cn(
              "h-12 min-w-[9rem] rounded-xl px-6 text-base font-semibold shadow-soft",
              bookingPrimaryButtonClass
            )}
            disabled={primaryDisabled || primaryLoading}
            onClick={onPrimaryAction}
          >
            <PrimaryButtonContent loading={primaryLoading} label={primaryLabel} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:p-7 lg:sticky lg:top-8",
        className
      )}
    >
      {inner}
    </aside>
  );
}

export function computeDepositCents(
  totalPrice: number,
  booking?: TenantBookingConfig | null
): { depositCents: number; requireFull: boolean } {
  if (!booking?.payments?.enabled || totalPrice <= 0) {
    return { depositCents: 0, requireFull: false };
  }
  const requireFull = booking.payments.require_full_payment ?? false;
  const depositCents = requireFull
    ? totalPrice
    : Math.max(1, Math.round(totalPrice * ((booking.payments.deposit_percent ?? 30) / 100)));
  return { depositCents, requireFull };
}
