import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import {
  fetchFormLibrary,
  fetchFormTemplates,
  importFormLibrary,
  type FormTemplate,
  type FormTemplateLibraryItem,
} from "@/workplace/api";
import { colors, radii, spacing } from "@/theme/colors";

export function WorkplaceFormsScreen() {
  const router = useRouter();
  const { token, tenantSlug } = useAuth();
  const auth = useMemo(
    () => (token && tenantSlug ? { token, tenantSlug } : null),
    [token, tenantSlug]
  );

  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [library, setLibrary] = useState<FormTemplateLibraryItem[]>([]);
  const [importing, setImporting] = useState<string | null>(null);

  const load = useCallback(
    async (quiet = false) => {
      if (!auth) return;
      if (!quiet) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await fetchFormTemplates(auth, { per_page: 50 });
        setTemplates(res.data ?? []);
      } catch (e) {
        Alert.alert("Error", e instanceof ApiError ? e.message : "Could not load forms");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [auth]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const openLibrary = async () => {
    if (!auth) return;
    setLibraryOpen(true);
    try {
      setLibrary(await fetchFormLibrary(auth));
    } catch (e) {
      Alert.alert("Error", e instanceof ApiError ? e.message : "Could not load library");
    }
  };

  const importTemplate = async (slug: string) => {
    if (!auth) return;
    setImporting(slug);
    try {
      const t = await importFormLibrary(auth, slug);
      setLibraryOpen(false);
      await load(true);
      router.push(`/workplace/forms/${t.uuid}` as never);
    } catch (e) {
      Alert.alert("Error", e instanceof ApiError ? e.message : "Import failed");
    } finally {
      setImporting(null);
    }
  };

  if (loading) {
    return (
      <ResponsiveShell>
        <LoadingState message="Loading forms…" />
      </ResponsiveShell>
    );
  }

  return (
    <ResponsiveShell>
      <ScreenHeader title="Forms" subtitle="Intake forms and checklists" />
      <View style={styles.toolbar}>
        <Button label="Template library" variant="secondary" onPress={() => void openLibrary()} />
      </View>

      <FlatList
        data={templates}
        keyExtractor={(item) => item.uuid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        contentContainerStyle={templates.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No forms"
            description="Import a template from the library or create forms in the web app."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/workplace/forms/${item.uuid}/fill` as never)}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMeta}>
              {item.fields?.length ?? 0} fields · {item.is_active ? "Active" : "Draft"}
            </Text>
          </Pressable>
        )}
      />

      <Modal visible={libraryOpen} animationType="slide" onRequestClose={() => setLibraryOpen(false)}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Template library</Text>
          {library.map((item) => (
            <View key={item.slug} style={styles.libCard}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardMeta}>{item.description}</Text>
              <Button
                label={importing === item.slug ? "Importing…" : "Import"}
                variant="secondary"
                onPress={() => void importTemplate(item.slug)}
                disabled={importing === item.slug}
              />
            </View>
          ))}
          <Button label="Close" onPress={() => setLibraryOpen(false)} />
        </View>
      </Modal>
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  toolbar: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  list: { padding: spacing.lg, gap: spacing.md },
  emptyList: { flexGrow: 1, padding: spacing.lg },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  cardTitle: { fontSize: 17, fontWeight: "600", color: colors.primaryForeground },
  cardMeta: { fontSize: 13, color: colors.mutedForeground, marginTop: 4 },
  modal: { flex: 1, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
  modalTitle: { fontSize: 22, fontWeight: "700", color: colors.primaryForeground, marginBottom: spacing.md },
  libCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
});
