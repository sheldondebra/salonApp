import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthContext";
import { BookingWizard } from "@/features/booking/BookingWizard";
import { colors } from "@/theme/colors";

export default function ClientBookScreen() {
  const { portal } = useAuth();
  if (portal && portal !== "client") return <Redirect href="/" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
      <BookingWizard />
    </SafeAreaView>
  );
}
