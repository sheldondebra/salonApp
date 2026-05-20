import { Redirect } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import { PortalHome } from "@/components/PortalHome";

export default function AdminHome() {
  const { portal } = useAuth();
  if (portal && portal !== "admin") return <Redirect href="/" />;
  return (
    <PortalHome
      title="Platform admin"
      description="Monitor tenants, billing, and platform health from mobile."
    />
  );
}
