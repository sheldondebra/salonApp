import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthContext";
import { fetchBookingDetail } from "@/booking/api";
import { formatAppointmentWhen, formatMoney } from "@/booking/format";
import type { Appointment } from "@/booking/types";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { colors, spacing } from "@/theme/colors";

export default function BookingSuccessScreen() {
  const { uuid, waitlist, date } = useLocalSearchParams<{ uuid?: string; waitlist?: string; date?: string }>();
  const isWaitlist = waitlist === "1";
  const router = useRouter();
  const { portal, token, tenantSlug } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(!isWaitlist);

  useEffect(() => {
    if (isWaitlist || !token || !tenantSlug || !uuid) return;
    void fetchBookingDetail({ token, tenantSlug }, tenantSlug, uuid)
      .then(setAppointment)
      .catch(() => setAppointment(null))
      .finally(() => setLoading(false));
  }, [token, tenantSlug, uuid, isWaitlist]);

  if (portal && portal !== "client") return <Redirect href="/" />;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.wrap}>
        <Header
          title={isWaitlist ? "You're on the waitlist" : "Booking confirmed"}
          subtitle={isWaitlist ? "We'll notify you when a slot opens" : "You're all set"}
        />
        {loading ? (
          <LoadingState />
        ) : isWaitlist ? (
          <Card>
            <Text style={styles.when}>
              {date ? `Preferred date: ${date}` : "We saved your waitlist request."}
            </Text>
            {uuid ? <Text style={styles.ref}>Ref {uuid.slice(0, 8).toUpperCase()}</Text> : null}
          </Card>
        ) : appointment ? (
          <Card>
            <Text style={styles.service}>{appointment.service?.name ?? "Service"}</Text>
            <Text style={styles.when}>{formatAppointmentWhen(appointment.starts_at)}</Text>
            <Text style={styles.staff}>{appointment.staff_member?.display_name ?? "Stylist TBD"}</Text>
            {appointment.service?.price_cents ? (
              <Text style={styles.price}>{formatMoney(appointment.service.price_cents)}</Text>
            ) : null}
            <Text style={styles.ref}>Ref {appointment.uuid.slice(0, 8).toUpperCase()}</Text>
          </Card>
        ) : (
          <Card>
            <Text style={styles.when}>Your appointment was booked successfully.</Text>
          </Card>
        )}
        <Button label="View my bookings" onPress={() => router.replace("/client/bookings")} />
        <Button label="Back home" variant="secondary" onPress={() => router.replace("/client")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, padding: spacing.lg, gap: spacing.md },
  service: { fontSize: 20, fontWeight: "700", color: colors.primaryForeground },
  when: { fontSize: 15, color: colors.mutedForeground, marginTop: 8 },
  staff: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  price: { fontSize: 18, fontWeight: "600", color: colors.primaryDark, marginTop: spacing.md },
  ref: { fontSize: 12, color: colors.mutedForeground, marginTop: spacing.sm },
});
