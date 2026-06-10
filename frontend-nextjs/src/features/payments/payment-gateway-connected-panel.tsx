"use client";

import {
  CheckCircle2,
  CreditCard,
  Globe2,
  KeyRound,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PlatformPaymentGateway } from "@/lib/api/types";

function formatWhen(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function statusBadgeVariant(gateway: PlatformPaymentGateway) {
  if (gateway.connected) return "success" as const;
  if (gateway.status === "pending" || gateway.status === "configured") return "warning" as const;
  if (gateway.status === "failed") return "outline" as const;
  return "secondary" as const;
}

function statusLabel(gateway: PlatformPaymentGateway) {
  if (gateway.connected) return "Connected";
  if (gateway.configured) return "Configured";
  return gateway.status.replace(/_/g, " ");
}

type PaymentGatewayConnectedPanelProps = {
  gateway: PlatformPaymentGateway;
  className?: string;
};

export function PaymentGatewayConnectedPanel({ gateway, className }: PaymentGatewayConnectedPanelProps) {
  if (!gateway.connected && !gateway.configured) return null;

  const isMtn = gateway.id === "mtn_momo";

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        gateway.connected
          ? "border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/20"
          : "border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            gateway.connected ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
          )}
        >
          {gateway.connected ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-semibold text-foreground">
              {gateway.connected
                ? `${gateway.name} is connected`
                : `${gateway.name} is configured — run a health check to confirm`}
            </p>
            <p className="text-sm text-muted-foreground">
              {gateway.connected
                ? "Platform credentials verified. These details confirm the live connection."
                : "Credentials are saved. Verify the connection with a health check."}
            </p>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {gateway.environment ? (
              <div>
                <dt className="text-muted-foreground">Environment</dt>
                <dd className="font-medium capitalize">{gateway.environment}</dd>
              </div>
            ) : null}
            {gateway.country ? (
              <div>
                <dt className="text-muted-foreground">Country</dt>
                <dd className="font-medium">{gateway.country}</dd>
              </div>
            ) : null}
            {gateway.currency ? (
              <div>
                <dt className="text-muted-foreground">Currency</dt>
                <dd className="font-medium">{gateway.currency}</dd>
              </div>
            ) : null}
            {gateway.target_environment ? (
              <div>
                <dt className="text-muted-foreground">Target environment</dt>
                <dd className="font-medium">{gateway.target_environment}</dd>
              </div>
            ) : null}
            {gateway.callback_host ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Callback host</dt>
                <dd className="truncate font-medium font-mono text-xs">{gateway.callback_host}</dd>
              </div>
            ) : null}
            {gateway.key_source ? (
              <div>
                <dt className="text-muted-foreground">Key source</dt>
                <dd className="font-medium capitalize">{gateway.key_source}</dd>
              </div>
            ) : null}
            {gateway.public_key_masked ? (
              <div>
                <dt className="text-muted-foreground">{isMtn ? "API user" : "Public key"}</dt>
                <dd className="font-mono text-xs">{gateway.public_key_masked}</dd>
              </div>
            ) : null}
            {gateway.secret_key_masked ? (
              <div>
                <dt className="text-muted-foreground">{isMtn ? "API key" : "Secret key"}</dt>
                <dd className="font-mono text-xs">{gateway.secret_key_masked}</dd>
              </div>
            ) : null}
            {gateway.subscription_key_masked ? (
              <div>
                <dt className="text-muted-foreground">Subscription key</dt>
                <dd className="font-mono text-xs">{gateway.subscription_key_masked}</dd>
              </div>
            ) : null}
            {gateway.last_successful_token_at ? (
              <div>
                <dt className="text-muted-foreground">Last token verified</dt>
                <dd className="font-medium">{formatWhen(gateway.last_successful_token_at)}</dd>
              </div>
            ) : null}
            {gateway.last_health_check_at ? (
              <div>
                <dt className="text-muted-foreground">Last health check</dt>
                <dd className="font-medium">{formatWhen(gateway.last_health_check_at)}</dd>
              </div>
            ) : null}
            {gateway.updated_at ? (
              <div>
                <dt className="text-muted-foreground">Settings updated</dt>
                <dd className="font-medium">{formatWhen(gateway.updated_at)}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </div>
  );
}

const GATEWAY_ICONS = {
  mtn_momo: Smartphone,
  paystack: CreditCard,
  flutterwave: Globe2,
} as const;

type PaymentGatewayCardProps = {
  gateway: PlatformPaymentGateway;
  children?: React.ReactNode;
};

export function PaymentGatewayCard({ gateway, children }: PaymentGatewayCardProps) {
  const Icon = GATEWAY_ICONS[gateway.id] ?? CreditCard;

  return (
    <article className="rounded-2xl border border-border/60 bg-card shadow-soft">
      <div className="flex flex-col gap-4 border-b border-border/60 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">{gateway.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{gateway.description}</p>
          </div>
        </div>
        <Badge variant={statusBadgeVariant(gateway)} className="w-fit shrink-0 capitalize">
          {gateway.connected ? (
            <CheckCircle2 className="mr-1 h-3 w-3" />
          ) : gateway.status === "failed" ? (
            <XCircle className="mr-1 h-3 w-3" />
          ) : (
            <KeyRound className="mr-1 h-3 w-3" />
          )}
          {statusLabel(gateway)}
        </Badge>
      </div>

      <div className="space-y-4 p-5">
        <PaymentGatewayConnectedPanel gateway={gateway} />

        {gateway.last_error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {gateway.last_error}
          </p>
        ) : null}

        {children}
      </div>
    </article>
  );
}
