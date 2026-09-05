import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing, accentRotation, accentSoftRotation } from "../theme/tokens";
import type { UserRole } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { listAnnouncements, filterAnnouncementsForViewer, type Announcement } from "../lib/api/announcements";
import { getMyAthletes } from "../lib/api/myAthletes";
import { getMyCoachedGroupIds } from "../lib/api/myGroups";
import { getCurrentUserName } from "../lib/api/currentUser";
import { useBranchSelect } from "../context/BranchSelectContext";
import { useClubSettings } from "../context/ClubSettingsContext";
import { getClubLogoUrl } from "../lib/api/clubLogo";
import { getClubName } from "../lib/api/clubSettings";
import { listAllAthletes } from "../lib/api/athletes";
import { listCoaches } from "../lib/api/coaches";
import { listBranches } from "../lib/api/branches";
import { getPlatformStats, type PlatformStats } from "../lib/api/superAdmin";
import NotificationBell from "../components/NotificationBell";

export type Tile = { key: string; label: string; sub: string; icon: string };

// PRD Bölüm 8: rol bazında ana sayfa kutucukları. Her kutucuğun bir emoji
// ikonu var (ekstra native paket gerektirmeden, hafif bir çözüm). Duyurular
// artık kutucuk değil — Ana Sayfa'da ayrı bir önizleme bölümünde.
export const TILES_BY_ROLE: Record<UserRole, Tile[]> = {
  coach: [
    { key: "sporcu", label: "Sporcularım", sub: "", icon: "👥" },
    { key: "yoklama", label: "Yoklama Al", sub: "Grubunu seç", icon: "📋" },
    { key: "antrenman", label: "Antrenman Planla", sub: "Bugün", icon: "📅" },
    { key: "beslenme", label: "Beslenme", sub: "Besinler ve Rehber", icon: "🥗" },
    { key: "fitness", label: "Fitness", sub: "Check-in ve çalışma takibi", icon: "💪" },
    { key: "magaza", label: "Mağaza", sub: "Kulüp ürünleri", icon: "🛍️" },
  ],
  parent: [
    { key: "yoklama", label: "Yoklama Durumu", sub: "", icon: "📋" },
    { key: "antrenman", label: "Antrenman Saatleri", sub: "", icon: "📅" },
    { key: "ozet", label: "Aidat Öde", sub: "", icon: "💰" },
    { key: "sporcu_takibi", label: "Sporcu Takibi", sub: "Çocuğunun gelişimini takip et", icon: "📊" },
    { key: "beslenme", label: "Beslenme", sub: "Besinler ve tarifler", icon: "🥗" },
    { key: "magaza", label: "Mağaza", sub: "Kulüp ürünleri", icon: "🛍️" },
  ],
  athlete: [
    { key: "antrenman", label: "Antrenman Programı", sub: "", icon: "📅" },
    { key: "yoklama", label: "Antrenman Katılım Durumu", sub: "", icon: "📋" },
    { key: "wellness", label: "Günlük Check-in", sub: "Uyku, enerji ve ruh hâlini kaydet", icon: "🌡️" },
    { key: "performansim", label: "Performansım", sub: "Ölçümlerini ve gelişimini gör", icon: "📊" },
    { key: "beslenme", label: "Beslenme", sub: "Besinler ve tarifler", icon: "🥗" },
    { key: "magaza", label: "Mağaza", sub: "Kulüp ürünleri", icon: "🛍️" },
  ],
  club_admin: [
    { key: "sporcu", label: "Sporcu Yönetimi", sub: "Sporcular, gruplar", icon: "👥" },
    { key: "antrenorler", label: "Antrenörler", sub: "Kadro ve atamalar", icon: "🧑‍🏫" },
    { key: "antrenman", label: "Takvim", sub: "Antrenman ve Müsabakalar", icon: "📅" },
    { key: "kulup_yapisi", label: "Kulüp Yapısı", sub: "Grup, branş, salon", icon: "🏛️" },
    { key: "aidat", label: "Finans", sub: "Aidat ve giderler", icon: "💰" },
    { key: "performans", label: "Performans Ölçümleri", sub: "Hız, sıçrama, kuvvet ve dayanıklılık testleri", icon: "⏱️" },
    { key: "beslenme", label: "Beslenme", sub: "Besinler ve Rehber", icon: "🥗" },
    { key: "fitness", label: "Fitness", sub: "Check-in ve çalışma takibi", icon: "💪" },
    { key: "magaza", label: "Mağaza", sub: "Ürünler ve siparişler", icon: "🛍️" },
  ],
  super_admin: [
    { key: "kulupler", label: "Kulüpler", sub: "", icon: "🏢" },
    { key: "abonelik", label: "Abonelikler", sub: "", icon: "💳" },
    { key: "ekranlar", label: "Ekranlar", sub: "Rol önizlemeleri", icon: "🖥️" },
    { key: "sa_duyurular", label: "Duyurular", sub: "Kulüp adminlerine gönder", icon: "📣" },
    { key: "fitness_kutuphane", label: "Egzersiz Kütüphanesi", sub: "Tüm kulüplerde görünen ortak hareketler", icon: "📚" },
    { key: "performans_kutuphane", label: "Performans Testleri Kütüphanesi", sub: "Tüm kulüplerde görünen ortak testler", icon: "⏱️" },
  ],
};

