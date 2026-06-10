import { useCallback, useEffect, useState } from "react";
import { Redirect, type Href } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import { getIntroSeen, setIntroSeen } from "@/auth/intro";
import type { MobilePortal } from "@/auth/types";
import { LoadingState } from "@/components/LoadingState";
import { IntroCarousel } from "@/features/intro/IntroCarousel";

function portalHref(portal: MobilePortal): Href {
  const routes = {
    admin: "/admin",
    workplace: "/workplace",
    staff: "/staff",
    client: "/client",
  } as const satisfies Record<MobilePortal, Href>;

  return routes[portal];
}

export default function Index() {
  const { loading, user, portal } = useAuth();
  const [introChecked, setIntroChecked] = useState(false);
  const [introSeen, setIntroSeenState] = useState(true);

  useEffect(() => {
    getIntroSeen()
      .then(setIntroSeenState)
      .finally(() => setIntroChecked(true));
  }, []);

  const finishIntro = useCallback(async () => {
    await setIntroSeen();
    setIntroSeenState(true);
  }, []);

  if (!introChecked || loading) {
    return <LoadingState message="Starting Schedelux…" />;
  }

  if (!introSeen) {
    return <IntroCarousel onComplete={finishIntro} />;
  }

  if (!user || !portal) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={portalHref(portal)} />;
}
