import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { formatMoney } from "@/booking/format";
import type { BookingService } from "@/booking/types";
import { PosCartPanel } from "@/features/pos/PosCartPanel";
import { PosCatalogPane, type CatalogTab } from "@/features/pos/PosCatalogPane";
import { PosCheckoutModal } from "@/features/pos/PosCheckoutModal";
import { PosReceiptModal } from "@/features/pos/PosReceiptModal";
import { PosSalesList } from "@/features/pos/PosSalesList";
import { posSalePaymentPrefill } from "@/payment-requests/prefill";
import { POS_STICKY_BAR_HEIGHT } from "@/hooks/useTabBarInset";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  cartToSaleItems,
  completeSale,
  fetchDiscountPolicy,
  fetchPosClients,
  fetchPosLocations,
  fetchPosProducts,
  fetchPosServices,
  fetchPosSummary,
  fetchRecentSales,
  fetchSale,
  findDiscountApprovalStatus,
  requestPosDiscountApproval,
  validatePosCoupon,
} from "@/pos/api";
import { useTenantAbilities } from "@/hooks/useTenantAbilities";
import { addToCart, cartItemCount, cartSubtotalCents, removeCartLine, updateCartQty } from "@/pos/cart";
import type { CartLine, PaymentMethod, PosLocation, PosProduct, PosSummary, Sale } from "@/pos/types";
import { colors, radii, spacing } from "@/theme/colors";

type PosMode = "register" | "sales";

const CURRENCY = "GHS";

