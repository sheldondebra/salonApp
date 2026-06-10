import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import type { Appointment } from "@/booking/types";
import { BookingDetailView } from "@/features/booking/BookingDetailView";
import type { BookingStatus } from "@/features/booking/bookingDetailTheme";
import { CreatePaymentRequestScreen } from "@/features/payment-requests/CreatePaymentRequestScreen";
import { bookingPaymentPrefill } from "@/payment-requests/prefill";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { fetchTenantAppointment, updateTenantAppointment } from "@/workplace/api";
import { colors, radii, spacing } from "@/theme/colors";

export default function WorkplaceBookingDetailScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const { portal, token, tenantSlug } = useAuth();
  const { useSplitLayout } = useResponsiveLayout();
  const [apt, setApt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [momoOpen, setMomoOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token || !tenantSlug || !uuid) return;
    setLoading(true);
    setError("");
    try {
      setApt(await fetchTenantAppointment({ token, tenantSlug }, String(uuid)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load booking");
      setApt(null);
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, uuid]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(status: BookingStatus) {
    if (!token || !tenantSlug || !uuid) return;
    setSaving(true);
    setError("");
    try {
      setApt(await updateTenantAppointment({ token, tenantSlug }, String(uuid), { status }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  function openMomo() {
    if (!apt) return;
    const prefill = bookingPaymentPrefill(apt);
    if (!prefill) return;
    if (useSplitLayout) {
      setMomoOpen(true);
      return;
    }
    router.push({
      pathname: "/workplace/payment-requests/new",
      params: {
        bookingId: String(prefill.booking_id ?? ""),
        customerId: prefill.customer_id ? String(prefill.customer_id) : "",
        customerName: prefill.customer_name ?? "",
        phone: prefill.phone ?? "",
        email: prefill.email ?? "",
        amountCents: String(prefill.amount_cents ?? ""),
        reason: prefill.reason ?? "",
        description: prefill.description ?? "",
        branchId: prefill.branch_id ? String(prefill.branch_id) : "",
      },
    } as never);
  }

  if (portal && portal !== "workplace") return <Redirect href="/" />;

  if (loading) return <LoadingState message="Loading booking…" />;

  if (!apt) {
    return (
      <ResponsiveShell>
        <ScreenHeader title="Booking" subtitle="Not found" />
        <Text style={{ color: colors.destructive, marginBottom: spacing.md }}>
          {error || "This appointment could not be loaded."}
        </Text>
        <Button label="Go back" variant="secondary" onPress={() => router.back()} />
        <Button label="Retry" onPress={() => void load()} />
      </ResponsiveShell>
    );
  }

  const prefill = bookingPaymentPrefill(apt);

  if (useSplitLayout && momoOpen && prefill) {
    return (
      <ResponsiveShell scroll={false}>
        <View style={styles.split}>
          <View style={styles.mainPane}>
            <BookingDetailView
              appointment={apt}
              saving={saving}
              error={error}
              onBack={() => router.back()}
              onRefresh={() => void load()}
              onSetStatus={(s) => void setStatus(s)}
              onRequestMomo={openMomo}
            />
          </View>
          <View style={styles.formPane}>
            <CreatePaymentRequestScreen
              embedded
              prefill={prefill}
              onDone={() => setMomoOpen(false)}
            />
          </View>
        </View>
      </ResponsiveShell>
    );
  }

  return (
    <ResponsiveShell>
      <BookingDetailView
        appointment={apt}
        saving={saving}
        error={error}
        onBack={() => router.back()}
        onRefresh={() => void load()}
        onSetStatus={(s) => void setStatus(s)}
        onRequestMomo={prefill ? openMomo : undefined}
      />
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  split: { flex: 1, flexDirection: "row", gap: spacing.lg, padding: spacing.lg },
  mainPane: { flex: 1.2, minWidth: 0 },
  formPane: {
    flex: 1,
    minWidth: 320,
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
});
