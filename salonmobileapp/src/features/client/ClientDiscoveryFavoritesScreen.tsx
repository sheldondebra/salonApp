import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { DetailCard, StatusPill, TagList, part3Styles } from "@/features/part3/Part3Shared";
import { SectionTitle, SelectChip, sharedStyles } from "@/features/workplace/WorkplacePart2Ui";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  addClientFavorite,
  fetchClientDiscovery,
  fetchClientFavorites,
  removeClientFavorite,
  type ClientDiscoveryBusiness,
  type ClientDiscoveryDashboard,
  type ClientFavoriteRecord,
} from "@/client/api";

const FILTERS = ["All", "Featured"] as const;

const FALLBACK_DASHBOARD: ClientDiscoveryDashboard = {
  nearby: [
    {
      id: 1,
      type: "business",
      name: "Glow House",
      subtitle: "Facials, brows, and skin rituals",
      city: "Accra",
      rating: 4.9,
      distance_km: 2.4,
      featured: true,
      favorite: true,
      categories: ["Facials", "Brows"],
    },
    {
      id: 2,
      type: "business",
      name: "The Braid Room",
      subtitle: "Protective styles and scalp care",
      city: "Tema",
      rating: 4.7,
      distance_km: 4.8,
      featured: false,
      favorite: false,
      rebook_service_name: "Knotless braids",
      categories: ["Braids", "Install"],
    },
  ],
  recently_viewed: [
    {
      id: 3,
      type: "business",
      name: "Polish Atelier",
      subtitle: "Nails and spa pedicures",
      city: "Kumasi",
      rating: 4.6,
      distance_km: 5.2,
      featured: true,
      favorite: false,
      categories: ["Nails", "Spa"],
    },
  ],
  favorites: [
    {
      id: 1,
      type: "business",
      name: "Glow House",
      subtitle: "Facials, brows, and skin rituals",
      city: "Accra",
      rating: 4.9,
      distance_km: 2.4,
      featured: true,
      favorite: true,
      categories: ["Facials", "Brows"],
    },
  ],
};

