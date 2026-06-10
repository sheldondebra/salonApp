export type TenantWallet = {
  id: number;
  tenant_id: number;
  currency: string;
  available_balance: number;
  pending_balance: number;
  total_collected: number;
  total_fees: number;
  total_settled: number;
  total_refunded: number;
  status: string;
  updated_at: string | null;
};

export type WalletTransactionType =
  | "payment_collected"
  | "platform_fee"
  | "gateway_fee"
  | "settlement_pending"
  | "settlement_paid"
  | "refund"
  | "adjustment"
  | "reversal";

export type TenantWalletTransaction = {
  id: number;
  type: WalletTransactionType;
  direction: "credit" | "debit";
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string | null;
  description: string | null;
  created_at: string | null;
};

export const WALLET_TX_TYPE_LABELS: Record<WalletTransactionType, string> = {
  payment_collected: "Payment collected",
  platform_fee: "Platform fee",
  gateway_fee: "Gateway fee",
  settlement_pending: "Settlement pending",
  settlement_paid: "Settlement paid",
  refund: "Refund",
  adjustment: "Adjustment",
  reversal: "Reversal",
};
