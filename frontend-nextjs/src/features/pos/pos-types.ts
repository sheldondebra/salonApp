export type PosCartLineType = "service" | "product" | "addon";

export type PosCartLine = {
  key: string;
  type: PosCartLineType;
  id: number;
  name: string;
  unitCents: number;
  quantity: number;
  maxQty?: number;
  /** Parent service when type is addon */
  serviceId?: number;
};

export type PosPaymentMethod = "cash" | "card" | "mobile_money" | "other";

export const POS_PAYMENT_METHODS = [
  { value: "cash" as const, label: "Cash" },
  { value: "card" as const, label: "Card" },
  { value: "mobile_money" as const, label: "Mobile money" },
  { value: "other" as const, label: "Other" },
];

export type CheckoutTotals = {
  subtotal_cents: number;
  discount_cents: number;
  coupon_discount_cents?: number;
  manual_discount_cents?: number;
  tax_cents: number;
  service_charge_cents: number;
  tip_cents: number;
  total_cents: number;
  discount_policy?: {
    threshold_percent: number;
    discount_cents: number;
    discount_percent: number;
    requires_approval: boolean;
  };
};

export type ServiceAddon = {
  id: number;
  service_id: number;
  name: string;
  price_cents: number;
  extra_minutes?: number;
};

export type CheckoutSessionPayload = {
  uuid: string;
  status: string;
  location_id: number;
  client_user_id: number | null;
  items: Array<{
    type: PosCartLineType;
    service_id?: number;
    product_id?: number;
    service_addon_id?: number;
    quantity: number;
  }>;
  coupon_code: string | null;
  tax_cents: number;
  service_charge_cents: number;
  tip_cents: number;
  totals: CheckoutTotals;
};
