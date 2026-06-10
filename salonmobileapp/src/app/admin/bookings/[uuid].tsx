import { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { fetchAdminAppointment, updateAdminAppointment } from "@/admin/api";
import type { AdminAppointment } from "@/admin/types";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { BookingDetailView } from "@/features/booking/BookingDetailView";
import type { BookingStatus } from "@/features/booking/bookingDetailTheme";
import { colors, spacing } from "@/theme/colors";

export default function AdminBookingDetailScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const { portal, token } = useAuth();
  const [apt, setApt] = useState<AdminAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token || !uuid) return;
    setLoading(true);
    setError("");
    try {
      setApt(await fetchAdminAppointment({ token }, String(uuid)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load booking");
      setApt(null);
    } finally {
      setLoading(false);
    }
  }, [token, uuid]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(status: BookingStatus) {
    if (!token || !uuid) return;
    setSaving(true);
    setError("");
    try {
      setApt(await updateAdminAppointment({ token }, String(uuid), { status }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (portal && portal !== "admin") return <Redirect href="/" />;

  if (loading) return <LoadingState message="Loading booking…" />;

  if (!apt) {
    return (
      <ResponsiveShell>
        <ScreenHeader title="Booking" subtitle="Platform admin" />
        <Text style={{ color: colors.destructive, marginBottom: spacing.md }}>
          {error || "Not found"}
        </Text>
        <Button label="Go back" variant="secondary" onPress={() => router.back()} />
        <Button label="Retry" onPress={() => void load()} />
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
        showSalon
      />
    </ResponsiveShell>
  );
}
