import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { useTenantAuth } from "@/auth/useTenantAuth";
import { formatMoney } from "@/booking/format";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { LoadingState } from "@/components/LoadingState";
import { ResponsiveShell } from "@/components/ResponsiveShell";
import { IconStatCard, IconStatGrid } from "@/components/ui/IconStatCard";
import { ListRow } from "@/components/ui/ListRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import {
  SectionTitle,
  StepFlowCard,
  formatDateLabel,
  sharedStyles,
} from "@/features/workplace/WorkplacePart2Ui";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import {
  fetchPurchaseOrder,
  fetchPurchaseOrders,
  lookupProductBarcode,
  receivePurchaseOrderItems,
  type BarcodeLookupResult,
  type PurchaseOrder,
} from "@/workplace/api";
import { colors, radii, spacing } from "@/theme/colors";

export function WorkplacePurchaseOrdersScreen() {
  const { logout } = useAuth();
  const auth = useTenantAuth();
  const { useSplitLayout } = useResponsiveLayout();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [receiveMap, setReceiveMap] = useState<Record<number, string>>({});
  const [barcodeCode, setBarcodeCode] = useState("");
  const [barcodeResult, setBarcodeResult] = useState<BarcodeLookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState(false);
  const [lookingUpBarcode, setLookingUpBarcode] = useState(false);
  const [error, setError] = useState("");

  const loadList = useCallback(async () => {
    if (!auth) return;
    setError("");
    try {
      const res = await fetchPurchaseOrders(auth, { per_page: 40 });
      const nextOrders = res.data ?? [];
      setOrders(nextOrders);
      setSelectedOrderId((current) => current ?? nextOrders[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load purchase orders");
      setOrders([]);
    }
  }, [auth]);

  const openOrder = useCallback(
    async (orderId: number) => {
      if (!auth) return;
      setSelectedOrderId(orderId);
      try {
        const detail = await fetchPurchaseOrder(auth, orderId);
        setSelectedOrder(detail);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load purchase order detail");
        setSelectedOrder(orders.find((order) => order.id === orderId) ?? null);
      }
    },
    [auth, orders]
  );

  useEffect(() => {
    setLoading(true);
    void loadList().finally(() => setLoading(false));
  }, [loadList]);

  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrder(null);
      return;
    }
    void openOrder(selectedOrderId);
  }, [openOrder, selectedOrderId]);

  useEffect(() => {
    if (!selectedOrder?.items) {
      setReceiveMap({});
      return;
    }
    setReceiveMap(
      selectedOrder.items.reduce<Record<number, string>>((acc, item) => {
        const outstanding = Math.max(0, item.quantity_ordered - item.quantity_received);
        acc[item.id] = outstanding > 0 ? String(outstanding) : "0";
        return acc;
      }, {})
    );
  }, [selectedOrder]);

  const outstandingCount = useMemo(
    () =>
      selectedOrder?.items?.reduce(
        (sum, item) => sum + Math.max(0, item.quantity_ordered - item.quantity_received),
        0
      ) ?? 0,
    [selectedOrder]
  );

  async function handleReceiveItems() {
    if (!auth || !selectedOrder?.items?.length) {
      setError("Choose a purchase order with items to receive.");
      return;
    }

    const items = selectedOrder.items
      .map((item) => ({
        purchase_order_item_id: item.id,
        quantity_received: Math.max(0, Number.parseInt(receiveMap[item.id] || "0", 10)),
      }))
      .filter((item) => item.quantity_received > 0);

    if (items.length === 0) {
      setError("Enter at least one received quantity before saving.");
      return;
    }

    setReceiving(true);
    setError("");
    try {
      const updated = await receivePurchaseOrderItems(auth, selectedOrder.id, { items });
      setSelectedOrder(updated);
      Alert.alert("Stock received", "The selected purchase-order items were marked as received.");
      await loadList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not receive purchase-order items");
    } finally {
      setReceiving(false);
    }
  }

  async function handleBarcodeLookup() {
    if (!auth || !barcodeCode.trim()) {
      setError("Enter a barcode or SKU value first.");
      return;
    }
    setLookingUpBarcode(true);
    setError("");
    try {
      const result = await lookupProductBarcode(auth, barcodeCode.trim());
      setBarcodeResult(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not look up barcode");
      setBarcodeResult(null);
    } finally {
      setLookingUpBarcode(false);
    }
  }

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
        <LoadingState message="Loading purchase orders…" />
      </ResponsiveShell>
    );
  }

  const listPane = (
    <View style={sharedStyles.listPane}>
      <SectionTitle title="Purchase orders" subtitle="Draft, sent, partial, and received stock orders." />
      {orders.length === 0 ? (
        <EmptyState
          title="No purchase orders yet"
          description="Purchase orders created in Schedelux web will appear here for receiving on mobile."
        />
      ) : (
        orders.map((order) => {
          const selected = order.id === selectedOrder?.id;
          return (
            <Pressable
              key={order.id}
              onPress={() => void openOrder(order.id)}
              style={[styles.orderCard, selected && styles.orderCardSelected]}
            >
              <Text style={styles.orderTitle}>{order.reference || order.uuid}</Text>
              <Text style={styles.orderMeta}>{order.supplier?.name || "Supplier not linked"}</Text>
              <Text style={styles.orderMeta}>
                {order.status} · sent {formatDateLabel(order.sent_at)}
              </Text>
            </Pressable>
          );
        })
      )}
    </View>
  );

  const detailPane = (
    <View style={sharedStyles.detailPane}>
      <Card style={styles.detailCard}>
        <Text style={styles.detailTitle}>{selectedOrder?.reference || "Select a purchase order"}</Text>
        <Text style={sharedStyles.muted}>
          {selectedOrder
            ? `${selectedOrder.supplier?.name || "Supplier"} · received ${formatDateLabel(
                selectedOrder.received_at
              )}`
            : "Open a purchase order to receive stock line by line."}
        </Text>
        {selectedOrder ? (
          <View style={styles.metricGrid}>
            <Card>
              <Text style={styles.metricLabel}>Status</Text>
              <Text style={styles.metricValue}>{selectedOrder.status}</Text>
            </Card>
            <Card>
              <Text style={styles.metricLabel}>Items</Text>
              <Text style={styles.metricValue}>{selectedOrder.items?.length ?? 0}</Text>
            </Card>
            <Card>
              <Text style={styles.metricLabel}>Outstanding</Text>
              <Text style={styles.metricValue}>{outstandingCount}</Text>
            </Card>
          </View>
        ) : null}
      </Card>

      <StepFlowCard
        title="Receive PO items"
        description="Mobile receive flow for checking cartons or shelf stock at delivery time."
        steps={[
          "Open the purchase order that is being delivered.",
          "Enter the quantities received for each line item.",
          "Save the receipt to update inventory and order status.",
        ]}
      >
        {selectedOrder?.items && selectedOrder.items.length > 0 ? (
          <View style={styles.itemList}>
            {selectedOrder.items.map((item) => {
              const outstanding = Math.max(0, item.quantity_ordered - item.quantity_received);
              return (
                <Card key={item.id} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>{item.product_name || `Product #${item.product_id}`}</Text>
                  <Text style={styles.itemMeta}>
                    Ordered {item.quantity_ordered} · Received {item.quantity_received} · Outstanding{" "}
                    {outstanding}
                  </Text>
                  <Text style={styles.itemMeta}>
                    Unit cost {formatMoney(item.unit_cost_cents)}
                  </Text>
                  <Input
                    label="Receive now"
                    value={receiveMap[item.id] ?? "0"}
                    keyboardType="number-pad"
                    onChangeText={(value) =>
                      setReceiveMap((current) => ({
                        ...current,
                        [item.id]: value,
                      }))
                    }
                  />
                </Card>
              );
            })}
            {error ? <Text style={sharedStyles.error}>{error}</Text> : null}
            <Button
              label={receiving ? "Saving receipt…" : "Receive items"}
              onPress={() => void handleReceiveItems()}
              loading={receiving}
            />
          </View>
        ) : (
          <EmptyState
            title="No line items yet"
            description="Receiving opens once the purchase order has item rows from the web app."
          />
        )}
      </StepFlowCard>

      <StepFlowCard
        title="Barcode scanner placeholder"
        description="The mobile camera scan action is reserved as a placeholder for batch 195."
        steps={[
          "Use manual barcode lookup when a label is available.",
          "Tap the scanner placeholder if staff need the camera workflow reminder.",
          "Attach the found product to the receiving or POS flow in a later batch.",
        ]}
      >
        <Input label="Barcode or SKU" value={barcodeCode} onChangeText={setBarcodeCode} />
        <View style={styles.flowActions}>
          <Button
            label={lookingUpBarcode ? "Looking up…" : "Lookup barcode"}
            variant="secondary"
            onPress={() => void handleBarcodeLookup()}
            loading={lookingUpBarcode}
          />
          <Button
            label="Scan barcode"
            onPress={() =>
              Alert.alert(
                "Scanner placeholder",
                "Camera-based barcode scanning will be connected in a later mobile batch."
              )
            }
          />
        </View>
        {barcodeResult ? (
          <ListRow
            icon="barcode-outline"
            title={barcodeResult.name}
            subtitle={`SKU ${barcodeResult.sku || "—"} · Qty ${barcodeResult.quantity_on_hand ?? 0}`}
            right={barcodeResult.barcode || "Found"}
          />
        ) : null}
      </StepFlowCard>
    </View>
  );

  return (
    <ResponsiveShell>
      <ScreenHeader
        title="Purchase orders"
        subtitle="Receive stock and run barcode lookups from the floor"
        onRefresh={() => void loadList()}
        onSignOut={() => void logout()}
      />
      <IconStatGrid>
        <IconStatCard icon="document-text-outline" label="Orders" value={String(orders.length)} />
        <IconStatCard
          icon="mail-outline"
          label="Sent"
          value={String(orders.filter((order) => order.status === "sent").length)}
        />
        <IconStatCard
          icon="cube-outline"
          label="Partial"
          value={String(orders.filter((order) => order.status === "partially_received").length)}
        />
        <IconStatCard
          icon="checkmark-circle-outline"
          label="Received"
          value={String(orders.filter((order) => order.status === "received").length)}
        />
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
  orderCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: 4,
  },
  orderCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  orderTitle: { fontSize: 17, fontWeight: "700", color: colors.primaryForeground },
  orderMeta: { fontSize: 13, color: colors.mutedForeground },
  detailCard: { gap: spacing.md },
  detailTitle: { fontSize: 22, fontWeight: "800", color: colors.primaryForeground },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: colors.mutedForeground,
  },
  metricValue: { fontSize: 15, fontWeight: "700", color: colors.primaryForeground, marginTop: 4 },
  itemList: { gap: spacing.sm },
  itemCard: { gap: spacing.sm },
  itemTitle: { fontSize: 15, fontWeight: "700", color: colors.primaryForeground },
  itemMeta: { fontSize: 13, color: colors.mutedForeground },
  flowActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
