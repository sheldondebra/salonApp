import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StaffProfilePanel } from "@/features/staff/StaffProfilePanel";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { deactivateStaffMember, fetchStaffMember } from "@/staff/api";
import { invalidateStaffBundle, loadStaffBundle } from "@/staff/cache";
import type { StaffMember, StaffStats } from "@/staff/types";
import { colors, radii, spacing } from "@/theme/colors";

export function WorkplaceStaffScreen() {
  const router = useRouter();
  const { logout, tenantSlug } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [query, setQuery] = useState("");
  const [bookableOnly, setBookableOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const inFlight = useRef(false);
  const queryRef = useRef(query);
  queryRef.current = query;

  const load = useCallback(
    async (force = false) => {
      if (!auth || inFlight.current) return;
      inFlight.current = true;
      setError("");
      try {
        const bundle = await loadStaffBundle(auth, queryRef.current, bookableOnly, force);
        setStats(bundle.stats);
        setStaff(bundle.staff);
        setLocations(bundle.locations);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load staff");
        setStaff([]);
      } finally {
        inFlight.current = false;
      }
    },
    [auth, bookableOnly]
  );

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      void load().finally(() => setLoading(false));
    }, query ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  useEffect(() => {
    if (useSplitLayout && staff.length > 0 && !selected) {
      setSelected(staff[0]);
    }
  }, [useSplitLayout, staff, selected]);

  async function selectStaff(member: StaffMember) {
    if (!auth) return;
    setSelected(member);
    if (useSplitLayout) {
      try {
        setSelected(await fetchStaffMember(auth, member.id));
      } catch {
        /* keep list row data */
      }
    }
  }

  function openProfile(member: StaffMember) {
    if (useSplitLayout) {
      void selectStaff(member);
    } else {
      router.push(`/workplace/team/${member.id}`);
    }
  }

  async function handleDeactivate() {
    if (!auth || !selected) return;
    Alert.alert("Deactivate staff?", selected.display_name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate",
        style: "destructive",
        onPress: () => {
          void deactivateStaffMember(auth, selected.id)
            .then(() => {
              setSelected(null);
              if (auth) invalidateStaffBundle(auth);
              void load(true);
            })
            .catch((err) =>
              Alert.alert("Error", err instanceof ApiError ? err.message : "Failed")
            );
        },
      },
    ]);
  }

  if (!tenantSlug) {
    return (
      <ResponsiveShell>
        <ScreenHeader title="Staff" />
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  if (loading) {
    return <LoadingState message="Loading staff…" />;
  }

  const listPane = (
    <View style={[styles.listPane, useSplitLayout && styles.listPaneSplit]}>
      {stats ? (
        <IconStatGrid>
          <IconStatCard icon="people-outline" label="Total" value={String(stats.total)} />
          <IconStatCard icon="checkmark-circle-outline" label="Active" value={String(stats.active)} tint="#059669" />
          <IconStatCard icon="calendar-outline" label="Bookable" value={String(stats.bookable)} />
          <IconStatCard icon="time-outline" label="On leave" value={String(stats.on_leave_today)} tint="#D97706" />
        </IconStatGrid>
      ) : null}

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={20} color={colors.mutedForeground} />
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search staff…"
          placeholderTextColor={colors.mutedForeground}
          onSubmitEditing={() => void load()}
        />
      </View>

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setBookableOnly((v) => !v)}
          style={[styles.filterChip, bookableOnly && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, bookableOnly && styles.filterTextActive]}>Bookable only</Text>
        </Pressable>
        <Button label="Search" variant="secondary" onPress={() => void load()} style={styles.searchBtn} />
        <Pressable
          onPress={() => router.push("/workplace/team/new")}
          style={styles.addFab}
          accessibilityLabel="Add staff"
        >
          <Ionicons name="add" size={24} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : staff.length === 0 ? (
        <EmptyState title="No staff" description="Add your first team member." />
      ) : (
        staff.map((s) => (
          <ListRow
            key={s.uuid}
            icon="person-outline"
            iconTint={s.color_code ?? colors.accent}
            title={s.display_name}
            subtitle={[s.job_title ?? s.title, s.location?.name].filter(Boolean).join(" · ")}
            right={s.is_bookable ? "Bookable" : undefined}
            onPress={() => openProfile(s)}
          />
        ))
      )}
    </View>
  );

  const detailPane =
    useSplitLayout && selected ? (
      <View style={styles.detailPane}>
        <StaffProfilePanel
          staff={selected}
          canEdit
          canDeactivate
          onServices={() => router.push(`/workplace/team/${selected.id}/services`)}
          onHours={() => router.push(`/workplace/team/${selected.id}/hours`)}
          onEdit={() => router.push(`/workplace/team/${selected.id}/edit`)}
          onDeactivate={() => void handleDeactivate()}
        />
      </View>
    ) : useSplitLayout ? (
      <View style={styles.detailPane}>
        <EmptyState title="Select staff" description="Choose a team member from the list." />
      </View>
    ) : null;

  return (
    <ResponsiveShell scroll={false} style={styles.shell}>
      <View style={styles.body}>
        <ScrollView
          style={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                if (auth) invalidateStaffBundle(auth);
                void load(true).finally(() => setRefreshing(false));
              }}
            />
          }
          contentContainerStyle={useSplitLayout ? styles.splitScroll : undefined}
        >
          {!useSplitLayout ? (
            <ScreenHeader
              title="Staff"
              subtitle={`${stats?.total ?? staff.length} team members`}
              onRefresh={() => void load(true)}
              onSignOut={() => void logout()}
            />
          ) : (
            <ScreenHeader
              title="Staff"
              subtitle={`${stats?.available_now ?? 0} available now`}
              onRefresh={() => void load(true)}
              onSignOut={() => void logout()}
            />
          )}

          {useSplitLayout ? (
            <View style={styles.split}>
              {listPane}
              {detailPane}
            </View>
          ) : (
            listPane
          )}
        </ScrollView>
      </View>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { flex: 1 },
  scroll: { flex: 1 },
  splitScroll: { flexGrow: 1 },
  split: { flexDirection: "row", gap: spacing.lg, minHeight: 480, alignItems: "flex-start" },
  listPane: { gap: spacing.md },
  listPaneSplit: { flex: 1, minWidth: 280, maxWidth: 420 },
  detailPane: {
    flex: 1,
    minWidth: 300,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  search: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.black },
  filterRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  filterText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  filterTextActive: { color: colors.primaryForeground },
  searchBtn: { minHeight: 40 },
  addFab: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  error: { color: colors.destructive },
});