export function PosScreen() {
  const router = useRouter();
  const { token, tenantSlug, logout } = useAuth();
  const { isTablet, isWide } = useResponsiveLayout();
  const splitLayout = isTablet || isWide;

  const [mode, setMode] = useState<PosMode>("register");
  const [locations, setLocations] = useState<PosLocation[]>([]);
  const [locationId, setLocationId] = useState("");
  const [summary, setSummary] = useState<PosSummary | null>(null);
  const [services, setServices] = useState<BookingService[]>([]);
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [clients, setClients] = useState<Awaited<ReturnType<typeof fetchPosClients>>>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  const [catalogTab, setCatalogTab] = useState<CatalogTab>("products");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [clientUserId, setClientUserId] = useState("");
  const [cartError, setCartError] = useState("");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discountCents, setDiscountCents] = useState(0);
  const [manualDiscountInput, setManualDiscountInput] = useState("");
  const [discountThresholdPercent, setDiscountThresholdPercent] = useState(20);
  const [approvalRequestUuid, setApprovalRequestUuid] = useState("");
  const [approvalApproved, setApprovalApproved] = useState(false);
  const [requestingApproval, setRequestingApproval] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  const [phoneCartOpen, setPhoneCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const auth = useMemo(
    () => (token && tenantSlug ? { token, tenantSlug } : null),
    [token, tenantSlug]
  );
  const { can } = useTenantAbilities();
  const canApplyManualDiscount = can("finance.apply_discount");
  const canApproveDiscount = can("finance.approve_discount");
  const canRequestApproval = can("approvals.create");

  const productCategories = useMemo(() => {
    const names = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) names.add(p.category.name);
    });
    return Array.from(names).sort();
  }, [products]);

  const subtotalCents = useMemo(() => cartSubtotalCents(cart), [cart]);
  const [taxPercent, setTaxPercent] = useState("0");
  const [serviceChargePercent, setServiceChargePercent] = useState("0");
  const [tipInput, setTipInput] = useState("");

  const taxCents = useMemo(
    () => Math.round(subtotalCents * (parseFloat(taxPercent) || 0) / 100),
    [subtotalCents, taxPercent]
  );
  const serviceChargeCents = useMemo(
    () => Math.round(subtotalCents * (parseFloat(serviceChargePercent) || 0) / 100),
    [subtotalCents, serviceChargePercent]
  );
  const tipCents = useMemo(() => Math.max(0, Math.round((parseFloat(tipInput) || 0) * 100)), [tipInput]);
  const manualDiscountCents = Math.max(0, Math.round((parseFloat(manualDiscountInput) || 0) * 100));
  const totalDiscountCents = discountCents + manualDiscountCents;
  const discountPercent = subtotalCents > 0 ? (totalDiscountCents / subtotalCents) * 100 : 0;
  const requiresApproval =
    subtotalCents > 0 &&
    totalDiscountCents > 0 &&
    discountPercent >= discountThresholdPercent &&
    !canApproveDiscount;
  const hasApproval = canApproveDiscount || approvalApproved;
  const totalCents = Math.max(0, subtotalCents + taxCents + serviceChargeCents + tipCents - totalDiscountCents);

  const serviceIdsInCart = useMemo(
    () => cart.filter((l) => l.type === "service").map((l) => l.id),
    [cart]
  );

  useEffect(() => {
    if (!auth) return;
    void fetchDiscountPolicy(auth)
      .then((policy) => setDiscountThresholdPercent(policy.threshold_percent))
      .catch(() => undefined);
  }, [auth]);

  useEffect(() => {
    setApprovalRequestUuid("");
    setApprovalApproved(false);
  }, [couponCode, manualDiscountInput, discountCents]);

  const loadMeta = useCallback(async () => {
    if (!auth) return;
    const [locs, svc, cli] = await Promise.all([
      fetchPosLocations(auth),
      fetchPosServices(auth),
      fetchPosClients(auth),
    ]);
    setLocations(locs);
    setLocationId((prev) => prev || (locs[0] ? String(locs[0].id) : ""));
    setServices(svc);
    setClients(cli);
  }, [auth]);

  const loadCatalog = useCallback(async () => {
    if (!auth || !locationId) return;
    setCatalogLoading(true);
    try {
      const [prods, sum] = await Promise.all([
        fetchPosProducts(auth, Number(locationId)),
        fetchPosSummary(auth, Number(locationId)),
      ]);
      setProducts(prods);
      setSummary(sum);
      setCatalogTab(prods.length > 0 ? "products" : "services");
    } catch {
      setProducts([]);
    } finally {
      setCatalogLoading(false);
    }
  }, [auth, locationId]);

  const loadSales = useCallback(async () => {
    if (!auth) return;
    setSalesLoading(true);
    try {
      setRecentSales(await fetchRecentSales(auth, 20));
    } catch {
      setRecentSales([]);
    } finally {
      setSalesLoading(false);
    }
  }, [auth]);

  const loadAll = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      await loadMeta();
      await loadSales();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load POS");
    }
  }, [auth, loadMeta, loadSales]);

  useEffect(() => {
    setLoading(true);
    void loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  useEffect(() => {
    if (locationId) void loadCatalog();
  }, [locationId, loadCatalog]);

  useEffect(() => {
    setDiscountCents(0);
    setCouponCode("");
    setCouponError("");
  }, [cart]);

  function showCartToast(msg: string) {
    setCartError(msg);
    setTimeout(() => setCartError(""), 2500);
  }

  function handleAddProduct(p: PosProduct) {
    const { cart: next, error } = addToCart(
      cart,
      "product",
      p.id,
      p.name,
      p.retail_cents,
      p.total_quantity
    );
    if (error) showCartToast(error);
    else setCart(next);
  }

  function handleAddService(s: BookingService) {
    const { cart: next, error } = addToCart(cart, "service", s.id, s.name, s.price_cents);
    if (error) showCartToast(error);
    else setCart(next);
  }

  function handleUpdateQty(key: string, delta: number) {
    const { cart: next, error } = updateCartQty(cart, key, delta);
    if (error) showCartToast(error);
    else setCart(next);
  }

  function clearCart() {
    setCart([]);
    setClientUserId("");
    setCouponCode("");
    setDiscountCents(0);
    setManualDiscountInput("");
    setApprovalRequestUuid("");
    setApprovalApproved(false);
  }

  async function handleRequestApproval() {
    if (!auth || !locationId || cart.length === 0) return;
    if (!canRequestApproval) {
      Alert.alert("Permission", "You cannot request discount approval.");
      return;
    }
    setRequestingApproval(true);
    try {
      const res = await requestPosDiscountApproval(auth, {
        title: `POS discount ${discountPercent.toFixed(1)}%`,
        description: `Manual discount on ${formatMoney(subtotalCents, CURRENCY)} subtotal.`,
        payload: {
          discount_cents: totalDiscountCents,
          manual_discount_cents: manualDiscountCents,
          coupon_discount_cents: discountCents,
          subtotal_cents: subtotalCents,
          location_id: Number(locationId),
          items: cartToSaleItems(cart),
        },
        is_urgent: discountPercent >= discountThresholdPercent + 10,
      });
      setApprovalRequestUuid(res.uuid);
      setApprovalApproved(res.status === "approved");
      Alert.alert(
        res.status === "approved" ? "Approved" : "Sent",
        res.status === "approved"
          ? "Discount approved — complete checkout."
          : "Managers were notified."
      );
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "Could not request approval");
    } finally {
      setRequestingApproval(false);
    }
  }

  async function handleValidateCoupon(code: string) {
    if (!auth) return;
    setCouponError("");
    try {
      const res = await validatePosCoupon(auth, {
        code,
        amount_cents: subtotalCents,
        service_ids: serviceIdsInCart,
      });
      if (!res.valid) {
        setCouponError(res.message ?? "Invalid coupon");
        setDiscountCents(0);
        setCouponCode("");
        return;
      }
      setCouponCode(code);
      setDiscountCents(res.discount_cents);
    } catch (err) {
      setCouponError(err instanceof ApiError ? err.message : "Coupon failed");
    }
  }

  async function handleCompleteSale(opts: {
    paymentMethod: PaymentMethod;
    taxPercent: string;
    serviceChargePercent: string;
    tipInput: string;
    notes: string;
    couponCode: string;
  }) {
    if (!auth || !locationId || cart.length === 0) return;
    if (requiresApproval && !hasApproval) {
      if (approvalRequestUuid) {
        const status = await findDiscountApprovalStatus(auth, approvalRequestUuid);
        if (status === "approved") {
          setApprovalApproved(true);
        } else {
          Alert.alert("Approval required", "Manager approval is still pending for this discount.");
          return;
        }
      } else {
        Alert.alert("Approval required", "Request manager approval before charging.");
        return;
      }
    }
    setTaxPercent(opts.taxPercent);
    setServiceChargePercent(opts.serviceChargePercent);
    setTipInput(opts.tipInput);

    const tax = Math.round(subtotalCents * (parseFloat(opts.taxPercent) || 0) / 100);
    const svc = Math.round(subtotalCents * (parseFloat(opts.serviceChargePercent) || 0) / 100);
    const tip = Math.max(0, Math.round((parseFloat(opts.tipInput) || 0) * 100));

    setCheckingOut(true);
    try {
      const sale = await completeSale(auth, {
        location_id: Number(locationId),
        client_user_id: clientUserId ? Number(clientUserId) : null,
        appointment_uuid: null,
        items: cartToSaleItems(cart),
        coupon_code: opts.couponCode || null,
        tax_cents: tax,
        service_charge_cents: svc,
        tip_cents: tip,
        manual_discount_cents: manualDiscountCents,
        approval_request_uuid: approvalRequestUuid.trim() || null,
        payment_method: opts.paymentMethod,
        notes: opts.notes.trim() || null,
      });
      setReceipt(sale);
      setCheckoutOpen(false);
      setPhoneCartOpen(false);
      clearCart();
      setTaxPercent("0");
      setServiceChargePercent("0");
      setTipInput("");
      void loadCatalog();
      void loadSales();
    } catch (err) {
      Alert.alert("Checkout failed", err instanceof ApiError ? err.message : "Could not complete sale");
    } finally {
      setCheckingOut(false);
    }
  }

  async function openReceipt(saleId: number) {
    if (!auth) return;
    try {
      setReceipt(await fetchSale(auth, saleId));
    } catch {
      Alert.alert("Error", "Could not load receipt");
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    if (locationId) await loadCatalog();
    setRefreshing(false);
  };

  const selectedLocation = locations.find((l) => String(l.id) === locationId);
  const itemCount = cartItemCount(cart);

  if (!tenantSlug) {
    return (
      <ResponsiveShell>
        <ScreenHeader title="POS" />
        <Text style={styles.error}>No salon workspace linked.</Text>
      </ResponsiveShell>
    );
  }

  if (loading) {
    return <LoadingState message="Loading point of sale…" />;
  }

  const statsRow = summary ? (
    <IconStatGrid>
      <IconStatCard
        icon="cash-outline"
        label="Today"
        value={formatMoney(summary.sales_today_cents, CURRENCY)}
        hint={`${summary.sales_today_count} sales`}
        tint="#059669"
      />
      <IconStatCard
        icon="stats-chart-outline"
        label="Month"
        value={formatMoney(summary.sales_month_cents, CURRENCY)}
        hint={`${summary.sales_month_count} sales`}
        tint="#7C3AED"
      />
      <IconStatCard
        icon="cube-outline"
        label="Stock"
        value={String(summary.inventory.active_products)}
        hint={`${summary.inventory.low_stock_count} low`}
        tint="#E879A6"
      />
    </IconStatGrid>
  ) : null;

  const registerContent = splitLayout ? (
    <View style={styles.split}>
      <View style={styles.splitCatalog}>
        <PosCatalogPane
          currency={CURRENCY}
          tab={catalogTab}
          onTabChange={setCatalogTab}
          search={search}
          onSearchChange={setSearch}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categories={productCategories}
          products={products}
          services={services}
          loading={catalogLoading}
          onAddProduct={handleAddProduct}
          onAddService={handleAddService}
          productCount={products.length}
          serviceCount={services.length}
        />
      </View>
      <View style={styles.splitCart}>
        <PosCartPanel
          currency={CURRENCY}
          cart={cart}
          clients={clients}
          clientUserId={clientUserId}
          onClientChange={setClientUserId}
          subtotalCents={subtotalCents}
          discountCents={totalDiscountCents}
          totalCents={totalCents}
          onUpdateQty={handleUpdateQty}
          onRemove={(key) => setCart(removeCartLine(cart, key))}
          onClear={clearCart}
          onCheckout={() => setCheckoutOpen(true)}
        />
      </View>
    </View>
  ) : (
    <>
      <PosCatalogPane
        currency={CURRENCY}
        tab={catalogTab}
        onTabChange={setCatalogTab}
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={productCategories}
        products={products}
        services={services}
        loading={catalogLoading}
        onAddProduct={handleAddProduct}
        onAddService={handleAddService}
        productCount={products.length}
        serviceCount={services.length}
      />
      {cartError ? <Text style={styles.cartToast}>{cartError}</Text> : null}
    </>
  );

  const phoneRegister = !splitLayout && mode === "register";

  return (
    <ResponsiveShell
      scroll={false}
      style={styles.shell}
      extraBottomInset={phoneRegister ? POS_STICKY_BAR_HEIGHT : 0}
    >
      <View style={styles.body}>
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          contentContainerStyle={[styles.scrollContent, splitLayout && styles.scrollTablet]}
        >
        <ScreenHeader
          title="Point of Sale"
          subtitle={selectedLocation ? selectedLocation.name : "Select a branch"}
          onRefresh={() => void onRefresh()}
          onSignOut={() => void logout()}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={18} color={colors.accent} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locScroll}>
            {locations.length === 0 ? (
              <Text style={styles.muted}>No branches — add one in settings</Text>
            ) : (
              locations.map((loc) => (
                <Pressable
                  key={loc.id}
                  onPress={() => {
                    setLocationId(String(loc.id));
                    setCart([]);
                  }}
                  style={[styles.locChip, locationId === String(loc.id) && styles.locChipActive]}
                >
                  <Text
                    style={[
                      styles.locText,
                      locationId === String(loc.id) && styles.locTextActive,
                    ]}
                  >
                    {loc.name}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>

        {statsRow}

        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode("register")}
            style={[styles.modeBtn, mode === "register" && styles.modeBtnActive]}
          >
            <Ionicons
              name="grid-outline"
              size={18}
              color={mode === "register" ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text style={[styles.modeText, mode === "register" && styles.modeTextActive]}>Register</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("sales")}
            style={[styles.modeBtn, mode === "sales" && styles.modeBtnActive]}
          >
            <Ionicons
              name="receipt-outline"
              size={18}
              color={mode === "sales" ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text style={[styles.modeText, mode === "sales" && styles.modeTextActive]}>Sales</Text>
          </Pressable>
        </View>

        {mode === "register" ? registerContent : null}
        {mode === "sales" ? (
          <PosSalesList
            currency={CURRENCY}
            sales={recentSales}
            loading={salesLoading}
            onOpenReceipt={openReceipt}
          />
        ) : null}
      </ScrollView>

        {phoneRegister ? (
          <View style={styles.phoneBar}>
          <Pressable style={styles.phoneCartBtn} onPress={() => setPhoneCartOpen(true)}>
            <Ionicons name="cart" size={24} color={colors.primaryForeground} />
            {itemCount > 0 ? (
              <View style={styles.phoneBadge}>
                <Text style={styles.phoneBadgeText}>{itemCount}</Text>
              </View>
            ) : null}
            <View>
              <Text style={styles.phoneCartLabel}>Cart</Text>
              <Text style={styles.phoneCartTotal}>{formatMoney(totalCents, CURRENCY)}</Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.phoneCheckout, cart.length === 0 && styles.phoneCheckoutDisabled]}
            disabled={cart.length === 0 || !locationId}
            onPress={() => setCheckoutOpen(true)}
          >
            <Text style={styles.phoneCheckoutText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.primaryForeground} />
          </Pressable>
          </View>
        ) : null}
      </View>

      <Modal visible={phoneCartOpen && !splitLayout} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.cartSheet}>
          <View style={styles.cartSheetHead}>
            <Text style={styles.cartSheetTitle}>Cart</Text>
            <Pressable onPress={() => setPhoneCartOpen(false)}>
              <Ionicons name="close" size={28} color={colors.black} />
            </Pressable>
          </View>
          <PosCartPanel
            currency={CURRENCY}
            cart={cart}
            clients={clients}
            clientUserId={clientUserId}
            onClientChange={setClientUserId}
            subtotalCents={subtotalCents}
            discountCents={totalDiscountCents}
            totalCents={totalCents}
            onUpdateQty={handleUpdateQty}
            onRemove={(key) => setCart(removeCartLine(cart, key))}
            onClear={clearCart}
            onCheckout={() => {
              setPhoneCartOpen(false);
              setCheckoutOpen(true);
            }}
            compact
          />
        </View>
      </Modal>

      <PosCheckoutModal
        visible={checkoutOpen}
        currency={CURRENCY}
        cart={cart}
        subtotalCents={subtotalCents}
        taxCents={taxCents}
        serviceChargeCents={serviceChargeCents}
        tipCents={tipCents}
        couponDiscountCents={discountCents}
        manualDiscountCents={manualDiscountCents}
        totalCents={totalCents}
        checkingOut={checkingOut}
        couponError={couponError}
        canApplyManualDiscount={canApplyManualDiscount}
        discountThresholdPercent={discountThresholdPercent}
        discountPercent={discountPercent}
        requiresApproval={requiresApproval}
        hasApproval={hasApproval}
        requestingApproval={requestingApproval}
        manualDiscountInput={manualDiscountInput}
        onManualDiscountInputChange={setManualDiscountInput}
        onRequestApproval={() => void handleRequestApproval()}
        onClose={() => setCheckoutOpen(false)}
        onComplete={handleCompleteSale}
        onValidateCoupon={handleValidateCoupon}
        couponCode={couponCode}
        onCouponCodeChange={setCouponCode}
      />

      <PosReceiptModal
        visible={!!receipt}
        sale={receipt}
        currency={CURRENCY}
        onClose={() => setReceipt(null)}
        onNewSale={() => {
          setReceipt(null);
          setMode("register");
        }}
        showRequestMomo={!!receipt && !!posSalePaymentPrefill(receipt)}
        onRequestMomo={() => {
          if (!receipt) return;
          const prefill = posSalePaymentPrefill(receipt);
          if (!prefill) return;
          setReceipt(null);
          router.push({
            pathname: "/workplace/payment-requests/new",
            params: {
              posSaleId: String(prefill.pos_sale_id ?? ""),
              customerId: prefill.customer_id ? String(prefill.customer_id) : "",
              customerName: prefill.customer_name ?? "",
              phone: prefill.phone ?? "",
              email: prefill.email ?? "",
              amountCents: String(prefill.amount_cents ?? ""),
              reason: prefill.reason ?? "",
              description: prefill.description ?? "",
              branchId: prefill.branch_id ? String(prefill.branch_id) : "",
              currency: prefill.currency ?? CURRENCY,
            },
          } as never);
        }}
      />
    </ResponsiveShell>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  error: { color: colors.destructive, marginBottom: spacing.sm },
  muted: { fontSize: 14, color: colors.mutedForeground },
  cartToast: {
    textAlign: "center",
    color: colors.destructive,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  locScroll: { flex: 1 },
  locChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  locChipActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  locText: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  locTextActive: { color: colors.primaryForeground },
  modeRow: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.md },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  modeText: { fontSize: 15, fontWeight: "700", color: colors.mutedForeground },
  modeTextActive: { color: colors.primaryForeground },
  scrollTablet: { paddingBottom: spacing.xl },
  split: { flexDirection: "row", gap: spacing.lg, minHeight: 480, alignItems: "stretch" },
  splitCatalog: { flex: 1.4, minWidth: 0 },
  splitCart: { flex: 1, minWidth: 280, maxWidth: 400 },
  phoneBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  phoneCartBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md },
  phoneBadge: {
    position: "absolute",
    left: 28,
    top: -4,
    backgroundColor: colors.destructive,
    borderRadius: radii.full,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneBadgeText: { fontSize: 10, fontWeight: "800", color: colors.white },
  phoneCartLabel: { fontSize: 12, color: colors.mutedForeground, fontWeight: "600" },
  phoneCartTotal: { fontSize: 18, fontWeight: "800", color: colors.black },
  phoneCheckout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radii.lg,
  },
  phoneCheckoutDisabled: { opacity: 0.5 },
  phoneCheckoutText: { fontSize: 16, fontWeight: "800", color: colors.primaryForeground },
  cartSheet: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.md },
  cartSheetHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  cartSheetTitle: { fontSize: 22, fontWeight: "800", color: colors.black },
});
