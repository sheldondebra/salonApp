import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { LoadingState } from "@/components/LoadingState";
import { env } from "@/config/env";
import { colors, spacing } from "@/theme/colors";

export default function LoginScreen() {
  const { loading, user, portal, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <LoadingState message="Checking session…" />;
  }

  if (user && portal) {
    return <Redirect href="/" />;
  }

  async function onSubmit() {
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.logo}>Schedelux</Text>
            <Text style={styles.tagline}>Salon & spa management, on the go</Text>
          </View>

          <Card>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>Use your Schedelux account</Text>

            <View style={styles.form}>
              <Input
                label="Email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@salon.com"
              />
              <Input
                label="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                onSubmitEditing={() => void onSubmit()}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button label="Sign in" loading={submitting} onPress={() => void onSubmit()} />
            </View>
          </Card>

          <Text style={styles.portalHint}>
            Salon owners see their workspace dashboard. Platform admins see all salons — use an
            admin account if you need the platform overview.
          </Text>
          <Text style={styles.apiHint}>API: {env.apiUrl}</Text>
          <Link href="/" style={styles.link}>
            <Text style={styles.linkText}>Back to home</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.lg,
  },
  brand: { alignItems: "center", gap: 6, marginBottom: spacing.sm },
  logo: { fontSize: 32, fontWeight: "800", color: colors.primaryForeground },
  tagline: { fontSize: 14, color: colors.mutedForeground, textAlign: "center" },
  title: { fontSize: 22, fontWeight: "700", color: colors.primaryForeground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 4, marginBottom: spacing.md },
  form: { gap: spacing.md },
  error: { fontSize: 13, color: colors.destructive },
  portalHint: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },
  apiHint: { fontSize: 11, color: colors.mutedForeground, textAlign: "center" },
  link: { alignSelf: "center" },
  linkText: { fontSize: 14, color: colors.primaryDark, fontWeight: "500" },
});