// Branş Koordinatörü olarak atanmış bir antrenörün Ana Sayfa'sı — normal
// antrenör kutucuklarının yerine, kendi branşıyla sınırlı Sporcu Yönetimi
// ve Finans da dahil daha geniş bir kutucuk seti gösterir.
export const COORDINATOR_TILES: Tile[] = [
  { key: "sporcu", label: "Sporcu Yönetimi", sub: "Branşının sporcuları", icon: "👥" },
  { key: "antrenman", label: "Antrenman-Maç Takvimi", sub: "", icon: "📅" },
  { key: "yoklama", label: "Yoklama Al", sub: "Grubunu seç", icon: "📋" },
  { key: "aidat", label: "Finans", sub: "Branşının aidatları", icon: "💰" },
  { key: "performans", label: "Performans Ölçümleri", sub: "Hız, sıçrama, kuvvet ve dayanıklılık testleri", icon: "⏱️" },
  { key: "beslenme", label: "Beslenme", sub: "Besinler ve Rehber", icon: "🥗" },
  { key: "fitness", label: "Fitness", sub: "Check-in ve çalışma takibi", icon: "💪" },
  { key: "magaza", label: "Mağaza", sub: "Kulüp ürünleri", icon: "🛍️" },
];

async function handleTilePress(
  key: string,
  role: UserRole,
  navigation: NativeStackNavigationProp<HomeStackParamList, "Home">
) {
  const isPlanner = role === "coach" || role === "club_admin";

  if (key === "sporcu_takibi") {
    const athletes = await getMyAthletes();
    if (athletes.length === 1) {
      navigation.navigate("AthleteTrackingHub", { athleteId: athletes[0].id, athleteName: athletes[0].full_name });
    } else {
      navigation.navigate("AthleteTrackingList");
    }
    return;
  }
  if (key === "performansim") {
    const athletes = await getMyAthletes();
    const me = athletes[0];
    if (me) navigation.navigate("AthleteTrackingHub", { athleteId: me.id, athleteName: me.full_name });
    return;
  }

  if (key === "sporcu") {
    navigation.navigate("AthleteGroups");
  } else if (key === "antrenman") {
    navigation.navigate(isPlanner ? "TrainingSessions" : "MySchedule");
  } else if (key === "yoklama") {
    navigation.navigate(isPlanner ? "TodayAttendance" : "MyAttendance");
  } else if (key === "antrenorler") {
    navigation.navigate("CoachesList");
  } else if (key === "kulup_yapisi") {
    navigation.navigate("ClubStructure");
  } else if (key === "aidat") {
    navigation.navigate(role === "parent" ? "MyPayments" : "PaymentGroups");
  } else if (key === "ozet" && role === "parent") {
    navigation.navigate("MyPayments");
  } else if (key === "performans") {
    navigation.navigate("AthleticPerformance");
  } else if (key === "beslenme") {
    navigation.navigate("Nutrition");
  } else if (key === "wellness") {
    navigation.navigate("WellnessCheckin");
  } else if (key === "fitness") {
    navigation.navigate("Fitness");
  } else if (key === "freeze") {
    navigation.navigate("MembershipFreeze", undefined);
  } else if (key === "magaza") {
    navigation.navigate(role === "club_admin" ? "ShopManage" : "Shop");
  } else if (key === "kulupler") {
    navigation.navigate("SuperAdminClubs");
  } else if (key === "abonelik") {
    navigation.navigate("SuperAdminSubscriptions");
  } else if (key === "ekranlar") {
    navigation.navigate("SuperAdminScreens");
  } else if (key === "sa_duyurular") {
    navigation.navigate("SuperAdminAnnounce");
  } else if (key === "fitness_kutuphane") {
    navigation.navigate("FitnessTraining");
  } else if (key === "performans_kutuphane") {
    navigation.navigate("AthleticPerformance");
  }
}

