import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  copyStaffWorkingHours,
  fetchStaffMember,
  fetchStaffWorkingHours,
  saveStaffWorkingHours,
} from "@/staff/api";
import type { StaffMember, StaffWorkingHourDay } from "@/staff/types";
import { colors, radii, spacing } from "@/theme/colors";

const DEFAULT_DAYS: StaffWorkingHourDay[] = [1, 2, 3, 4, 5, 6, 7].map((dow) => ({
  day_of_week: dow,
  day_label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dow - 1],
  is_working_day: dow <= 5,
  start_time: dow <= 5 ? "09:00" : null,
  end_time: dow <= 5 ? "18:00" : null,
}));

type StaffWorkingHoursScreenProps = {
  staffId: number;
  readOnly?: boolean;
};

export function StaffWorkingHoursScreen({ staffId, readOnly }: StaffWorkingHoursScreenProps) {
  const router = useRouter();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [days, setDays] = useState<StaffWorkingHourDay[]>(DEFAULT_DAYS);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canEdit = !readOnly;

  const load = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    try {
      const [member, hours] = await Promise.all([
        fetchStaffMember(auth, staffId),
        fetchStaffWorkingHours(auth, staffId),
      ]);
      setStaff(member);
      setDays(hours.days.length ? hours.days : DEFAULT_DAYS);
      const s = hours.meta?.summary;
      setSummary(s ? `${s.working_days} days · ${s.weekly_hours}h/week` : "");
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, [auth, staffId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateDay = (dow: number, patch: Partial<StaffWorkingHourDay>) => {
    setDays((prev) => prev.map((d) => (d.day_of_week === dow ? { ...d, ...patch } : d)));
  };

  const save = async () => {
    if (!auth || !staff) return;
    setSaving(true);
    try {
      const res = await saveStaffWorkingHours(auth, staffId, {
        location_id: staff.location_id ?? null,
        days: days.map((d) => ({
          day_of_week: d.day_of_week,
          is_working_day: d.is_working_day,
          start_time: d.is_working_day ? d.start_time : null,
          end_time: d.is_working_day ? d.end_time : null,
        })),
      });
      setDays(res.days);
      const s = res.meta?.summary;
      setSummary(s ? `${s.working_days} days · ${s.weekly_hours}h/week` : "");
      Alert.alert("Saved", "Working hours updated.");
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const copyWeekdays = async () => {
    if (!auth) return;
    setSaving(true);
    try {
      const res = await copyStaffWorkingHours(auth, staffId, 1, [2, 3, 4, 5]);
      setDays(res.days);
      Alert.alert("Done", "Monday copied to Tue–Fri.");
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "Copy failed");
    } finally {
      setSaving(false);
    }
  };

  const dayGrid = (
    <View style={[styles.grid, useSplitLayout && styles.gridTablet]}>
      {days.map((day) => (
        <View key={day.day_of_week} style={[styles.dayCard, useSplitLayout && styles.dayCardTablet]}>
          <View style={styles.dayHead}>
            <Text style={styles.dayLabel}>{day.day_label}</Text>
            {canEdit ? (
              <Switch
                value={day.is_working_day}
                onValueChange={(on) =>
                  updateDay(day.day_of_week, {
                    is_working_day: on,
                    start_time: on ? day.start_time ?? "09:00" : null,
                    end_time: on ? day.end_time ?? "18:00" : null,
                  })
                }
                trackColor={{ true: colors.accent }}
              />
            ) : (
              <Text style={styles.offBadge}>{day.is_working_day ? "On" : "Off"}</Text>
            )}
          </View>
          {day.is_working_day ? (
            <View style={styles.times}>
              <View style={styles.timeField}>
                <Text style={styles.timeLabel}>Start</Text>
                <TextInput
                  style={styles.timeInput}
                  value={day.start_time ?? ""}
                  editable={canEdit}
                  onChangeText={(t) => updateDay(day.day_of_week, { start_time: t })}
                  placeholder="09:00"
                />
              </View>
              <View style={styles.timeField}>
                <Text style={styles.timeLabel}>End</Text>
                <TextInput
                  style={styles.timeInput}
                  value={day.end_time ?? ""}
                  editable={canEdit}
                  onChangeText={(t) => updateDay(day.day_of_week, { end_time: t })}
                  placeholder="18:00"
                />
              </View>
            </View>
          ) : (
            <Text style={styles.closed}>Closed</Text>
          )}
        </View>
      ))}
    </View>
  );

  if (loading) return <LoadingState message="Loading schedule…" />;

  return (
    <ResponsiveShell reserveTabBar={false}>
      <ScreenHeader
        title="Working hours"
        subtitle={staff ? `${staff.display_name}${summary ? ` · ${summary}` : ""}` : ""}
      />
      <Button label="Back" variant="secondary" onPress={() => router.back()} style={styles.backBtn} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {canEdit ? (
          <Pressable onPress={() => void copyWeekdays()} style={styles.copyBtn} disabled={saving}>
            <Text style={styles.copyText}>Copy Monday → weekdays</Text>
          </Pressable>
        ) : null}
        {dayGrid}
        {canEdit ? (
          <Button
            label={saving ? "Saving…" : "Save hours"}
            onPress={() => void save()}
            disabled={saving}
          />
        ) : null}
      </ScrollView>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  backBtn: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.md },
  copyBtn: {
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copyText: { fontSize: 13, fontWeight: "600", color: colors.accent },
  grid: { gap: spacing.sm },
  gridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  dayCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  dayCardTablet: {
    width: "48%",
    minWidth: 200,
  },
  dayHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayLabel: { fontSize: 15, fontWeight: "700", color: colors.black },
  offBadge: { fontSize: 12, color: colors.mutedForeground },
  times: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  timeField: { flex: 1 },
  timeLabel: { fontSize: 11, color: colors.mutedForeground },
  timeInput: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    fontSize: 15,
    color: colors.black,
  },
  closed: { marginTop: spacing.sm, fontSize: 13, color: colors.mutedForeground, fontStyle: "italic" },
});
