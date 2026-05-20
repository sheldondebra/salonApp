import { Redirect } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import { PortalHome } from "@/components/PortalHome";

export default function WorkplaceHome() {
  const { portal } = useAuth();
  if (portal && portal !== "workplace") return <Redirect href="/" />;
  return (
    <PortalHome
      title="Salon dashboard"
      description="Revenue, bookings, and team tools for owners and managers."
    />
  );
}
