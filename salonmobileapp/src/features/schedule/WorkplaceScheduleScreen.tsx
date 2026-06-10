import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, addWeeks, format, isToday, isTomorrow, parseISO, startOfDay, startOfWeek, subWeeks } from "date-fns";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { fetchScheduleEvents } from "@/schedule/api";
import type { ScheduleEvent } from "@/schedule/types";
import { colors, spacing } from "@/theme/colors";

type LayoutMode = "day" | "agenda";

function dayHeading(dateKey: string): string {
  const date = parseISO(dateKey);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMM d");
}

export function WorkplaceScheduleScreen() {
  const router = useRouter();
  const auth = useTenantAuth();
  const [layout, setLayout] = useState<LayoutMode>("agenda");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const rangeFrom = layout === "agenda" ? weekStart : anchor;
  const rangeTo = layout === "agenda" ? addDays(weekStart, 6) : anchor;

  const load = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    try {
      setEvents(
        await fetchScheduleEvents(auth, {
          from: format(rangeFrom, "yyyy-MM-dd"),
          to: format(rangeTo, "yyyy-MM-dd"),
        })
      );
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [auth, rangeFrom, rangeTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const ev of events) {
      const key = format(parseISO(ev.starts_at), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  const subtitle =
    layout === "agenda"
      ? `${format(rangeFrom, "MMM d")} – ${format(rangeTo, "MMM d")}`
      : format(anchor, "EEEE, MMM d");

  return (
    <ResponsiveShell>
      <ScreenHeader title="Schedule" subtitle={subtitle} />

      <View style={styles.modeRow}>
        <Pressable
          onPress={() => setLayout("day")}
          style={[styles.modeChip, layout === "day" && styles.modeChipActive]}
        >
          <Text style={[styles.modeText, layout === "day" && styles.modeTextActive]}>Day</Text>
        </Pressable>
        <Pressable
          onPress={() => setLayout("agenda")}
          style={[styles.modeChip, layout === "agenda" && styles.modeChipActive]}
        >
          <Text style={[styles.modeText, layout === "agenda" && styles.modeTextActive]}>Week agenda</Text>
        </Pressable>
      </View>

      <View style={styles.nav}>
        <Pressable
          onPress={() => setAnchor((d: Date) => (layout === "agenda" ? subWeeks(d, 1) : addDays(d, -1)))}
          style={styles.chip}
        >
          <Text style={styles.chipText}>Prev</Text>
        </Pressable>
        <Pressable onPress={() => setAnchor(startOfDay(new Date()))} style={styles.chip}>
          <Text style={styles.chipText}>Today</Text>
        </Pressable>
        <Pressable
          onPress={() => setAnchor((d: Date) => (layout === "agenda" ? addWeeks(d, 1) : addDays(d, 1)))}
          style={styles.chip}
        >
          <Text style={styles.chipText}>Next</Text>
        </Pressable>
      </View>

      {loading ? (
        <LoadingState message="Loading schedule…" />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {grouped.map(([dateKey, rows]) => (
            <View key={dateKey} style={styles.section}>
              <Text style={styles.sectionTitle}>{dayHeading(dateKey)}</Text>
              {[...rows]
                .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
                .map((ev) => (
                  <Pressable
                    key={ev.id}
                    style={[
                      styles.card,
                      ev.type === "break" && styles.breakCard,
                      ev.type === "time_off" && styles.timeOffCard,
                    ]}
                    onPress={() => {
                      const uuid = ev.meta?.appointment_uuid;
                      if (typeof uuid === "string") {
                        router.push(`/workplace/bookings/${uuid}`);
                      }
                    }}
                  >
                    <Text style={styles.cardTitle}>{ev.title}</Text>
                    <Text style={styles.cardMeta}>
                      {format(parseISO(ev.starts_at), "h:mm a")} –{" "}
                      {format(parseISO(ev.ends_at), "h:mm a")}
                      {ev.status ? ` · ${ev.status}` : ""}
                    </Text>
                  </Pressable>
                ))}
            </View>
          ))}
          {events.length === 0 ? (
            <Text style={styles.empty}>No events in this range.</Text>
          ) : null}
        </ScrollView>
      )}
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  modeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  modeTextActive: { color: colors.primaryForeground },
  nav: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.primaryForeground },
  list: { paddingBottom: spacing.xl, gap: spacing.md },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.mutedForeground,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakCard: { borderStyle: "dashed", opacity: 0.85 },
  timeOffCard: { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.primaryForeground },
  cardMeta: { fontSize: 13, color: colors.mutedForeground, marginTop: 4 },
  empty: { textAlign: "center", color: colors.mutedForeground, marginTop: spacing.lg },
});
