import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { BADGE_CATALOG, badgeVisualTier, type Badge } from "../lib/api/badges";

const TIER_COLOR: Record<"bronze" | "silver" | "gold", string> = {
  bronze: colors.coral,
  silver: colors.teal,
  gold: colors.yellow,
};

const CONFETTI_COLORS = [colors.yellow, colors.teal, colors.coral, colors.violet];
const CONFETTI_COUNT = 24;

// Yeni bir konfeti/animasyon kütüphanesi EKLENMEDİ — bu kod tabanında zaten
// RoleTabs.tsx/AIScreen.tsx'te aynı yaklaşım (yerleşik Animated API) var.
// Her parçacık kendi rastgele yatay konumu/renk/dönüş/gecikmesiyle
// yukarıdan düşüp döne döne solar — klasik "el yapımı" konfeti deseni.
function ConfettiPiece({ index }: { index: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const { left, color, rotateStart, delay, size } = useMemo(
    () => ({
      left: Math.random() * 100,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      rotateStart: Math.random() * 360,
      delay: Math.random() * 250,
      size: 5 + Math.random() * 4,
    }),
    [index]
  );

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1400 + Math.random() * 500,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-10, 130] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: [`${rotateStart}deg`, `${rotateStart + 380}deg`] });
  const opacity = progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });

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

export default function BadgeCelebrationCard({ badge, onPress }: { badge: Badge; onPress: () => void }) {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slide, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();
  }, [slide, badge.id]);

  const catalog = BADGE_CATALOG[badge.badge_type];
  const tierColor = TIER_COLOR[badgeVisualTier(badge)];

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });

  return (
    <View style={styles.wrap}>
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
      <Animated.View style={{ opacity: slide, transform: [{ translateY }] }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          style={[styles.card, { borderColor: tierColor }]}
        >
          <View style={[styles.iconBadge, { backgroundColor: `${tierColor}22`, borderColor: tierColor }]}>
            <Text style={styles.icon}>{catalog.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>🎉 Yeni Rozet Kazandın!</Text>
            <Text style={[styles.title, { color: tierColor }]}>{catalog.title(badge.tier)}</Text>
            <Text style={styles.desc} numberOfLines={2}>{catalog.description(badge.tier)}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", marginBottom: spacing.lg, overflow: "visible" },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.md,
  },
  iconBadge: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  icon: { fontSize: 26 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "700", marginBottom: 2, textTransform: "uppercase" },
  title: { fontSize: 16, fontWeight: "800" },
  desc: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
