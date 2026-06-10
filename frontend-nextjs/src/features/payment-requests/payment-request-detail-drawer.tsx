"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Clock, RefreshCw, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format/money";
import type { PaymentRequest } from "@/lib/api/types";
import {
  PAYMENT_REQUEST_REASON_LABELS,
  PaymentRequestStatusBadge,
} from "@/features/payment-requests/payment-request-status-badge";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";

type PaymentRequestDetailDrawerProps = {
  tenantSlug: string;
  request: PaymentRequest;
  currency?: string;
  onClose: () => void;
  onUpdated?: (request: PaymentRequest) => void;
};

function TimelineRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={muted ? "text-sm text-muted-foreground" : "text-sm font-medium"}>{value}</p>
      </div>
    </div>
  );
}

function gatewayLabel(gateway: string): string {
  if (gateway === "mtn_momo") return "MTN MoMo Direct";
  return gateway.charAt(0).toUpperCase() + gateway.slice(1);
}

export function PaymentRequestDetailDrawer({
  tenantSlug,
  request: initial,
  currency = "GHS",
  onClose,
  onUpdated,
}: PaymentRequestDetailDrawerProps) {
  const { can } = useAbilities(tenantSlug);
  const [request, setRequest] = useState(initial);
  const [busy, setBusy] = useState<"verify" | "cancel" | "retry" | null>(null);

  const cur = request.currency || currency;
  const isMtn = request.gateway === "mtn_momo";
  const canVerify = can(Permissions.payment_requests.verify) && isMtn;
  const canCancel =
    can(Permissions.payment_requests.cancel) &&
    (request.status === "pending" || request.status === "processing");
  const canRetry =
    can(Permissions.payment_requests.retry) &&
    isMtn &&
    (request.status === "failed" || request.status === "expired");

  async function runAction(action: "verify" | "cancel" | "retry") {
    setBusy(action);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{ data: PaymentRequest; message?: string }>(
        `/${tenantSlug}/payment-requests/${request.id}/${action}`
      );
      setRequest(res.data);
      onUpdated?.(res.data);
      toast.success(res.message ?? "Updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <button type="button" className="flex-1" aria-label="Close" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-elevated">
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="text-sm text-muted-foreground">MoMo payment request</p>
            <h2 className="text-xl font-semibold">{formatMoney(request.amount_cents, cur)}</h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{request.reference}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
          <div className="flex flex-wrap gap-2">
            <PaymentRequestStatusBadge status={request.status} />
            <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs">
              {gatewayLabel(request.gateway)}
            </span>
            {request.provider_status ? (
              <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                MTN: {request.provider_status}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {canVerify ? (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                disabled={busy !== null}
                onClick={() => void runAction("verify")}
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${busy === "verify" ? "animate-spin" : ""}`} />
                {busy === "verify" ? "Refreshing…" : "Refresh status"}
              </Button>
            ) : null}
            {canRetry ? (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                disabled={busy !== null}
                onClick={() => void runAction("retry")}
              >
                {busy === "retry" ? "Retrying…" : "Retry MTN request"}
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                size="sm"
                variant="destructive"
                className="rounded-xl"
                disabled={busy !== null}
                onClick={() => void runAction("cancel")}
              >
                {busy === "cancel" ? "Cancelling…" : "Cancel request"}
              </Button>
            ) : null}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-3 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            Customer enters MoMo PIN only on their own phone. Schedelux never collects or stores PINs.
          </div>

          <div className="grid gap-3">
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium">{request.customer?.name ?? "—"}</p>
              <p className="text-muted-foreground">{request.phone}</p>
              {request.email ? <p className="text-muted-foreground">{request.email}</p> : null}
            </div>
            <div>
              <p className="text-muted-foreground">Reason</p>
              <p className="font-medium">
                {PAYMENT_REQUEST_REASON_LABELS[request.reason] ?? request.reason}
              </p>
            </div>
            {request.description ? (
              <div>
                <p className="text-muted-foreground">Note</p>
                <p>{request.description}</p>
              </div>
            ) : null}
            {request.requested_by ? (
              <div>
                <p className="text-muted-foreground">Requested by</p>
                <p className="font-medium">{request.requested_by.name}</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-accent" />
              Activity
            </p>
            <div className="space-y-3">
              <TimelineRow
                label="Created"
                value={
                  request.created_at
                    ? format(parseISO(request.created_at), "MMM d, yyyy · h:mm a")
                    : "—"
                }
              />
              {request.status_checked_at ? (
                <TimelineRow
                  label="Last status check"
                  value={format(parseISO(request.status_checked_at), "MMM d, yyyy · h:mm a")}
                />
              ) : null}
              {request.callback_received_at ? (
                <TimelineRow
                  label="MTN callback received"
                  value={format(parseISO(request.callback_received_at), "MMM d, yyyy · h:mm a")}
                />
              ) : null}
              {request.expires_at ? (
                <TimelineRow
                  label="Expires"
                  value={format(parseISO(request.expires_at), "MMM d, yyyy · h:mm a")}
                  muted={request.status === "expired"}
                />
              ) : null}
              {request.paid_at ? (
                <TimelineRow
                  label="Paid"
                  value={format(parseISO(request.paid_at), "MMM d, yyyy · h:mm a")}
                />
              ) : null}
              {request.cancelled_at ? (
                <TimelineRow
                  label="Cancelled"
                  value={format(parseISO(request.cancelled_at), "MMM d, yyyy · h:mm a")}
                  muted
                />
              ) : null}
              {request.external_reference ? (
                <TimelineRow label="MTN transaction ID" value={request.external_reference} />
              ) : null}
              {request.failed_reason ? (
                <TimelineRow label="Failure reason" value={request.failed_reason} muted />
              ) : null}
            </div>
          </div>

          {request.booking ? (
            <div>
              <p className="text-muted-foreground">Linked booking</p>
              <p className="font-medium">{request.booking.service_name ?? "Appointment"}</p>
            </div>
          ) : null}
          {request.pos_sale ? (
            <div>
              <p className="text-muted-foreground">Linked POS sale</p>
              <p className="font-medium">{request.pos_sale.sale_number ?? request.pos_sale.uuid}</p>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
