import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "@/api/client";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { fetchMtnMomoContext, requestMtnConnection, runMtnHealthCheck } from "@/payment-settings/api";
import { PROVIDER_STATUS_LABELS, type TenantMtnMomoContext } from "@/payment-settings/types";
import { colors, radii, spacing } from "@/theme/colors";

type Props = {
  compact?: boolean;
};

export function TenantMtnMomoConnectionPanel({ compact = false }: Props) {
  const auth = useTenantAuth();
  const [ctx, setCtx] = useState<TenantMtnMomoContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      setCtx(await fetchMtnMomoContext(auth));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load MTN connection");
    }
  }, [auth]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  async function onRequest() {
    if (!auth) return;
    try {
      const res = await requestMtnConnection(auth);
      Alert.alert("Connection requested", res.message);
      await load();
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "Could not request connection");
    }
  }

  async function onHealthCheck() {
    if (!auth) return;
    setChecking(true);
    try {
      const res = await runMtnHealthCheck(auth);
      Alert.alert(res.ok ? "Health check" : "Health check failed", res.message);
      await load();
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "Health check failed");
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return <Text style={styles.loading}>Loading MTN connection…</Text>;
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (!ctx) return null;

  const account = ctx.uses_platform_account ? ctx.platform_account : ctx.tenant_account;
  const status = account?.status ?? "not_configured";

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>MTN MoMo</Text>
      <Card>
        <View style={styles.row}>
          <Ionicons name="phone-portrait-outline" size={22} color={colors.primaryDark} />
          <View style={styles.flex}>
            <Text style={styles.status}>{PROVIDER_STATUS_LABELS[status] ?? status}</Text>
            <Text style={styles.meta}>
              {ctx.uses_platform_account ? "Via Schedelux platform" : "Your merchant account"}
            </Text>
            {account ? (
              <Text style={styles.meta}>
                {account.environment} · {account.country} · {account.currency}
              </Text>
            ) : null}
          </View>
        </View>

        {account?.last_error ? <Text style={styles.error}>{account.last_error}</Text> : null}

        {ctx.uses_platform_account ? (
          <Text style={styles.hint}>
            Payments collect through Schedelux. Your wallet shows platform collections — not your personal MoMo balance.
          </Text>
        ) : null}

        {!compact && ctx.can_manage_own_account ? (
          <View style={styles.actions}>
            {!ctx.tenant_account || ctx.tenant_account.status === "not_configured" ? (
              <Button label="Request MTN connection" variant="secondary" onPress={() => void onRequest()} />
            ) : null}
            {ctx.tenant_account ? (
              <Button
                label={checking ? "Checking…" : "Run health check"}
                variant="secondary"
                onPress={() => void onHealthCheck()}
                disabled={checking}
              />
            ) : null}
          </View>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  title: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, color: colors.mutedForeground },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  flex: { flex: 1, gap: 4 },
  status: { fontSize: 16, fontWeight: "700", color: colors.black },
  meta: { fontSize: 13, color: colors.mutedForeground },
  hint: { marginTop: spacing.sm, fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
  actions: { marginTop: spacing.sm, gap: spacing.sm },
  loading: { fontSize: 14, color: colors.mutedForeground },
  error: { fontSize: 13, color: colors.destructive, marginTop: spacing.xs },
});
