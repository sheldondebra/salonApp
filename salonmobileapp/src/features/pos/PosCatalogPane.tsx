import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatMoney } from "@/booking/format";
import type { BookingService } from "@/booking/types";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import type { PosProduct } from "@/pos/types";
import { colors, radii, spacing } from "@/theme/colors";

export type CatalogTab = "products" | "services";

type PosCatalogPaneProps = {
  currency: string;
  tab: CatalogTab;
  onTabChange: (t: CatalogTab) => void;
  search: string;
  onSearchChange: (q: string) => void;
  categoryFilter: string;
  onCategoryChange: (c: string) => void;
  categories: string[];
  products: PosProduct[];
  services: BookingService[];
  loading: boolean;
  onAddProduct: (p: PosProduct) => void;
  onAddService: (s: BookingService) => void;
  productCount: number;
  serviceCount: number;
};

export function PosCatalogPane({
  currency,
  tab,
  onTabChange,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
  products,
  services,
  loading,
  onAddProduct,
  onAddService,
  productCount,
  serviceCount,
}: PosCatalogPaneProps) {
  const { isTablet, isWide } = useResponsiveLayout();
  const tileBasis = isWide ? "31%" : isTablet ? "47%" : "48%";

  const filteredProducts = products.filter((p) => {
    if (categoryFilter && p.category?.name !== categoryFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku?.toLowerCase().includes(q) ?? false) ||
      (p.barcode?.toLowerCase().includes(q) ?? false)
    );
  });

  const filteredServices = services.filter((s) =>
    !search.trim() ? true : s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.tabRow}>
        {(["products", "services"] as CatalogTab[]).map((t) => {
          const active = tab === t;
          const count = t === "products" ? productCount : serviceCount;
          return (
            <Pressable
              key={t}
              onPress={() => onTabChange(t)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Ionicons
                name={t === "products" ? "cube-outline" : "cut-outline"}
                size={18}
                color={active ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t === "products" ? "Products" : "Services"}
              </Text>
              <View style={[styles.countBadge, active && styles.countBadgeActive]}>
                <Text style={[styles.countText, active && styles.countTextActive]}>{count}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={20} color={colors.mutedForeground} />
        <TextInput
          style={styles.search}
          placeholder={tab === "products" ? "Search name, SKU, barcode…" : "Search services…"}
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={onSearchChange}
        />
        {search ? (
          <Pressable onPress={() => onSearchChange("")} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      {tab === "products" && categories.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          <Pressable
            onPress={() => onCategoryChange("")}
            style={[styles.catChip, !categoryFilter && styles.catChipActive]}
          >
            <Text style={[styles.catText, !categoryFilter && styles.catTextActive]}>All</Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => onCategoryChange(cat)}
              style={[styles.catChip, categoryFilter === cat && styles.catChipActive]}
            >
              <Text style={[styles.catText, categoryFilter === cat && styles.catTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : tab === "services" ? (
        filteredServices.length === 0 ? (
          <EmptyCatalog icon="cut-outline" message="No services available" />
        ) : (
          <View style={styles.grid}>
            {filteredServices.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => onAddService(s)}
                style={({ pressed }) => [
                  styles.tile,
                  { flexBasis: tileBasis },
                  pressed && styles.tilePressed,
                ]}
              >
                <Ionicons name="cut-outline" size={20} color={colors.accent} />
                <Text style={styles.tileName} numberOfLines={2}>
                  {s.name}
                </Text>
                <Text style={styles.tilePrice}>{formatMoney(s.price_cents, currency)}</Text>
                {s.duration_minutes ? (
                  <Text style={styles.tileStock}>{s.duration_minutes} min</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        )
      ) : filteredProducts.length === 0 ? (
        <EmptyCatalog icon="cube-outline" message="No products at this branch" />
      ) : (
        <View style={styles.grid}>
          {filteredProducts.map((p) => {
            const out = p.total_quantity <= 0;
            return (
              <Pressable
                key={p.id}
                disabled={out}
                onPress={() => onAddProduct(p)}
                style={({ pressed }) => [
                  styles.tile,
                  { flexBasis: tileBasis },
                  out && styles.tileDisabled,
                  p.is_low_stock && !out && styles.tileLow,
                  pressed && !out && styles.tilePressed,
                ]}
              >
                <View style={styles.tileTop}>
                  <Ionicons
                    name="cube-outline"
                    size={20}
                    color={out ? colors.mutedForeground : colors.accent}
                  />
                  {p.is_low_stock && !out ? (
                    <View style={styles.lowBadge}>
                      <Text style={styles.lowText}>Low</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.tileName} numberOfLines={2}>
                  {p.name}
                </Text>
                {p.category?.name ? (
                  <Text style={styles.tileCat} numberOfLines={1}>
                    {p.category.name}
                  </Text>
                ) : null}
                <Text style={styles.tilePrice}>{formatMoney(p.retail_cents, currency)}</Text>
                <Text style={[styles.tileStock, out && { color: colors.destructive }]}>
                  {out ? "Out of stock" : `${p.total_quantity} in stock`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function EmptyCatalog({
  icon,
  message,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={40} color={colors.mutedForeground} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: spacing.sm },
  tabRow: { flexDirection: "row", gap: spacing.sm },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.mutedForeground },
  tabTextActive: { color: colors.primaryForeground },
  countBadge: {
    backgroundColor: colors.muted,
    borderRadius: radii.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countBadgeActive: { backgroundColor: colors.primaryForeground + "33" },
  countText: { fontSize: 10, fontWeight: "700", color: colors.mutedForeground },
  countTextActive: { color: colors.primaryForeground },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  search: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.black },
  catScroll: { maxHeight: 40 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  catText: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground },
  catTextActive: { color: colors.primaryForeground },
  loader: { marginTop: spacing.xl },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  tile: {
    minWidth: 120,
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  tilePressed: { borderColor: colors.accent, backgroundColor: `${colors.accent}08` },
  tileDisabled: { opacity: 0.5 },
  tileLow: { borderColor: "#FCD34D" },
  tileTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lowBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  lowText: { fontSize: 9, fontWeight: "700", color: "#B45309" },
  tileName: { fontSize: 14, fontWeight: "700", color: colors.black, marginTop: 4 },
  tileCat: { fontSize: 11, color: colors.mutedForeground },
  tilePrice: { fontSize: 15, fontWeight: "700", color: colors.accent, marginTop: 4 },
  tileStock: { fontSize: 11, color: colors.mutedForeground },
  empty: { alignItems: "center", paddingVertical: spacing.xl * 2, gap: spacing.md },
  emptyText: { fontSize: 15, color: colors.mutedForeground },
});
