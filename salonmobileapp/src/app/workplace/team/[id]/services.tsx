import { Redirect, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import { StaffServicesScreen } from "@/features/staff/StaffServicesScreen";

export default function StaffServicesRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { portal } = useAuth();

  if (portal && portal !== "workplace") return <Redirect href="/" />;

  const staffId = Number(id);
  if (!Number.isFinite(staffId)) return <Redirect href="/workplace/team" />;

  return <StaffServicesScreen staffId={staffId} />;
}
