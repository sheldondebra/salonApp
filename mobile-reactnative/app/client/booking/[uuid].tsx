import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import {
  cancelBooking,
  fetchAvailability,
  fetchBookingDetail,
  rescheduleBooking,
} from "@/booking/api";
import { dateOptions, formatAppointmentWhen } from "@/booking/format";
import type { Appointment } from "@/booking/types";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { colors, radii, spacing } from "@/theme/colors";

export default function BookingDetailScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const { portal, token, tenantSlug } = useAuth();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [date, setDate] = useState(dateOptions()[1]?.value ?? "");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<{ time: string; label: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const apiConfig = { token: token ?? undefined, tenantSlug: tenantSlug ?? undefined };
  const dates = dateOptions(14);
  const canChange =
    appointment && !["cancelled", "completed", "no_show"].includes(appointment.status);

  const load = useCallback(async () => {
    if (!token || !tenantSlug || !uuid) return;
    setLoading(true);
    try {
      const apt = await fetchBookingDetail(apiConfig, tenantSlug, uuid);
      setAppointment(apt);
    } catch {
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, uuid]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!rescheduleMode || !appointment?.service?.id || !tenantSlug) return;
    let cancelled = false;
    setLoadingSlots(true);
    void fetchAvailability(apiConfig, tenantSlug, {
      date,
      serviceIds: [appointment.service.id],
      staffMemberId: appointment.staff_member?.id ?? null,
      locationId: appointment.location?.id ?? null,
      excludeAppointmentUuid: appointment.uuid,
    })
      .then((data) => {
        if (!cancelled) {
          setSlots(data);
          if (!data.some((s) => s.time === time && s.available)) setTime("");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rescheduleMode, date, appointment, tenantSlug, time]);

  async function onCancel() {
    if (!tenantSlug || !uuid) return;
    setBusy(true);
    setError("");
    try {
      await cancelBooking(apiConfig, tenantSlug, uuid);
      router.replace("/client/bookings");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not cancel");
    } finally {
      setBusy(false);
    }
  }

  async function onReschedule() {
    if (!tenantSlug || !uuid || !time) return;
    const [h, m] = time.split(":").map(Number);
    const d = new Date(`${date}T00:00:00`);
    d.setHours(h, m ?? 0, 0, 0);
    setBusy(true);
    setError("");
    try {
      await rescheduleBooking(apiConfig, tenantSlug, uuid, {
        starts_at: d.toISOString(),
        staff_member_id: appointment?.staff_member?.id ?? null,
        location_id: appointment?.location?.id ?? null,
      });
      router.replace("/client/bookings");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reschedule");
    } finally {
      setBusy(false);
    }
  }

  if (portal && portal !== "client") return <Redirect href="/" />;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Header
          title="Appointment"
          right={<Button label="Back" variant="ghost" onPress={() => router.back()} style={styles.back} />}
        />

        {loading ? (
          <LoadingState />
        ) : !appointment ? (
          <Text style={styles.error}>Appointment not found.</Text>
        ) : (
          <>
            <Card>
              <Text style={styles.service}>{appointment.service?.name ?? "Service"}</Text>
              <Text style={styles.when}>{formatAppointmentWhen(appointment.starts_at)}</Text>
              <Text style={styles.meta}>{appointment.staff_member?.display_name ?? "Stylist"}</Text>
              <Text style={[styles.status, appointment.status === "cancelled" && styles.statusCancelled]}>
                {appointment.status}
              </Text>
            </Card>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {canChange && !rescheduleMode ? (
              <View style={styles.actions}>
                <Button label="Reschedule" variant="secondary" onPress={() => setRescheduleMode(true)} />
                <Button label="Cancel appointment" variant="destructive" loading={busy} onPress={() => void onCancel()} />
              </View>
            ) : null}

            {canChange && rescheduleMode ? (
              <Card>
                <Text style={styles.sectionTitle}>Pick a new time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {dates.map((d) => (
                    <Pressable
                      key={d.value}
                      style={[styles.dateChip, date === d.value && styles.dateChipActive]}
                      onPress={() => setDate(d.value)}
                    >
                      <Text style={date === d.value ? styles.dateChipTextActive : styles.dateChipText}>{d.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                {loadingSlots ? (
                  <ActivityIndicator color={colors.primaryDark} style={{ marginVertical: spacing.md }} />
                ) : (
                  <View style={styles.slotGrid}>
                    {slots.filter((s) => s.available).map((slot) => (
                      <Pressable
                        key={slot.time}
                        style={[styles.slot, time === slot.time && styles.slotActive]}
                        onPress={() => setTime(slot.time)}
                      >
                        <Text style={time === slot.time ? styles.slotTextActive : styles.slotText}>{slot.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                <Button label="Confirm new time" disabled={!time} loading={busy} onPress={() => void onReschedule()} />
                <Button label="Cancel" variant="ghost" onPress={() => setRescheduleMode(false)} />
              </Card>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  back: { minHeight: 36 },
  service: { fontSize: 20, fontWeight: "700", color: colors.primaryForeground },
  when: { fontSize: 15, color: colors.mutedForeground, marginTop: 8 },
  meta: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  status: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    color: colors.primaryForeground,
  },
  statusCancelled: { backgroundColor: "#FEE2E2", color: colors.destructive },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: spacing.sm, color: colors.primaryForeground },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  dateChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  dateChipText: { fontSize: 13, color: colors.mutedForeground },
  dateChipTextActive: { fontWeight: "600", color: colors.primaryForeground },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  slot: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  slotText: { fontSize: 13, color: colors.primaryForeground },
  slotTextActive: { fontWeight: "600" },
  error: { color: colors.destructive, fontSize: 14, marginTop: spacing.sm },
});
