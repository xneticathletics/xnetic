import React, { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listActiveProducts, type ShopProduct, type ShopGender } from "../lib/api/shop";
import { useAuth } from "../context/AuthContext";
import { useResponsiveColumns, fillGridRow } from "../hooks/useResponsiveColumns";
import type { ShopStackParamList } from "../navigation/ShopStack";

type Props = NativeStackScreenProps<ShopStackParamList, "Shop">;

const GENDER_LABEL: Record<ShopGender, string> = { kadin: "Kadın", erkek: "Erkek", unisex: "Unisex" };

export default function ShopScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const columns = useResponsiveColumns(2);

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<ShopGender | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setProducts(await listActiveProducts());
    } catch (e: any) {
      setError(e.message ?? "Ürünler yüklenemedi");
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

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b, "tr")),
    [products]
  );

  const filteredProducts = useMemo(() => {
    let list = products;
    if (categoryFilter) list = list.filter((p) => p.category === categoryFilter);
    if (genderFilter) list = list.filter((p) => p.gender === genderFilter);
    return list;
  }, [products, categoryFilter, genderFilter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={styles.title}>Mağaza</Text>

      {role === "parent" && (
        <TouchableOpacity style={styles.ordersButton} onPress={() => navigation.navigate("MyShopOrders")}>
          <Text style={styles.ordersButtonText}>📦 Siparişlerim</Text>
        </TouchableOpacity>
      )}

      {categories.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["__all__", ...categories]}
          keyExtractor={(c) => c}
          style={styles.filterRow}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const active = item === "__all__" ? !categoryFilter : categoryFilter === item;
            return (
              <TouchableOpacity
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setCategoryFilter(item === "__all__" ? null : item)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item === "__all__" ? "Tümü" : item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={(["__all__", "kadin", "erkek", "unisex"] as const)}
        keyExtractor={(g) => g}
        style={styles.filterRow}
        contentContainerStyle={{ gap: 8 }}
        renderItem={({ item }) => {
          const active = item === "__all__" ? !genderFilter : genderFilter === item;
          return (
            <TouchableOpacity
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setGenderFilter(item === "__all__" ? null : item)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {item === "__all__" ? "Tümü" : GENDER_LABEL[item]}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        key={`cols-${columns}`}
        data={fillGridRow(filteredProducts, columns)}
        keyExtractor={(p, index) => p?.id ?? `filler-${index}`}
        numColumns={columns}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        // İlk açılışta aynı anda çok fazla ürün fotoğrafı indirmesin diye
        // (yavaşlık şikayeti) — az sayıda ürünle başlayıp kaydırdıkça
        // genişletiyor.
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              {categoryFilter || genderFilter ? "Bu filtreye uyan ürün yok." : "Mağazada henüz ürün yok."}
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          if (!item) return <View style={[styles.card, styles.cardFiller]} />;
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("ShopProductDetail", { productId: item.id })}
            >
              <View style={styles.cardImageWrap}>
                {item.photo_urls[0] ? (
                  <Image source={{ uri: item.photo_urls[0] }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <Text style={{ fontSize: 52 }}>🛍️</Text>
                  </View>
                )}
                {item.gender && (
                  <View style={styles.genderBadge}>
                    <Text style={styles.genderBadgeText}>{GENDER_LABEL[item.gender]}</Text>
                  </View>
                )}
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>{Number(item.price).toLocaleString("tr-TR")} ₺</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const CARD_GAP = spacing.md;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  title: { color: colors.ink, fontSize: 18, fontWeight: "700", marginBottom: spacing.sm },
  ordersButton: {
    alignSelf: "flex-start", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 8, marginBottom: spacing.xs,
  },
  ordersButtonText: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  filterRow: { flexGrow: 0, marginBottom: spacing.sm },
  filterChip: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  filterChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  filterChipText: { color: colors.muted, fontWeight: "600", fontSize: 12 },
  filterChipTextActive: { color: colors.bg },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl, width: "100%" },
  gridRow: { gap: CARD_GAP, marginBottom: CARD_GAP },
  card: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: 22, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  cardFiller: { opacity: 0, shadowOpacity: 0, elevation: 0 },
  // Kare yerine dikey (portre) oranlı görsel alanı — ürün fotoğrafı kartın
  // çok daha büyük bir kısmını kaplayıp mağazayı daha "göz alıcı" gösterir.
  cardImageWrap: { width: "100%", aspectRatio: 0.8, backgroundColor: colors.bg },
  cardImage: { width: "100%", height: "100%" },
  cardImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  genderBadge: {
    position: "absolute", top: spacing.sm, left: spacing.sm,
    backgroundColor: "rgba(16,18,42,0.75)", borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  genderBadgeText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  // Fiyat artık metin altında değil, marka sarısıyla görselin üzerinde
  // dikkat çeken bir hap — vitrin tabelası gibi doğrudan göze çarpsın.
  priceBadge: {
    position: "absolute", left: spacing.sm, bottom: spacing.sm,
    backgroundColor: colors.yellow, borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2, paddingVertical: 5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  priceBadgeText: { color: colors.bg, fontSize: 14, fontWeight: "800" },
  cardBody: { padding: spacing.md },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: "700", lineHeight: 19, minHeight: 38 },
});
