import { useRouter } from "expo-router";
import { IntroCarousel } from "@/features/intro/IntroCarousel";
import { setIntroSeen } from "@/auth/intro";

export default function IntroScreen() {
  const router = useRouter();

  const finish = async () => {
    await setIntroSeen();
    router.replace("/");
  };

  return <IntroCarousel onComplete={finish} />;
}
