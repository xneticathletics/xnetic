import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllOrders, updateOrderStatus, variantLabel, type ShopOrder, type ShopOrderStatus } from "../lib/api/shop";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "ShopOrders">;

const STATUS_LABEL: Record<ShopOrderStatus, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};
const STATUS_COLOR: Record<ShopOrderStatus, string> = {
  pending: colors.yellow,
  confirmed: colors.teal,
  delivered: colors.teal,
  cancelled: colors.coral,
};
const PAYMENT_LABEL: Record<string, string> = { havale: "Havale/EFT", elden: "Elden" };

type Filter = "all" | ShopOrderStatus;

export default function ShopOrdersScreen({}: Props) {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setOrders(await listAllOrders());
    } catch (e: any) {
      setError(e.message ?? "Siparişler yüklenemedi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => (filter === "all" ? orders : orders.filter((o) => o.status === filter)), [orders, filter]);

  const handlePress = (order: ShopOrder) => {
    const options: { key: ShopOrderStatus; label: string }[] = [
      { key: "confirmed", label: "Onayla" },
      { key: "delivered", label: "Teslim Edildi Olarak İşaretle" },
      { key: "cancelled", label: "İptal Et" },
    ].filter((o) => o.key !== order.status) as any;

    Alert.alert(
      order.shop_products?.title ?? "Sipariş",
      `${order.users?.name ?? "Veli"} · ${Number(order.total_price).toLocaleString("tr-TR")} ₺`,
      [
        { text: "Vazgeç", style: "cancel" },
        ...options.map((o) => ({
          text: o.label,
          style: o.key === "cancelled" ? ("destructive" as const) : undefined,
          onPress: async () => {
            try {
              await updateOrderStatus(order.id, o.key);
              load();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Güncellenemedi", [{ text: "Tamam" }]);
            }
          },
        })),
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ alignItems: "center" }}>
        {([
          { key: "all", label: "Tümü" },
          { key: "pending", label: "Bekliyor" },
          { key: "confirmed", label: "Onaylandı" },
          { key: "delivered", label: "Teslim Edildi" },
          { key: "cancelled", label: "İptal" },
        ] as { key: Filter; label: string }[]).map((f) => (
          <TouchableOpacity key={f.key} style={[styles.chip, filter === f.key && styles.chipActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Sipariş bulunamadı.</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => handlePress(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {item.shop_products?.title ?? "Ürün"}
                {variantLabel(item.shop_product_variants) ? ` · ${variantLabel(item.shop_product_variants)}` : ""}
              </Text>
              <Text style={styles.rowSub}>
                {item.users?.name ?? "Veli"}{item.users?.phone ? ` · ${item.users.phone}` : ""}
              </Text>
              <Text style={styles.rowSub}>
                {item.quantity} adet · {PAYMENT_LABEL[item.payment_method] ?? item.payment_method}
              </Text>
              {!!item.note && <Text style={styles.rowNote}>{item.note}</Text>}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.rowAmount}>{Number(item.total_price).toLocaleString("tr-TR")} ₺</Text>
              <Text style={[styles.badge, { color: STATUS_COLOR[item.status], borderColor: STATUS_COLOR[item.status] }]}>
                {STATUS_LABEL[item.status]}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  filterRow: { flexDirection: "row", marginBottom: spacing.md, height: 32, flexGrow: 0, flexShrink: 0 },
  chip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4, marginRight: spacing.xs,
    alignItems: "center", justifyContent: "center", height: 28, flexShrink: 0,
  },
  chipActive: { backgroundColor: colors.violet, borderColor: colors.violet },
  chipText: { color: colors.muted, fontWeight: "600", fontSize: 11 },
  chipTextActive: { color: colors.bg },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  rowNote: { color: colors.muted, fontSize: 11, marginTop: 2, fontStyle: "italic" },
  rowAmount: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  badge: { fontSize: 10, fontWeight: "700", marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, borderWidth: 1, overflow: "hidden" },
});
