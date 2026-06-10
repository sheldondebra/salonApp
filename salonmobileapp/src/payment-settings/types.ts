export type TenantPaymentMode = "platform_account" | "tenant_own_account" | "disabled";
export type SettlementSchedule = "manual" | "daily" | "weekly" | "monthly";
export type SettlementMethod = "momo" | "bank" | "cash" | "other";
export type PaymentGatewayKey = "paystack" | "flutterwave" | "mtn_momo";

export type GatewayStatusEntry = {
  enabled: boolean;
  status: "disabled" | "platform" | "pending_setup" | "unavailable" | "enabled";
  label: string;
};

export type TenantPaymentModeSettings = {
  id: number;
  mode: TenantPaymentMode;
  default_gateway: PaymentGatewayKey;
  mtn_momo_enabled: boolean;
  paystack_enabled: boolean;
  flutterwave_enabled: boolean;
  settlement_schedule: SettlementSchedule;
  settlement_method: SettlementMethod | null;
  settlement_account_name: string | null;
  settlement_account_number: string | null;
  settlement_provider: string | null;
  settlement_notes: string | null;
  is_payment_enabled: boolean;
  approved_at: string | null;
  gateway_status: Record<PaymentGatewayKey, GatewayStatusEntry>;
  updated_at: string | null;
};

export const PAYMENT_MODE_LABELS: Record<TenantPaymentMode, string> = {
  platform_account: "Schedelux Payments",
  tenant_own_account: "Own gateway",
  disabled: "Disabled",
};

export const SETTLEMENT_SCHEDULE_LABELS: Record<SettlementSchedule, string> = {
  manual: "Manual (on request)",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const SETTLEMENT_METHOD_LABELS: Record<SettlementMethod, string> = {
  momo: "Mobile Money",
  bank: "Bank transfer",
  cash: "Cash",
  other: "Other",
};

export const GATEWAY_STATUS_LABELS: Record<GatewayStatusEntry["status"], string> = {
  platform: "Via Schedelux",
  pending_setup: "Setup pending",
  unavailable: "Unavailable",
  disabled: "Off",
  enabled: "Enabled",
};

export type PaymentProviderAccountPayload = {
  id: number;
  provider: string;
  account_type: "platform" | "tenant";
  environment: "sandbox" | "production";
  country: string;
  currency: string;
  target_environment: string | null;
  callback_host: string | null;
  status: string;
  configured: boolean;
  api_user_masked: string | null;
  api_key_masked: string | null;
  subscription_key_masked: string | null;
  key_source: "database" | "environment" | null;
  last_health_check_at: string | null;
  last_balance_sync_at: string | null;
  last_error: string | null;
};

export type TenantMtnMomoContext = {
  payment_mode: TenantPaymentMode;
  uses_platform_account: boolean;
  can_manage_own_account: boolean;
  platform_account: PaymentProviderAccountPayload;
  tenant_account: PaymentProviderAccountPayload | null;
};

export const PROVIDER_STATUS_LABELS: Record<string, string> = {
  not_configured: "Not configured",
  pending: "Pending",
  connected: "Connected",
  failed: "Failed",
  disabled: "Disabled",
  blocked: "Blocked",
};
