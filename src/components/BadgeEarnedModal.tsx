import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Modal, Dimensions } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { BADGE_CATALOG, BADGE_TIER_COLOR, badgeVisualTier, badgeIconSize, badgeGlowStyle, type Badge } from "../lib/api/badges";

const CONFETTI_COLORS = [colors.yellow, colors.teal, colors.coral, colors.violet];
const CONFETTI_COUNT = 60;
const BASE_ICON_SIZE = 84;
const { height: SCREEN_H } = Dimensions.get("window");

// Yeni bir konfeti/animasyon kütüphanesi EKLENMEDİ — bu kod tabanında zaten
// RoleTabs.tsx/AIScreen.tsx'te aynı yaklaşım (yerleşik Animated API) var.
// Her parçacık kendi rastgele yatay konumu/renk/dönüş/gecikmesiyle
// TÜM EKRANI kaplayacak şekilde yukarıdan düşüp döne döne solar (kullanıcı
// isteği — eskiden sadece küçük bir kartın üzerinde kalıyordu).
function ConfettiPiece({ index }: { index: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const { left, color, rotateStart, delay, size } = useMemo(
    () => ({
      left: Math.random() * 100,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      rotateStart: Math.random() * 360,
      delay: Math.random() * 600,
      size: 6 + Math.random() * 5,
    }),
    [index]
  );

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 2200 + Math.random() * 900,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-20, SCREEN_H + 20] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: [`${rotateStart}deg`, `${rotateStart + 520}deg`] });
  const opacity = progress.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: `${left}%`,
        top: 0,
        width: size,
        height: size * 2,
        backgroundColor: color,
        borderRadius: 2,
        opacity,
        transform: [{ translateY }, { rotate }],
      }}
    />
  );
}

// Yeni rozet kazanınca tam ekranı kaplayan popup — konfetiler tüm ekrana
// yayılıyor, kutu ekranın ÜST kısmında beliriyor (kullanıcı isteği).
// Kapatınca (dokununca) HomeScreen bu rozeti "görüldü" işaretleyip
// kulüp adının altındaki rozet rafına yerleştiriyor.
export default function BadgeEarnedModal({ badge, onDismiss }: { badge: Badge; onDismiss: () => void }) {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slide.setValue(0);
    Animated.spring(slide, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();
  }, [slide, badge.id]);

  const catalog = BADGE_CATALOG[badge.badge_type];
  const level = badgeVisualTier(badge);
  const tierColor = BADGE_TIER_COLOR[level];
  const iconSize = badgeIconSize(level, BASE_ICON_SIZE);
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] });

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
        <Animated.View style={[styles.cardWrap, { opacity: slide, transform: [{ translateY }] }]}>
          <View style={[styles.card, { borderColor: tierColor }]}>
            <View
              style={[
                styles.iconBadge,
                { width: iconSize, height: iconSize, borderRadius: iconSize / 2, backgroundColor: `${tierColor}22`, borderColor: tierColor },
                badgeGlowStyle(level),
              ]}
            >
              <Text style={{ fontSize: Math.round(iconSize * 0.5) }}>{catalog.icon}</Text>
            </View>
            <Text style={styles.eyebrow}>🎉 Yeni Rozet Kazandın!</Text>
            <Text style={[styles.title, { color: tierColor }]}>{catalog.title(badge.tier)}</Text>
            <Text style={styles.desc}>{catalog.description(badge.tier)}</Text>
            <TouchableOpacity style={[styles.dismissButton, { backgroundColor: tierColor }]} onPress={onDismiss} activeOpacity={0.85}>
              <Text style={styles.dismissButtonText}>Harika!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(10,11,28,0.85)", alignItems: "center", paddingTop: "18%" },
  cardWrap: { width: "86%" },
  card: {
    backgroundColor: colors.surface, borderWidth: 2, borderRadius: radius.lg,
    padding: spacing.xl, alignItems: "center",
  },
  iconBadge: { borderWidth: 2.5, marginBottom: spacing.md, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 6, textTransform: "uppercase" },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center" },
  desc: { color: colors.muted, fontSize: 13, marginTop: spacing.sm, textAlign: "center", lineHeight: 18 },
  dismissButton: { marginTop: spacing.lg, borderRadius: radius.full, paddingVertical: 12, paddingHorizontal: spacing.xl },
  dismissButtonText: { color: colors.bg, fontWeight: "800", fontSize: 15 },
});
