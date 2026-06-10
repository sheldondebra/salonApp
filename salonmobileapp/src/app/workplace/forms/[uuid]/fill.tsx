import { useLocalSearchParams } from "expo-router";
import { FormFillScreen } from "@/features/forms/FormFillScreen";

export default function FormFillRoute() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  if (!uuid || typeof uuid !== "string") return null;
  return <FormFillScreen formUuid={uuid} />;
}
