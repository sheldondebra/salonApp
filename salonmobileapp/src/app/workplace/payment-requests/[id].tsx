import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PaymentRequestDetailPanel } from "@/features/payment-requests/PaymentRequestDetailPanel";
import {
  cancelPaymentRequest,
  fetchPaymentRequest,
  retryPaymentRequest,
  verifyPaymentRequest,
} from "@/payment-requests/api";
import type { PaymentRequest } from "@/payment-requests/types";
import { spacing } from "@/theme/colors";

export default function PaymentRequestDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const auth = useTenantAuth();
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"verify" | "cancel" | "retry" | null>(null);

  const load = useCallback(async () => {
    if (!auth || !id) return;
    setLoading(true);
    setError("");
    try {
      setRequest(await fetchPaymentRequest(auth, Number(id)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load request");
    } finally {
      setLoading(false);
    }
  }, [auth, id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!auth || !request || request.gateway !== "mtn_momo") return;
    if (["success", "failed", "cancelled", "expired"].includes(request.status)) return;
    const timer = setInterval(() => {
      void verifyPaymentRequest(auth, request.id)
        .then(setRequest)
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [auth, request]);

  async function runAction(action: "verify" | "cancel" | "retry") {
    if (!auth || !request) return;
    setBusy(action);
    try {
      const updated =
        action === "verify"
          ? await verifyPaymentRequest(auth, request.id)
          : action === "cancel"
            ? await cancelPaymentRequest(auth, request.id)
            : await retryPaymentRequest(auth, request.id);
      setRequest(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  const isMtn = request?.gateway === "mtn_momo";
  const canCancel = request?.status === "pending" || request?.status === "processing";
  const canRetry = isMtn && (request?.status === "failed" || request?.status === "expired");

  return (
    <ResponsiveShell>
      <ScreenHeader title="MoMo request" subtitle="Payment status" />
      {loading ? (
        <LoadingState message="Loading…" />
      ) : error && !request ? (
        <EmptyState title="Could not load" description={error} />
      ) : request ? (
        <View style={styles.wrap}>
          <PaymentRequestDetailPanel
            request={request}
            busy={busy}
            canVerify={isMtn}
            canCancel={canCancel}
            canRetry={canRetry}
            onVerify={() => void runAction("verify")}
            onCancel={() => void runAction("cancel")}
            onRetry={() => void runAction("retry")}
          />
          {error ? <EmptyState title="Action failed" description={error} /> : null}
          <Button label="Back to list" variant="secondary" onPress={() => router.back()} />
        </View>
      ) : (
        <EmptyState title="Not found" description="This payment request could not be found." />
      )}
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
});
