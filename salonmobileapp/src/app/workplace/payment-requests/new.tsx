import { CreatePaymentRequestScreen } from "@/features/payment-requests/CreatePaymentRequestScreen";
import { prefillFromParams } from "@/payment-requests/prefill";
import { useLocalSearchParams } from "expo-router";

export default function NewPaymentRequestRoute() {
  const params = useLocalSearchParams();
  const prefill = prefillFromParams(params as Record<string, string | string[] | undefined>);

  return <CreatePaymentRequestScreen prefill={prefill} />;
}
