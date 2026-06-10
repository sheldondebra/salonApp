import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { formatMoney } from "@/booking/format";
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
  fetchMarketplaceProfile,
  searchMarketplaceBusinesses,
  type MarketplaceProfile,
  type MarketplaceSearchResult,
} from "@/workplace/api";

const CITIES = ["All", "Accra", "Kumasi", "Tema"] as const;

const FALLBACK_PROFILE: MarketplaceProfile = {
  published: true,
  salon_name: "Schedelux Signature Studio",
  headline: "Protective styles, glow facials, and premium finishing services.",
  rating: 4.8,
  review_count: 184,
  categories: ["Braids", "Facials", "Color", "Bridal"],
  services: [
    { id: 1, name: "Fulani braids", price_from_cents: 32000 },
    { id: 2, name: "Glow facial", price_from_cents: 28000 },
    { id: 3, name: "Bridal trial", price_from_cents: 45000 },
  ],
  photos: [{ id: 1, caption: "Front desk and selfie wall" }, { id: 2, caption: "Treatment suite" }],
  location: { city: "Accra", branch_count: 2 },
};

const FALLBACK_RESULTS: MarketplaceSearchResult[] = [
  { id: 1, name: "Glow House", city: "Accra", distance_km: 3.2, rating: 4.9, featured: true, favorite_count: 62, categories: ["Facials", "Brows"] },
  { id: 2, name: "The Braid Room", city: "Tema", distance_km: 7.8, rating: 4.6, featured: false, favorite_count: 48, categories: ["Braids", "Install"] },
  { id: 3, name: "Polish Atelier", city: "Kumasi", distance_km: 5.1, rating: 4.7, featured: true, favorite_count: 31, categories: ["Nails", "Spa"] },
];

export function WorkplaceMarketplaceScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [city, setCity] = useState<(typeof CITIES)[number]>("All");
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState<MarketplaceProfile | null>(null);
  const [results, setResults] = useState<MarketplaceSearchResult[]>([]);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const [nextProfile, search] = await Promise.all([
        fetchMarketplaceProfile(auth),
        searchMarketplaceBusinesses(auth, { q: query || undefined, city: city === "All" ? undefined : city }),
      ]);
      setProfile(nextProfile);
      const nextResults = search.data ?? [];
      setResults(nextResults);
      setSelectedId((current) => current ?? nextResults[0]?.id ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError ? `${err.message}. Showing preview marketplace data.` : "Could not load marketplace data."
      );
      setProfile(FALLBACK_PROFILE);
      setResults(FALLBACK_RESULTS);
      setSelectedId((current) => current ?? FALLBACK_RESULTS[0]?.id ?? null);
    }
  }, [auth, city, query]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const selected = useMemo<MarketplaceSearchResult | null>(
    () => results.find((result) => result.id === selectedId) ?? results[0] ?? null,
    [results, selectedId]
  );

  if (!auth) {
    return (
      <ResponsiveShell>
        <EmptyState title="No workspace" description="Sign in to a salon account." />
      </ResponsiveShell>
    );
  }

  if (loading) {
    return (
      <ResponsiveShell>
        <LoadingState message="Loading marketplace…" />
      </ResponsiveShell>
    );
  }

  const listPane = (
    <View style={sharedStyles.listPane}>
      <SectionTitle title="Search results" subtitle="Nearby businesses, featured listings, and favorite counts." />
      {results.length === 0 ? (
        <EmptyState title="No results" description="Adjust the city filter or search term." />
      ) : (
        results.map((result) => {
          const isSelected = result.id === selected?.id;
          return (
            <Pressable
              key={result.id}
              onPress={() => setSelectedId(result.id)}
              style={[part3Styles.listCard, isSelected && part3Styles.listCardSelected]}
            >
              <Text style={part3Styles.cardTitle}>{result.name}</Text>
              <Text style={part3Styles.cardMeta}>
                {result.city} · {result.distance_km?.toFixed(1) ?? "0.0"} km away
              </Text>
              <View style={styles.pillRow}>
                <StatusPill label={`${result.rating?.toFixed(1) ?? "—"} stars`} tone="info" />
                <StatusPill label={`${result.favorite_count ?? 0} favorites`} tone="neutral" />
                {result.featured ? <StatusPill label="Featured" tone="success" /> : null}
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );

  const detailPane = (
    <View style={sharedStyles.detailPane}>
      <DetailCard
        title={profile?.salon_name ?? "Marketplace profile"}
        subtitle={profile?.headline || "Your public marketplace profile is what discovery clients see first."}
      >
        <View style={styles.pillRow}>
          <StatusPill label={profile?.published ? "Published" : "Draft"} tone={profile?.published ? "success" : "warning"} />
          <StatusPill label={`${profile?.rating?.toFixed(1) ?? "0.0"} stars`} tone="info" />
          <StatusPill label={`${profile?.review_count ?? 0} reviews`} tone="neutral" />
        </View>
        <TagList values={profile?.categories ?? []} />
      </DetailCard>

      <DetailCard
        title={selected?.name ?? "Select a competitor"}
        subtitle={selected ? `${selected.city} marketplace result` : "Tap a result to inspect the card."}
      >
        {selected ? (
          <View style={part3Styles.stack}>
            <ListRow
              icon="pin-outline"
              title="Distance"
              subtitle="Approximate discovery radius from the client search area"
              right={`${selected.distance_km?.toFixed(1) ?? "0.0"} km`}
            />
            <ListRow
              icon="heart-outline"
              title="Favorites"
              subtitle="How many clients have saved this listing"
              right={String(selected.favorite_count ?? 0)}
            />
            <ListRow
              icon="pricetag-outline"
              title="Categories"
              subtitle={selected.categories?.join(", ") || "No categories returned"}
            />
          </View>
        ) : (
          <EmptyState title="No result selected" description="Pick a search result to compare positioning." />
        )}
      </DetailCard>

      <DetailCard
        title="Your listed services"
        subtitle={`${profile?.location.city || "City"} · ${profile?.location.branch_count ?? 0} branches`}
      >
        <View style={part3Styles.stack}>
          {(profile?.services ?? []).map((service) => (
            <ListRow
              key={service.id}
              icon="sparkles-outline"
              title={service.name}
              subtitle="Visible on the public marketplace profile"
              right={service.price_from_cents ? formatMoney(service.price_from_cents) : "Quote"}
            />
          ))}
        </View>
      </DetailCard>
    </View>
  );

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Marketplace"
        subtitle="Profile preview, search monitoring, and favorite signals"
        onRefresh={() => void load()}
        onSignOut={() => void logout()}
      />
      {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
      <Input label="Search businesses" value={query} onChangeText={setQuery} placeholder="Search salon, category, or city…" />
      <View style={sharedStyles.rowWrap}>
        {CITIES.map((item) => (
          <SelectChip key={item} label={item} selected={city === item} onPress={() => setCity(item)} />
        ))}
      </View>
      <IconStatGrid>
        <IconStatCard icon="globe-outline" label="Published" value={profile?.published ? "Yes" : "No"} />
        <IconStatCard icon="images-outline" label="Photos" value={String(profile?.photos.length ?? 0)} />
        <IconStatCard icon="star-outline" label="Reviews" value={String(profile?.review_count ?? 0)} />
        <IconStatCard icon="search-outline" label="Results" value={String(results.length)} />
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
