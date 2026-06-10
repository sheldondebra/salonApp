import type { BookingLocation, BookingService } from "@/booking/types";

export type PosLocation = BookingLocation & { is_active?: boolean };

export type PosProduct = {
  id: number;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  retail_cents: number;
  total_quantity: number;
  is_low_stock?: boolean;
  category?: { id: number; name: string } | null;
};

export type PosService = BookingService;

export type PosClient = {
  id: number;
  uuid?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type CartLine = {
  key: string;
  type: "service" | "product" | "addon";
  id: number;
  name: string;
  unitCents: number;
  quantity: number;
  maxQty?: number;
  serviceId?: number;
};

export type PaymentMethod = "cash" | "card" | "mobile_money" | "other";

export type SaleItem = {
  id: number;
  item_type: "service" | "product" | "addon";
  name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
};

export type Sale = {
  id: number;
  uuid: string;
  sale_number: string | null;
  status: string;
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  service_charge_cents: number;
  tip_cents: number;
  total_cents: number;
  currency: string;
  payment_method: PaymentMethod;
  coupon_code: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  client?: { id: number; name: string; email?: string; phone?: string | null } | null;
  location?: { id: number; name: string } | null;
  items?: SaleItem[];
};

export type PosSummary = {
  sales_today_count: number;
  sales_today_cents: number;
  sales_month_count: number;
  sales_month_cents: number;
  inventory: {
    total_products: number;
    active_products: number;
    low_stock_count: number;
    total_units: number;
    stock_value_cents: number;
  };
};

export type CheckoutTotals = {
  subtotal_cents: number;
  discount_cents: number;
  coupon_discount_cents?: number;
  manual_discount_cents?: number;
  tax_cents: number;
  service_charge_cents: number;
  tip_cents: number;
  total_cents: number;
};

export type DiscountPolicy = {
  threshold_percent: number;
  can_apply_discount: boolean;
  can_approve_discount: boolean;
};

export type ServiceAddon = {
  id: number;
  service_id: number;
  name: string;
  price_cents: number;
  extra_minutes?: number;
};

export type CouponValidation = {
  valid: boolean;
  message?: string;
  discount_cents: number;
  final_amount_cents?: number;
};
