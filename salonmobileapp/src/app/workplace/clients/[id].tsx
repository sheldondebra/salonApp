import { Redirect, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import { WorkplaceClientProfileScreen } from "@/features/workplace/WorkplaceClientProfileScreen";

export default function ClientProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { portal } = useAuth();

  if (portal && portal !== "workplace") return <Redirect href="/" />;

  const clientId = Number(id);
  if (!id || Number.isNaN(clientId)) return <Redirect href="/workplace/clients" />;

  return <WorkplaceClientProfileScreen clientId={clientId} />;
}
