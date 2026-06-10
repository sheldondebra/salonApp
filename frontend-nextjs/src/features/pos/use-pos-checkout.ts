import { useCallback, useEffect, useRef, useState } from "react";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Sale } from "@/lib/api/types";
import { cartToApiItems } from "./pos-cart";
import type { CheckoutSessionPayload, CheckoutTotals, PosCartLine, PosPaymentMethod } from "./pos-types";

type UsePosCheckoutOptions = {
  tenantSlug: string;
  locationId: string;
  cart: PosCartLine[];
  clientUserId: string;
  appointmentUuid: string;
  taxCents: number;
  serviceChargeCents: number;
  tipCents: number;
  couponCode: string;
  manualDiscountCents: number;
  approvalRequestUuid: string;
  enabled: boolean;
};

export function usePosCheckout({
  tenantSlug,
  locationId,
  cart,
  clientUserId,
  appointmentUuid,
  taxCents,
  serviceChargeCents,
  tipCents,
  couponCode,
  manualDiscountCents,
  approvalRequestUuid,
  enabled,
}: UsePosCheckoutOptions) {
  const [sessionUuid, setSessionUuid] = useState<string | null>(null);
  const [serverTotals, setServerTotals] = useState<CheckoutTotals | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const api = () => createApiClient(getApiClientOptions());

  const syncSession = useCallback(async () => {
    if (!enabled || !locationId || cart.length === 0) {
      setSessionUuid(null);
      setServerTotals(null);
      return;
    }

    const payload = {
      location_id: Number(locationId),
      client_user_id: clientUserId ? Number(clientUserId) : null,
      appointment_uuid: appointmentUuid.trim() || null,
      items: cartToApiItems(cart),
      coupon_code: couponCode || null,
      tax_cents: taxCents,
      service_charge_cents: serviceChargeCents,
      tip_cents: tipCents,
    };

    try {
      if (sessionUuid) {
        const res = await api().patch<{ data: CheckoutSessionPayload }>(
          `/${tenantSlug}/checkout-sessions/${sessionUuid}`,
          payload
        );
        setServerTotals(res.data.totals);
      } else {
        const res = await api().post<{ data: CheckoutSessionPayload }>(
          `/${tenantSlug}/checkout-sessions`,
          payload
        );
        setSessionUuid(res.data.uuid);
        setServerTotals(res.data.totals);
      }
    } catch {
      // Fall back to local totals if session sync fails
      setServerTotals(null);
    }
  }, [
    enabled,
    locationId,
    cart,
    clientUserId,
    appointmentUuid,
    taxCents,
    serviceChargeCents,
    tipCents,
    couponCode,
    sessionUuid,
    tenantSlug,
  ]);

  useEffect(() => {
    if (!enabled || !locationId || cart.length === 0) {
      setSessionUuid(null);
      setServerTotals(null);
      return;
    }

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      void syncSession();
    }, 400);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [enabled, locationId, cart, clientUserId, appointmentUuid, taxCents, serviceChargeCents, tipCents, couponCode, syncSession]);

  const previewTotals = useCallback(async (): Promise<CheckoutTotals | null> => {
    if (!locationId || cart.length === 0) return null;
    setPreviewLoading(true);
    try {
      const res = await api().post<{ data: CheckoutTotals }>(`/${tenantSlug}/sales/preview`, {
        location_id: Number(locationId),
        items: cartToApiItems(cart),
        coupon_code: couponCode || null,
        tax_cents: taxCents,
        service_charge_cents: serviceChargeCents,
        tip_cents: tipCents,
      });
      setServerTotals(res.data);
      return res.data;
    } catch {
      return null;
    } finally {
      setPreviewLoading(false);
    }
  }, [tenantSlug, locationId, cart, couponCode, taxCents, serviceChargeCents, tipCents]);

  const completeCheckout = useCallback(
    async (paymentMethod: PosPaymentMethod, notes: string): Promise<Sale> => {
      if (!locationId || cart.length === 0) {
        throw new Error("Cart is empty");
      }

      const payload = {
        location_id: Number(locationId),
        client_user_id: clientUserId ? Number(clientUserId) : null,
        appointment_uuid: appointmentUuid.trim() || null,
        items: cartToApiItems(cart),
        coupon_code: couponCode || null,
        tax_cents: taxCents,
        service_charge_cents: serviceChargeCents,
        tip_cents: tipCents,
        manual_discount_cents: manualDiscountCents,
        approval_request_uuid: approvalRequestUuid.trim() || null,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      };

      if (sessionUuid) {
        await api().patch(`/${tenantSlug}/checkout-sessions/${sessionUuid}`, {
          location_id: payload.location_id,
          client_user_id: payload.client_user_id,
          appointment_uuid: payload.appointment_uuid,
          items: payload.items,
          coupon_code: payload.coupon_code,
          tax_cents: taxCents,
          service_charge_cents: serviceChargeCents,
          tip_cents: tipCents,
          notes: payload.notes,
        });
        const res = await api().post<{ data: { sale: Sale } }>(
          `/${tenantSlug}/checkout-sessions/${sessionUuid}/complete`,
          {
            payment_method: paymentMethod,
            manual_discount_cents: manualDiscountCents,
            approval_request_uuid: approvalRequestUuid.trim() || null,
          }
        );
        setSessionUuid(null);
        setServerTotals(null);
        return res.data.sale;
      }

      const res = await api().post<{ data: Sale }>(`/${tenantSlug}/sales`, payload);
      return res.data;
    },
    [
      tenantSlug,
      locationId,
      cart,
      clientUserId,
      appointmentUuid,
      couponCode,
      taxCents,
      serviceChargeCents,
      tipCents,
      manualDiscountCents,
      approvalRequestUuid,
      sessionUuid,
    ]
  );

  const resetSession = useCallback(() => {
    setSessionUuid(null);
    setServerTotals(null);
  }, []);

  return {
    sessionUuid,
    serverTotals,
    previewLoading,
    previewTotals,
    completeCheckout,
    resetSession,
  };
}
