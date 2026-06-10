import { useEffect, useState } from "react";
import { Redirect, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import { LoadingState } from "@/components/LoadingState";
import { StaffFormScreen } from "@/features/staff/StaffFormScreen";
import { fetchStaffLocations, fetchStaffMember } from "@/staff/api";
import type { StaffLocation, StaffMember } from "@/staff/types";

export default function StaffEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { portal, token, tenantSlug } = useAuth();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [locations, setLocations] = useState<StaffLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !tenantSlug || !id) return;
    void Promise.all([
      fetchStaffMember({ token, tenantSlug }, Number(id)),
      fetchStaffLocations({ token, tenantSlug }),
    ])
      .then(([s, locs]) => {
        setStaff(s);
        setLocations(locs);
      })
      .finally(() => setLoading(false));
  }, [token, tenantSlug, id]);

  if (portal && portal !== "workplace") return <Redirect href="/" />;

  if (!token || !tenantSlug || !staff) {
    if (loading) return <LoadingState />;
    return <Redirect href="/workplace/team" />;
  }

  return <StaffFormScreen auth={{ token, tenantSlug }} locations={locations} initial={staff} />;
}
