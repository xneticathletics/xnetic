import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getProduct, type ShopProduct, type ShopGender } from "../lib/api/shop";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "ShopProductDetail">;

const GENDER_LABEL: Record<ShopGender, string> = { kadin: "Kadın", erkek: "Erkek", unisex: "Unisex" };

const screenWidth = Dimensions.get("window").width;

export default function ShopProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const { role } = useAuth();

  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getProduct(productId)
        .then(setProduct)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [productId])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>{error ?? "Ürün bulunamadı"}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {product.photo_urls.length > 0 ? (
          <>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / screenWidth))}
            >
              {product.photo_urls.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={{ width: screenWidth, height: screenWidth }} />
              ))}
            </ScrollView>
            {product.photo_urls.length > 1 && (
              <View style={styles.dotsRow}>
                {product.photo_urls.map((_, i) => (
                  <View key={i} style={[styles.dot, i === activePhoto && styles.dotActive]} />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={[styles.photoPlaceholder, { width: screenWidth, height: screenWidth }]}>
            <Text style={{ fontSize: 48 }}>🛍️</Text>
          </View>
        )}

        <View style={{ padding: spacing.lg }}>
          {(product.category || product.gender) && (
            <Text style={styles.meta}>
              {[product.category, product.gender && GENDER_LABEL[product.gender]].filter(Boolean).join(" · ")}
            </Text>
          )}
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>{Number(product.price).toLocaleString("tr-TR")} ₺</Text>
          {!!product.description && <Text style={styles.description}>{product.description}</Text>}
        </View>
      </ScrollView>

      {role === "parent" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.buyButton}
            onPress={() =>
              navigation.navigate("ShopPurchase", { productId: product.id, title: product.title, price: Number(product.price) })
            }
          >
            <Text style={styles.buyButtonText}>Satın Al</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  error: { color: colors.coral },
  photoPlaceholder: { backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line },
  dotActive: { backgroundColor: colors.yellow },
  meta: { color: colors.violet, fontSize: 12, fontWeight: "700", marginBottom: 4 },
  title: { color: colors.ink, fontSize: 20, fontWeight: "800" },
  price: { color: colors.yellow, fontSize: 22, fontWeight: "800", marginTop: spacing.xs },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.md },
  footer: {
    padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg,
  },
  buyButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center" },
  buyButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