// Dinamik (rotasyona göre değişen) aksan renkleri için küçük yardımcılar —
// StyleSheet.create sabit stiller içindir, renk index'e göre değiştiği için
// bu ikisini ayrı, basit fonksiyonlar olarak tutuyoruz.
function topBarStyle(color: string) {
  return { position: "absolute" as const, top: 0, left: 0, right: 0, height: 3, backgroundColor: color };
}
function decorCircleStyle(color: string) {
  return {
    position: "absolute" as const, top: -18, right: -18,
    width: 64, height: 64, borderRadius: 32, backgroundColor: color,
  };
}

export default function HomeScreen({
  role,
  navigation,
}: {
  role: UserRole;
  navigation: NativeStackNavigationProp<HomeStackParamList, "Home">;
}) {
  const insets = useSafeAreaInsets();
  const { clubId } = useAuth();
  const { selectedBranch, isLocked } = useBranchSelect();
  const { settings } = useClubSettings();
  const isBranchCoordinator = role === "coach" && isLocked;
  const tiles = useMemo(() => {
    const base = isBranchCoordinator ? COORDINATOR_TILES : TILES_BY_ROLE[role] ?? [];
    // Kulüp Ayarları > Ana Sayfa Özellikleri'nden pasifleştirilen
    // başlıklar Ana Sayfa'da hiç gösterilmez.
    if (settings.disabled_home_tiles.length === 0) return base;
    return base.filter((tile) => !settings.disabled_home_tiles.includes(tile.key));
  }, [role, isBranchCoordinator, settings.disabled_home_tiles]);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const hasLoadedAnnouncementsOnce = useRef(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [activeAthleteCount, setActiveAthleteCount] = useState<number | null>(null);
  const [branchCount, setBranchCount] = useState<number | null>(null);
  const [coachCount, setCoachCount] = useState<number | null>(null);
  const [clubLogoFailed, setClubLogoFailed] = useState(false);
  const [clubName, setClubName] = useState<string | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

  // Kulüp Ayarları → Kulüp Logosu'ndan isim değiştirilip Ana Sayfa'ya
  // dönüldüğünde de güncel görünsün diye clubId değişiminde değil, HER
  // odaklanmada tazeleniyor (useEffect + [clubId] sadece ilk yüklemede
  // çalışıyor, geri dönüşte tekrar tetiklenmiyordu).
  useFocusEffect(
    useCallback(() => {
      if (!clubId) { setClubName(null); return; }
      let cancelled = false;
      getClubName(clubId).then((n) => { if (!cancelled) setClubName(n); }).catch(() => {});
      return () => { cancelled = true; };
    }, [clubId])
  );

  // Ana Sayfa'daki kompakt istatistik satırı için — sadece Kulüp Admini'ne.
  useFocusEffect(
    useCallback(() => {
      if (role !== "club_admin") return;
      let cancelled = false;
      (async () => {
        try {
          const [athletes, branches, coaches] = await Promise.all([listAllAthletes(), listBranches(), listCoaches()]);
          if (!cancelled) {
            setActiveAthleteCount(athletes.filter((a) => a.status === "active").length);
            setBranchCount(branches.length);
            setCoachCount(coaches.length);
          }
        } catch {
          // sessizce yut — bu istatistik satırı kritik değil
        }
      })();
      return () => { cancelled = true; };
    }, [role])
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getCurrentUserName()
        .then((name) => {
          if (!cancelled) setUserName(name ? name.split(" ")[0] : null);
        })
        .catch(() => {});
      return () => { cancelled = true; };
    }, [])
  );

  // Süper Admin'in Ana Sayfa'sında duyurular yerine platform özeti —
  // duyurular kulüp-içi bir kavram, süper admin hiçbir kulübe bağlı değil.
  useFocusEffect(
    useCallback(() => {
      if (role !== "super_admin") return;
      let cancelled = false;
      getPlatformStats().then((s) => { if (!cancelled) setPlatformStats(s); }).catch(() => {});
      return () => { cancelled = true; };
    }, [role])
  );

  useFocusEffect(
    useCallback(() => {
      // Süper Admin'in kendi kulübü yok — bu kulüp-içi duyuru önizlemesi
      // ona hiç uygulanmaz (bkz. yukarıdaki ayrı platformStats effect'i).
      if (role === "super_admin") return;
      let cancelled = false;
      // Sadece İLK yüklemede yükleniyor göstergesi çıksın — Ana Sayfa'ya
      // her dönüşte eski duyurular ekranda kalsın, arka planda sessizce
      // tazelensin (göz kırpma/yükleniyor animasyonu olmasın).
      if (!hasLoadedAnnouncementsOnce.current) setLoadingAnnouncements(true);
      (async () => {
        try {
          const all = await listAnnouncements();
          let myGroupIds: string[] = [];
          if (role === "parent" || role === "athlete") {
            const athletes = await getMyAthletes();
            myGroupIds = athletes.map((a) => a.group_id).filter((id): id is string => !!id);
          } else if (role === "coach") {
            myGroupIds = await getMyCoachedGroupIds();
          }
          const previewMs = settings.announcement_home_preview_days * 24 * 60 * 60 * 1000;
          const recentOnly = all.filter((a) => Date.now() - new Date(a.created_at).getTime() <= previewMs);
          const visible = filterAnnouncementsForViewer(recentOnly, role, myGroupIds).slice(0, 3);
          if (!cancelled) setAnnouncements(visible);
        } catch {
          if (!cancelled) setAnnouncements([]);
        } finally {
          if (!cancelled) {
            setLoadingAnnouncements(false);
            hasLoadedAnnouncementsOnce.current = true;
          }
        }
      })();
      return () => { cancelled = true; };
    }, [role, settings.announcement_home_preview_days])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.sm }}
    >
      <View style={styles.headerRow}>
        <Image
          source={clubLogoFailed || !clubId ? require("../assets/xnetic-logo-yellow.png") : { uri: getClubLogoUrl(clubId) }}
          style={[styles.heroLogo, role === "super_admin" && styles.heroLogoSmall]}
          resizeMode="cover"
          onError={() => setClubLogoFailed(true)}
        />
        <View style={styles.headerRight}>
          <View style={styles.topRow}>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.greeting}>
                Hoş geldin{userName ? <>, <Text style={styles.greetingAccent}>{userName}</Text></> : null}
              </Text>
              {!!clubName && <Text style={styles.clubNameText}>{clubName}</Text>}
            </View>
            <NotificationBell />
          </View>

          {role === "club_admin" && (activeAthleteCount !== null || branchCount !== null || coachCount !== null) && (
            <View style={styles.statsRow}>
              {activeAthleteCount !== null && (
                <View style={[styles.statBox, { flex: 1.15 }]}>
                  <Text style={styles.statBoxValue} numberOfLines={1}>👥 {activeAthleteCount}</Text>
                  <Text style={styles.statBoxLabel} numberOfLines={1}>Aktif Sporcu</Text>
                </View>
              )}
              {branchCount !== null && (
                <View style={[styles.statBox, { flex: 0.9 }]}>
                  <Text style={styles.statBoxValue} numberOfLines={1}>🏅 {branchCount}</Text>
                  <Text style={styles.statBoxLabel} numberOfLines={1}>Branş</Text>
                </View>
              )}
              {coachCount !== null && (
                <View style={[styles.statBox, { flex: 1.05 }]}>
                  <Text style={styles.statBoxValue} numberOfLines={1}>🧑‍🏫 {coachCount}</Text>
                  <Text style={styles.statBoxLabel} numberOfLines={1}>Antrenör</Text>
                </View>
              )}
            </View>
          )}

          {role === "super_admin" && (
            !platformStats ? (
              <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.sm }} />
            ) : (
              <View style={styles.platformStatsRow}>
                <View style={styles.platformStatBox}>
                  <Text style={styles.platformStatBoxValue} numberOfLines={1}>🏢 {platformStats.totalClubs}</Text>
                  <Text style={styles.platformStatBoxLabel} numberOfLines={1}>Aktif Kulüp</Text>
                </View>
                <View style={styles.platformStatBox}>
                  <Text style={styles.platformStatBoxValue} numberOfLines={1}>💳 {platformStats.activeSubscriptions}</Text>
                  <Text style={styles.platformStatBoxLabel} numberOfLines={1}>Abonelik</Text>
                </View>
                <View style={styles.platformStatBox}>
                  <Text style={styles.platformStatBoxValue} numberOfLines={1}>💰 {platformStats.completedRevenueTry.toLocaleString("tr-TR")} ₺</Text>
                  <Text style={styles.platformStatBoxLabel} numberOfLines={1}>Tamamlanan Gelir</Text>
                </View>
              </View>
            )
          )}
        </View>
      </View>

      {role !== "super_admin" && (
        <View style={styles.announcementsSection}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionLabelBar} />
            <Text style={styles.sectionLabel}>Duyurular</Text>
          </View>
          {loadingAnnouncements && <ActivityIndicator color={colors.yellow} style={{ marginVertical: spacing.sm }} />}
          {!loadingAnnouncements && announcements.length === 0 && (
            <Text style={styles.noAnnouncements}>Güncel duyuru yok.</Text>
          )}
          {announcements.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={styles.announcementRow}
              onPress={() =>
                (navigation.getParent()?.navigate as any)(
                  "Profil",
                  { screen: "AnnouncementDetail", params: { announcementId: a.id } }
                )
              }
            >
              <Text style={styles.announcementText} numberOfLines={1}>
                {a.title} — {a.body}
              </Text>
              <Text style={styles.announcementIcon}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.grid}>
        {tiles.map((tile, index) => {
          const accent = accentRotation[index % accentRotation.length];
          const accentSoft = accentSoftRotation[index % accentSoftRotation.length];
          return (
            <TouchableOpacity
              key={tile.key}
              style={[styles.tile, { borderColor: accentSoft }]}
              activeOpacity={0.8}
              onPress={() => handleTilePress(tile.key, role, navigation)}
            >
              <View style={topBarStyle(accent)} />
              <View style={decorCircleStyle(accentSoft)} />
              <View style={[styles.iconBadge, { backgroundColor: accentSoft }]}>
                <Text style={styles.iconText}>{tile.icon}</Text>
              </View>
              <View style={styles.tileTextBlock}>
                <View style={styles.tileLabelBox}>
                  <Text style={styles.tileLabel} numberOfLines={2}>
                    {tile.label}
                  </Text>
                </View>
                <Text style={styles.tileSub} numberOfLines={2}>{tile.sub || " "}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  heroLogo: { width: 128, height: 128, borderRadius: radius.md, backgroundColor: colors.surface },
  heroLogoSmall: { width: 84, height: 84 },
  headerRight: { flex: 1, justifyContent: "space-between" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  clubNameText: { color: colors.muted, fontSize: 14, fontWeight: "600", marginTop: 2 },
  greeting: { color: colors.ink, fontSize: 23, fontWeight: "700", letterSpacing: 0.2 },
  greetingAccent: { color: colors.yellow },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statsRow: { flexDirection: "row", gap: 6 },
  statBox: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingVertical: 7, paddingHorizontal: 8, alignItems: "center",
  },
  statBoxValue: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  statBoxLabel: { color: colors.muted, fontSize: 10, fontWeight: "600", marginTop: 2 },
  // Süper Admin'in platform özeti kutuları — üçü de her zaman tek satırda
  // sığsın diye club_admin'in statBox'ından ayrı, eşit paylaşımlı ve daha
  // küçük fontlu bir varyant.
  platformStatsRow: { flexDirection: "row", gap: 6 },
  platformStatBox: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingVertical: 6, paddingHorizontal: 4, alignItems: "center",
  },
  platformStatBoxValue: { color: colors.ink, fontSize: 10.5, fontWeight: "800" },
  platformStatBoxLabel: { color: colors.muted, fontSize: 8.5, fontWeight: "600", marginTop: 2 },
  announcementsSection: { marginBottom: spacing.lg },
  sectionLabelBar: { width: 3, height: 12, borderRadius: 2, backgroundColor: colors.yellow },
  sectionLabel: { color: colors.yellow, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  noAnnouncements: { color: colors.muted, fontSize: 13 },
  announcementRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, marginBottom: 6,
  },
  announcementText: { color: colors.ink, fontSize: 12, flex: 1, marginRight: spacing.sm },
  announcementIcon: { color: colors.yellow, fontSize: 16, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: {
    width: "47%",
    minHeight: 124,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  iconText: { fontSize: 20 },
  tileTextBlock: { gap: 3 },
  tileLabelBox: { justifyContent: "flex-start" },
  tileLabel: { color: colors.ink, fontSize: 15, fontWeight: "700", lineHeight: 19 },
  tileSub: { color: colors.muted, fontSize: 12, lineHeight: 15 },
});