export function ClientDiscoveryFavoritesScreen() {
  const router = useRouter();
  const { token, tenantSlug, logout } = useAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [dashboard, setDashboard] = useState<ClientDiscoveryDashboard | null>(null);
  const [favorites, setFavorites] = useState<ClientFavoriteRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token || !tenantSlug) return;
    setError("");
    try {
      const [nextDashboard, nextFavorites] = await Promise.all([
        fetchClientDiscovery({ token }, tenantSlug, {
          q: query || undefined,
          featured: filter === "Featured" ? true : undefined,
        }),
        fetchClientFavorites({ token }, tenantSlug),
      ]);
      setDashboard(nextDashboard);
      setFavorites(nextFavorites);
      setSelectedId((current) => current ?? nextDashboard.nearby[0]?.id ?? nextDashboard.favorites[0]?.id ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError ? `${err.message}. Showing marketplace preview.` : "Could not load discovery."
      );
      setDashboard(FALLBACK_DASHBOARD);
      setFavorites(
        FALLBACK_DASHBOARD.favorites.map((item) => ({
          id: `${item.type}-${item.id}`,
          type: item.type,
          item_id: item.id,
          label: item.name,
          subtitle: item.subtitle,
        }))
      );
      setSelectedId((current) => current ?? FALLBACK_DASHBOARD.nearby[0]?.id ?? null);
    }
  }, [filter, query, tenantSlug, token]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const combinedResults = useMemo(() => {
    const merged = [...(dashboard?.nearby ?? []), ...(dashboard?.recently_viewed ?? [])];
    return merged.filter((item, index) => merged.findIndex((candidate) => candidate.id === item.id) === index);
  }, [dashboard]);

  const selected = useMemo<ClientDiscoveryBusiness | null>(
    () =>
      combinedResults.find((item) => item.id === selectedId) ??
      dashboard?.favorites.find((item) => item.id === selectedId) ??
      combinedResults[0] ??
      dashboard?.favorites[0] ??
      null,
    [combinedResults, dashboard, selectedId]
  );

  async function toggleFavorite(item: ClientDiscoveryBusiness) {
    if (!token || !tenantSlug) return;
    const isFavorite =
      favorites.some((favorite) => favorite.type === item.type && String(favorite.item_id) === String(item.id)) ||
      item.favorite;
    try {
      if (isFavorite) {
        await removeClientFavorite({ token }, tenantSlug, item.type, item.id);
      } else {
        await addClientFavorite({ token }, tenantSlug, {
          type: item.type,
          id: item.id,
          label: item.name,
          subtitle: item.subtitle || null,
        });
      }
      await load();
    } catch (err) {
      Alert.alert("Favorites", err instanceof ApiError ? err.message : "Could not update favorites.");
    }
  }

  if (!token || !tenantSlug) {
    return (
      <ResponsiveShell reserveTabBar={false}>
        <ScreenHeader title="Discovery" subtitle="Choose a salon first to browse favorites and nearby businesses." onSignOut={() => void logout()} />
        <EmptyState
          title="No salon selected"
          description="Return to the client home screen, select a salon, then open discovery again."
          action={<Button label="Back home" onPress={() => router.replace("/client")} />}
        />
      </ResponsiveShell>
    );
  }

  if (loading) {
    return (
      <ResponsiveShell reserveTabBar={false}>
        <LoadingState message="Loading discovery…" />
      </ResponsiveShell>
    );
  }

  const favoritesCount = favorites.length || dashboard?.favorites.length || 0;
  const nearbyCount = dashboard?.nearby.length ?? 0;

  const listPane = (
    <View style={sharedStyles.listPane}>
      <SectionTitle title="Nearby salons" subtitle="Featured and recent discovery results from the client marketplace." />
      {combinedResults.map((item) => {
        const isSelected = item.id === selected?.id;
        const isFavorite = favorites.some(
          (favorite) => favorite.type === item.type && String(favorite.item_id) === String(item.id)
        ) || item.favorite;
        return (
          <Pressable
            key={`${item.type}-${item.id}`}
            onPress={() => setSelectedId(item.id)}
            style={[part3Styles.listCard, isSelected && part3Styles.listCardSelected]}
          >
            <Text style={part3Styles.cardTitle}>{item.name}</Text>
            <Text style={part3Styles.cardMeta}>
              {item.city || "Nearby"} · {item.distance_km?.toFixed(1) ?? "0.0"} km
            </Text>
            <View style={styles.pillRow}>
              <StatusPill label={`${item.rating?.toFixed(1) ?? "—"} stars`} tone="info" />
              {item.featured ? <StatusPill label="Featured" tone="success" /> : null}
              {isFavorite ? <StatusPill label="Favorite" tone="warning" /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const detailPane = (
    <View style={sharedStyles.detailPane}>
      <DetailCard
        title={selected?.name ?? "Pick a listing"}
        subtitle={selected?.subtitle || "Select a discovery card to preview rebooking and favorites actions."}
      >
        {selected ? (
          <View style={part3Styles.stack}>
            <TagList values={selected.categories ?? []} />
            <ListRow
              icon="return-up-forward-outline"
              title="Rebook-ready service"
              subtitle="A suggested returning-client service when one is available"
              right={selected.rebook_service_name || "Browse"}
            />
            <Button
              label={
                favorites.some(
                  (favorite) => favorite.type === selected.type && String(favorite.item_id) === String(selected.id)
                ) || selected.favorite
                  ? "Remove favorite"
                  : "Save favorite"
              }
              variant="secondary"
              onPress={() => void toggleFavorite(selected)}
            />
          </View>
        ) : (
          <EmptyState title="No listing selected" description="Tap a nearby result to preview its details." />
        )}
      </DetailCard>

      <DetailCard title="Saved favorites" subtitle="Quick access to businesses, staff, or services the client has saved.">
        {(dashboard?.favorites.length ?? 0) > 0 ? (
          <View style={part3Styles.stack}>
            {dashboard?.favorites.map((item) => (
              <ListRow
                key={`${item.type}-${item.id}`}
                icon="heart-outline"
                title={item.name}
                subtitle={item.subtitle || item.city || "Saved discovery item"}
                right={item.type}
              />
            ))}
          </View>
        ) : (
          <EmptyState title="No favorites yet" description="Tap Save favorite on a nearby listing to build a quick-return list." />
        )}
      </DetailCard>
    </View>
  );

  return (
    <ResponsiveShell reserveTabBar={false}>
      <ScreenHeader
        title="Discovery favorites"
        subtitle="Marketplace discovery, nearby salons, and saved picks"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      <Button label="Back to home" variant="ghost" onPress={() => router.back()} />
      {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
      <Input label="Search discovery" value={query} onChangeText={setQuery} placeholder="Search salons, services, or neighborhoods…" />
      <View style={sharedStyles.rowWrap}>
        {FILTERS.map((item) => (
          <SelectChip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} />
        ))}
      </View>
      <IconStatGrid>
        <IconStatCard icon="search-outline" label="Nearby" value={String(nearbyCount)} />
        <IconStatCard icon="heart-outline" label="Favorites" value={String(favoritesCount)} />
        <IconStatCard icon="time-outline" label="Recent" value={String(dashboard?.recently_viewed.length ?? 0)} />
        <IconStatCard icon="sparkles-outline" label="Featured" value={String(combinedResults.filter((item) => item.featured).length)} />
      </IconStatGrid>
      {useSplitLayout ? (
        <View style={sharedStyles.split}>
          {listPane}
          {detailPane}
        </View>
      ) : (
        <>
          {listPane}
          {detailPane}
        </>
      )}
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
