import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import { LoadingState } from "@/components/LoadingState";
import { StaffFormScreen } from "@/features/staff/StaffFormScreen";
import { fetchStaffLocations } from "@/staff/api";
import type { StaffLocation } from "@/staff/types";

export default function StaffNewScreen() {
  const { portal, token, tenantSlug } = useAuth();
  const [locations, setLocations] = useState<StaffLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !tenantSlug) return;
    void fetchStaffLocations({ token, tenantSlug })
      .then(setLocations)
      .finally(() => setLoading(false));
  }, [token, tenantSlug]);

  if (portal && portal !== "workplace") return <Redirect href="/" />;

  if (!token || !tenantSlug) return <Redirect href="/" />;

  if (loading) return <LoadingState />;

  return <StaffFormScreen auth={{ token, tenantSlug }} locations={locations} />;
}
