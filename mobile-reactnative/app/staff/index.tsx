import { Redirect } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import { PortalHome } from "@/components/PortalHome";

export default function StaffHome() {
  const { portal } = useAuth();
  if (portal && portal !== "staff") return <Redirect href="/" />;
  return (
    <PortalHome
      title="Staff portal"
      description="Today's appointments and client notes at your fingertips."
    />
  );
}
