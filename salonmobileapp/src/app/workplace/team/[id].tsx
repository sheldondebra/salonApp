import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StaffProfilePanel } from "@/features/staff/StaffProfilePanel";
import { deactivateStaffMember, fetchStaffMember } from "@/staff/api";
import type { StaffMember } from "@/staff/types";

export default function StaffProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { portal, token, tenantSlug } = useAuth();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token || !tenantSlug || !id) return;
    setLoading(true);
    try {
      setStaff(await fetchStaffMember({ token, tenantSlug }, Number(id)));
    } catch {
      setStaff(null);
    } finally {
      setLoading(false);
    }
  }, [token, tenantSlug, id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (portal && portal !== "workplace") return <Redirect href="/" />;

  if (loading) return <LoadingState message="Loading profile…" />;

  if (!staff) {
    return (
      <ResponsiveShell reserveTabBar={false}>
        <ScreenHeader title="Staff" subtitle="Not found" />
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </ResponsiveShell>
    );
  }

  return (
    <ResponsiveShell reserveTabBar={false}>
      <ScreenHeader title="Staff profile" onSignOut={undefined} />
      <ScrollView>
        <StaffProfilePanel
          staff={staff}
          canEdit
          canDeactivate
          onServices={() => router.push(`/workplace/team/${id}/services`)}
          onHours={() => router.push(`/workplace/team/${id}/hours`)}
          onEdit={() => router.push(`/workplace/team/${id}/edit`)}
          onDeactivate={() => {
            if (!token || !tenantSlug) return;
            Alert.alert("Deactivate?", staff.display_name, [
              { text: "Cancel", style: "cancel" },
              {
                text: "Deactivate",
                style: "destructive",
                onPress: () => {
                  void deactivateStaffMember({ token, tenantSlug }, staff.id)
                    .then(() => router.replace("/workplace/team"))
                    .catch((err) =>
                      Alert.alert("Error", err instanceof ApiError ? err.message : "Failed")
                    );
                },
              },
            ]);
          }}
        />
        <Button label="Back to staff" variant="secondary" onPress={() => router.back()} />
      </ScrollView>
    </ResponsiveShell>
  );
}
