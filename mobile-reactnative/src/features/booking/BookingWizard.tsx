import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import {
  createBooking,
  fetchAvailability,
  fetchBookingContext,
  fetchLocations,
  fetchServices,
  fetchStaff,
} from "@/booking/api";
import { dateOptions, formatMoney } from "@/booking/format";
import type { BookingLocation, BookingService, BookingStaff } from "@/booking/types";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { colors, radii, spacing } from "@/theme/colors";

type Step = "service" | "staff" | "schedule" | "confirm";

const STEPS: Step[] = ["service", "staff", "schedule", "confirm"];

export function BookingWizard() {
  const router = useRouter();
  const { user, token, tenantSlug } = useAuth();
  const apiConfig = useMemo(() => ({ token: token ?? undefined, tenantSlug: tenantSlug ?? undefined }), [token, tenantSlug]);

  const [step, setStep] = useState<Step>("service");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [currency, setCurrency] = useState("GHS");
  const [services, setServices] = useState<BookingService[]>([]);
  const [staff, setStaff] = useState<BookingStaff[]>([]);
  const [locations, setLocations] = useState<BookingLocation[]>([]);
  const [showLocations, setShowLocations] = useState(false);
  const [slots, setSlots] = useState<{ time: string; label: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [serviceId, setServiceId] = useState<number | null>(null);
  const [staffId, setStaffId] = useState<number | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [date, setDate] = useState(dateOptions()[1]?.value ?? dateOptions()[0].value);
  const [time, setTime] = useState("");

  const selectedService = services.find((s) => s.id === serviceId) ?? null;
  const dates = useMemo(() => dateOptions(14), []);

  const loadCatalog = useCallback(async () => {
    if (!tenantSlug) return;
    setLoading(true);
    setError("");
    try {
      const [ctx, svc, stf, loc] = await Promise.all([
        fetchBookingContext(apiConfig, tenantSlug),
        fetchServices(apiConfig, tenantSlug),
        fetchStaff(apiConfig, tenantSlug),
        fetchLocations(apiConfig, tenantSlug),
      ]);
      setCurrency(ctx.booking?.currency ?? ctx.tenant?.currency ?? "GHS");
      setServices(svc);
      setStaff(stf);
      setLocations(loc.locations);
      setShowLocations(loc.multiple && loc.locations.length > 1);
      if (loc.locations.length === 1) setLocationId(loc.locations[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load salon");
    } finally {
      setLoading(false);
    }
  }, [apiConfig, tenantSlug]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!tenantSlug || !serviceId || step !== "schedule") return;
    let cancelled = false;
    setLoadingSlots(true);
    void fetchAvailability(apiConfig, tenantSlug, {
      date,
      serviceIds: [serviceId],
      staffMemberId: staffId,
      locationId,
    })
      .then((data) => {
        if (!cancelled) {
          setSlots(data);
          if (!data.some((s) => s.time === time && s.available)) setTime("");
        }
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiConfig, tenantSlug, serviceId, staffId, locationId, date, step, time]);

  function buildStartsAt(): string {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(`${date}T00:00:00`);
    d.setHours(h, m ?? 0, 0, 0);
    return d.toISOString();
  }

  async function confirm() {
    if (!tenantSlug || !serviceId || !time || !user) return;
    setSubmitting(true);
    setError("");
    try {
      const booked = await createBooking(apiConfig, tenantSlug, {
        service_ids: [serviceId],
        staff_member_id: staffId,
        location_id: locationId,
        starts_at: buildStartsAt(),
      });
      if (booked.length === 0) throw new Error("Booking saved but no details returned");
      router.replace({
        pathname: "/client/book/success",
        params: { uuid: booked[0].uuid },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  const stepIndex = STEPS.indexOf(step);

  if (!tenantSlug) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Select a salon from the home screen first.</Text>
        <Button label="Go back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  if (loading) return <LoadingState message="Loading services…" />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Header
        title="Book appointment"
        subtitle={`Step ${stepIndex + 1} of ${STEPS.length}`}
        right={<Button label="Back" variant="ghost" onPress={() => router.back()} style={styles.backBtn} />}
      />

      <View style={styles.stepRow}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[styles.stepDot, i <= stepIndex && styles.stepDotActive]}
          />
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {step === "service" ? (
        <Card>
          <Text style={styles.sectionTitle}>Choose a service</Text>
          {services.map((svc) => (
            <Pressable
              key={svc.id}
              style={[styles.option, serviceId === svc.id && styles.optionSelected]}
              onPress={() => setServiceId(svc.id)}
            >
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>{svc.name}</Text>
                <Text style={styles.optionMeta}>
                  {svc.duration_minutes} min · {formatMoney(svc.price_cents, currency)}
                </Text>
              </View>
            </Pressable>
          ))}
          <Button
            label="Continue"
            disabled={!serviceId}
            onPress={() => setStep("staff")}
            style={styles.mt}
          />
        </Card>
      ) : null}

      {step === "staff" ? (
        <Card>
          <Text style={styles.sectionTitle}>Choose stylist (optional)</Text>
          <Pressable
            style={[styles.option, staffId === null && styles.optionSelected]}
            onPress={() => setStaffId(null)}
          >
            <Text style={styles.optionTitle}>Any available</Text>
          </Pressable>
          {staff.map((member) => (
            <Pressable
              key={member.id}
              style={[styles.option, staffId === member.id && styles.optionSelected]}
              onPress={() => setStaffId(member.id)}
            >
              <Text style={styles.optionTitle}>{member.display_name}</Text>
              {member.title ? <Text style={styles.optionMeta}>{member.title}</Text> : null}
            </Pressable>
          ))}
          <View style={styles.row}>
            <Button label="Back" variant="secondary" onPress={() => setStep("service")} style={styles.flex} />
            <Button label="Continue" onPress={() => setStep("schedule")} style={styles.flex} />
          </View>
        </Card>
      ) : null}

      {step === "schedule" ? (
        <Card>
          {showLocations ? (
            <>
              <Text style={styles.sectionTitle}>Location</Text>
              {locations.map((loc) => (
                <Pressable
                  key={loc.id}
                  style={[styles.option, locationId === loc.id && styles.optionSelected]}
                  onPress={() => setLocationId(loc.id)}
                >
                  <Text style={styles.optionTitle}>{loc.name}</Text>
                </Pressable>
              ))}
            </>
          ) : null}

          <Text style={styles.sectionTitle}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {dates.map((d) => (
              <Pressable
                key={d.value}
                style={[styles.dateChip, date === d.value && styles.dateChipActive]}
                onPress={() => setDate(d.value)}
              >
                <Text style={[styles.dateChipText, date === d.value && styles.dateChipTextActive]}>{d.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Time</Text>
          {loadingSlots ? (
            <ActivityIndicator color={colors.primaryDark} style={styles.mt} />
          ) : (
            <View style={styles.slotGrid}>
              {slots.filter((s) => s.available).map((slot) => (
                <Pressable
                  key={slot.time}
                  style={[styles.slot, time === slot.time && styles.slotActive]}
                  onPress={() => setTime(slot.time)}
                >
                  <Text style={[styles.slotText, time === slot.time && styles.slotTextActive]}>{slot.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.row}>
            <Button label="Back" variant="secondary" onPress={() => setStep("staff")} style={styles.flex} />
            <Button label="Continue" disabled={!time} onPress={() => setStep("confirm")} style={styles.flex} />
          </View>
        </Card>
      ) : null}

      {step === "confirm" && selectedService ? (
        <Card>
          <Text style={styles.sectionTitle}>Confirm booking</Text>
          <Text style={styles.summaryLine}>{selectedService.name}</Text>
          <Text style={styles.summaryMeta}>
            {staff.find((s) => s.id === staffId)?.display_name ?? "Any stylist"} ·{" "}
            {dates.find((d) => d.value === date)?.label} · {slots.find((s) => s.time === time)?.label}
          </Text>
          <Text style={styles.summaryPrice}>{formatMoney(selectedService.price_cents, currency)}</Text>
          <View style={styles.row}>
            <Button label="Back" variant="secondary" onPress={() => setStep("schedule")} style={styles.flex} />
            <Button label="Confirm" loading={submitting} onPress={() => void confirm()} style={styles.flex} />
          </View>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: "center", padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
  backBtn: { minHeight: 36 },
  stepRow: { flexDirection: "row", gap: 6, marginBottom: spacing.md },
  stepDot: { flex: 1, height: 4, borderRadius: radii.full, backgroundColor: colors.muted },
  stepDotActive: { backgroundColor: colors.primaryDark },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: colors.primaryForeground, marginBottom: spacing.sm },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primaryDark, backgroundColor: colors.muted },
  optionBody: { gap: 4 },
  optionTitle: { fontSize: 16, fontWeight: "600", color: colors.primaryForeground },
  optionMeta: { fontSize: 13, color: colors.mutedForeground },
  dateScroll: { marginBottom: spacing.md },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  dateChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  dateChipText: { fontSize: 13, color: colors.mutedForeground },
  dateChipTextActive: { color: colors.primaryForeground, fontWeight: "600" },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  slot: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  slotText: { fontSize: 14, color: colors.primaryForeground },
  slotTextActive: { fontWeight: "600" },
  summaryLine: { fontSize: 18, fontWeight: "700", color: colors.primaryForeground },
  summaryMeta: { fontSize: 14, color: colors.mutedForeground, marginTop: 6 },
  summaryPrice: { fontSize: 20, fontWeight: "700", color: colors.primaryDark, marginTop: spacing.md, marginBottom: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  flex: { flex: 1 },
  mt: { marginTop: spacing.md },
  errorText: { color: colors.destructive, marginBottom: spacing.sm, fontSize: 14 },
});
