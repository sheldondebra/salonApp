import { Redirect } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import type { MobilePortal } from "@/auth/types";
import { LoadingState } from "@/components/LoadingState";

function portalHref(portal: MobilePortal): string {
  switch (portal) {
    case "admin":
      return "/admin";
    case "workplace":
      return "/workplace";
    case "staff":
      return "/staff";
    case "client":
      return "/client";
  }
}

export default function Index() {
  const { loading, user, portal } = useAuth();

  if (loading) {
    return <LoadingState message="Starting BeautyOS…" />;
  }

  if (!user || !portal) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={portalHref(portal)} />;
}
