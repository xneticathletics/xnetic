import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Linking, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  getAthlete, setAthleteType, getAthleteExtraGroups, deleteAthlete,
  type Athlete, type AthleteType, type AthleteGroupInfo,
} from "../lib/api/athletes";
import { listAthleteNotes, type AthleteNote } from "../lib/api/athleteNotes";
import { listInjuries, type Injury } from "../lib/api/injuries";
import { listAthleteRecentAttendance, type AthleteRecentAttendance, type AttendanceStatus } from "../lib/api/attendance";
import type { HomeStackParamList } from "../navigation/HomeStack";
import { useHomeButton } from "../hooks/useHomeButton";

type Props = NativeStackScreenProps<HomeStackParamList, "AthleteDetail">;

const STATUS_LABEL: Record<string, string> = { active: "Aktif", passive: "Pasif" };

const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  geldi: "Katıldı", gelmedi: "Gelmedi", gec_kaldi: "Geç Kaldı", raporlu: "Raporlu", izinli: "İzinli",
};
const ATTENDANCE_COLOR: Record<AttendanceStatus, string> = {
  geldi: colors.teal, gelmedi: colors.coral, gec_kaldi: colors.yellow, raporlu: colors.violet, izinli: colors.violet,
};

type TabKey = "info" | "parent" | "health";

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

function formatRelativeDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${dateStr}T00:00:00`);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  return d.toLocaleDateString("tr-TR", { weekday: "long" });
}

function InfoRow({
  label, value, onAdd,
}: {
  label: string;
  value: string | number | null | undefined;
  onAdd?: () => void;
}) {
  const isEmpty = value === null || value === undefined || value === "";
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {isEmpty && onAdd ? (
        <TouchableOpacity style={styles.addFieldButton} onPress={onAdd}>
          <Text style={styles.addFieldButtonText}>+ Ekle</Text>
        </TouchableOpacity>
      ) : (
        <Text style={isEmpty ? styles.infoValueEmpty : styles.infoValue}>{isEmpty ? "—" : value}</Text>
      )}
    </View>
  );
}

export default function AthleteDetailScreen({ route, navigation }: Props) {
  useHomeButton(navigation);
  const { athleteId } = route.params;
  const scrollRef = useRef<ScrollView>(null);

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [notes, setNotes] = useState<AthleteNote[]>([]);
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [extraGroups, setExtraGroups] = useState<AthleteGroupInfo[]>([]);
  const [attendance, setAttendance] = useState<AthleteRecentAttendance[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [loading, setLoading] = useState(true);
  const [typeSaving, setTypeSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Sayfaya her dönüşte tüm ekranı kaplayan yükleniyor göstergesi rahatsız
  // edici olduğu için sadece İLK yüklemede gösteriyoruz — sonraki
  // dönüşlerde veri sessizce arka planda tazelenir.
  const hasLoadedOnceRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      Promise.all([
        getAthlete(athleteId), listAthleteNotes(athleteId), listInjuries(athleteId),
        getAthleteExtraGroups(athleteId), listAthleteRecentAttendance(athleteId),
      ])
        .then(([a, n, i, eg, att]) => {
          setAthlete(a);
          setNotes(n);
          setInjuries(i);
          setExtraGroups(eg);
          setAttendance(att);
        })
        .catch((e) => setError(e.message))
        .finally(() => {
          setLoading(false);
          hasLoadedOnceRef.current = true;
        });
    }, [athleteId])
  );

  const infoMissing = useMemo(() => {
    if (!athlete) return 0;
    return [
      athlete.birth_date, athlete.height_cm, athlete.weight_kg,
      athlete.school, athlete.jersey_size, athlete.jersey_number,
    ].filter((v) => v === null || v === undefined || v === "").length;
  }, [athlete]);
  const parentMissing = athlete && !athlete.parent_phone ? 1 : 0;
  const healthMissing = athlete && !athlete.blood_type ? 1 : 0;

  const totalFields = 8;
  const totalMissing = infoMissing + parentMissing + healthMissing;
  const completionPct = Math.round(((totalFields - totalMissing) / totalFields) * 100);

  const attendancePct = useMemo(() => {
    if (attendance.length === 0) return null;
    const attended = attendance.filter((a) => a.status === "geldi").length;
    return Math.round((attended / attendance.length) * 100);
  }, [attendance]);

  const age = athlete ? calcAge(athlete.birth_date) : null;
  const recentSessions = attendance.slice(0, 2);

  const handleTypeToggle = async () => {
    if (!athlete) return;
    const next: AthleteType = athlete.athlete_type === "musabik" ? "spor_okulu" : "musabik";
    setTypeSaving(true);
    try {
      await setAthleteType(athlete.id, next);
      setAthlete({ ...athlete, athlete_type: next });
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      setTypeSaving(false);
    }
  };

  const handleCallParent = () => {
    if (athlete?.parent_phone) Linking.openURL(`tel:${athlete.parent_phone}`);
  };
  const handleMessage = () => {
    if (!athlete) return;
    if (!athlete.parent_user_id) {
      Alert.alert("Veli hesabı yok", "Bu sporcunun bağlı bir veli giriş hesabı yok, mesaj gönderilemiyor.", [{ text: "Tamam" }]);
      return;
    }
    (navigation.getParent()?.navigate as any)(
      "Mesajlar",
      { screen: "Chat", params: { userId: athlete.parent_user_id, userName: athlete.parent_name ?? athlete.full_name } }
    );
  };
  const goToEditForm = () =>
    athlete &&
    navigation.navigate("AthleteForm", {
      athleteId: athlete.id,
      groupId: athlete.group_id ?? undefined,
      groupName: athlete.groups?.name,
    });
  const goToInjuries = () =>
    athlete && navigation.navigate("AthleteInjuries", { athleteId: athlete.id, athleteName: athlete.full_name });
  const goToNotes = () =>
    athlete && navigation.navigate("AthleteNotes", { athleteId: athlete.id, athleteName: athlete.full_name });
  const handleDelete = () => {
    if (!athlete) return;
    Alert.alert(
      "Sporcuyu sil",
      "Bu sporcuyu silersen, ona ait TÜM yoklama, aidat, sakatlık ve not geçmişi de kalıcı olarak silinir. Bu işlem geri alınamaz. Devam etmek istiyor musun?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAthlete(athlete.id);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error || !athlete) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>{error ?? "Sporcu bulunamadı."}</Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.headerCard}>
        <View style={styles.avatarWrap}>
          {athlete.photo_url ? (
            <Image source={{ uri: athlete.photo_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{athlete.full_name.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={[styles.statusDot, { backgroundColor: athlete.status === "active" ? colors.teal : colors.muted }]} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{athlete.full_name}</Text>
          <Text style={styles.subtitle}>{athlete.groups?.name ?? "Grup atanmadı"}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.badgeFilled, athlete.status !== "active" && styles.badgeMuted]}>
              <Text style={styles.badgeFilledText}>{STATUS_LABEL[athlete.status]?.toUpperCase() ?? athlete.status}</Text>
            </View>
            <TouchableOpacity
              style={[styles.badgeOutline, athlete.athlete_type === "musabik" && styles.badgeOutlineYellow]}
              onPress={handleTypeToggle}
              disabled={typeSaving}
            >
              <Text style={[styles.badgeOutlineText, athlete.athlete_type === "musabik" && styles.badgeOutlineYellowText]}>
                {athlete.athlete_type === "musabik" ? "MÜSABIK" : "SPOR OKULU"}
              </Text>
            </TouchableOpacity>
          </View>
          {extraGroups.length > 0 && (
            <Text style={styles.extraGroupsText}>
              + {extraGroups.map((eg) => `${eg.branch} · ${eg.group_name}`).join(", ")}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{age ?? "—"}</Text>
          <Text style={styles.statLabel}>YAŞ</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: colors.teal }]}>{attendancePct !== null ? `%${attendancePct}` : "—"}</Text>
          <Text style={styles.statLabel}>DEVAM</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{athlete.jersey_number ?? "—"}</Text>
          <Text style={styles.statLabel}>FORMA NO</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionCard} onPress={handleCallParent} disabled={!athlete.parent_phone}>
          <View style={[styles.actionIconCircle, { backgroundColor: colors.teal }]}>
            <Text style={styles.actionIconText}>📞</Text>
          </View>
          <Text style={styles.actionLabel}>Veli ara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={handleMessage}>
          <View style={[styles.actionIconCircle, { backgroundColor: colors.violet }]}>
            <Text style={styles.actionIconText}>💬</Text>
          </View>
          <Text style={styles.actionLabel}>Mesaj</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          <View style={[styles.actionIconCircle, styles.actionIconCircleOutline]}>
            <Text style={styles.actionIconText}>📋</Text>
          </View>
          <Text style={styles.actionLabel}>Yoklama</Text>
        </TouchableOpacity>
      </View>

      {totalMissing > 0 && (
        <View style={styles.completionCard}>
          <View style={styles.completionHeaderRow}>
            <Text style={styles.completionTitle}>Profil tamamlanma</Text>
            <Text style={styles.completionPct}>%{completionPct}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
          </View>
          <Text style={styles.completionHint}>{totalMissing} alan eksik.</Text>
        </View>
      )}

      <View style={styles.tabRow}>
        {([
          { key: "info", label: "Bilgiler", missing: infoMissing },
          { key: "parent", label: "Veli", missing: parentMissing },
          { key: "health", label: "Sağlık", missing: healthMissing },
        ] as { key: TabKey; label: string; missing: number }[]).map((t) => {
          const active = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              {t.missing > 0 && (
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{t.missing}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.card}>
        {activeTab === "info" && (
          <>
            <InfoRow label="Kategori" value={athlete.groups?.name} />
            <InfoRow label="Doğum tarihi" value={athlete.birth_date} onAdd={goToEditForm} />
            <InfoRow label="Boy (cm)" value={athlete.height_cm} onAdd={goToEditForm} />
            <InfoRow label="Kilo (kg)" value={athlete.weight_kg} onAdd={goToEditForm} />
            <InfoRow label="Okul" value={athlete.school} onAdd={goToEditForm} />
            <InfoRow label="Forma bedeni" value={athlete.jersey_size} onAdd={goToEditForm} />
            <InfoRow label="Forma numarası" value={athlete.jersey_number} onAdd={goToEditForm} />
          </>
        )}
        {activeTab === "parent" && (
          <>
            <InfoRow label="Veli Adı Soyadı" value={athlete.parent_name} onAdd={goToEditForm} />
            <InfoRow label="Veli Telefon" value={athlete.parent_phone} onAdd={goToEditForm} />
          </>
        )}
        {activeTab === "health" && (
          <>
            <InfoRow label="Kan Grubu" value={athlete.blood_type} onAdd={goToEditForm} />
            <InfoRow label="Alerjiler" value={athlete.allergies} onAdd={goToEditForm} />
            <InfoRow label="Kullandığı İlaçlar" value={athlete.medications} onAdd={goToEditForm} />
            <InfoRow label="Sağlık Notu" value={athlete.health_info} onAdd={goToEditForm} />
          </>
        )}
      </View>

      <SectionHeader title="Son Antrenman" />
      {recentSessions.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>Henüz yoklama kaydı yok.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {recentSessions.map((s, i) => (
            <View key={s.id} style={[styles.lastSessionRow, i === recentSessions.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.lastSessionText}>
                {s.group_name ?? "Grup"} · {s.venue_name ?? "Salon atanmadı"}
              </Text>
              <Text style={[styles.lastSessionStatus, { color: ATTENDANCE_COLOR[s.status] }]}>
                {ATTENDANCE_LABEL[s.status]} · {formatRelativeDate(s.session_date)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <SectionHeader title={`Koç Notları${notes.length ? ` (${notes.length})` : ""}`} />
      {notes.length === 0 ? (
        <Text style={styles.emptyText}>Henüz not yok.</Text>
      ) : (
        notes.map((n) => (
          <View key={n.id} style={styles.noteCard}>
            <Text style={styles.noteText}>{n.note}</Text>
            <Text style={styles.noteDate}>{new Date(n.created_at).toLocaleDateString("tr-TR")}</Text>
          </View>
        ))
      )}

      <SectionHeader title={`Sakatlık Geçmişi${injuries.length ? ` (${injuries.length})` : ""}`} />
      {injuries.length === 0 ? (
        <Text style={styles.emptyText}>Sakatlık kaydı yok.</Text>
      ) : (
        injuries.map((inj) => (
          <View key={inj.id} style={styles.injuryCard}>
            <Text style={styles.injuryType}>{inj.injury_type}</Text>
            <Text style={styles.injuryDate}>
              {new Date(inj.injury_date).toLocaleDateString("tr-TR")}
              {inj.expected_return ? ` — Beklenen dönüş: ${new Date(inj.expected_return).toLocaleDateString("tr-TR")}` : ""}
            </Text>
            {!!inj.note && <Text style={styles.injuryNote}>{inj.note}</Text>}
          </View>
        ))
      )}

      <TouchableOpacity style={styles.editButton} onPress={goToEditForm}>
        <Text style={styles.editButtonText}>Düzenle</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.injuryNavButton} onPress={goToInjuries}>
        <Text style={styles.injuryNavButtonText}>Sakatlık Geçmişi</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.notesNavButton} onPress={goToNotes}>
        <Text style={styles.notesNavButtonText}>Koç Notları</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.freezeButton}
        onPress={() => navigation.navigate("MembershipFreeze", { athleteId: athlete.id, athleteName: athlete.full_name })}
      >
        <Text style={styles.freezeButtonText}>Kaydı Dondur</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Sporcuyu Sil</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderBar} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  error: { color: colors.coral },
  headerCard: {
    flexDirection: "row", alignItems: "flex-start", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
  },
  avatarWrap: { position: "relative", marginRight: spacing.md },
  avatar: {
    width: 96, height: 96, borderRadius: radius.full, backgroundColor: colors.yellowSoft,
    alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 96, height: 96, borderRadius: radius.full },
  avatarText: { color: colors.yellow, fontSize: 32, fontWeight: "800" },
  statusDot: {
    position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: colors.surface,
  },
  headerInfo: { flex: 1, justifyContent: "center" },
  name: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: spacing.sm },
  badgeFilled: { backgroundColor: colors.teal, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 5 },
  badgeMuted: { backgroundColor: colors.line },
  badgeFilledText: { color: colors.bg, fontSize: 11, fontWeight: "800" },
  badgeOutline: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 5 },
  badgeOutlineYellow: { backgroundColor: colors.yellowSoft, borderColor: colors.yellow },
  badgeOutlineText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  badgeOutlineYellowText: { color: colors.yellow },
  extraGroupsText: { color: colors.teal, fontSize: 11, marginTop: spacing.sm },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  statBox: {
    flex: 1, alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingVertical: spacing.sm,
  },
  statValue: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: "700", marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  actionCard: {
    flex: 1, alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingVertical: spacing.sm,
  },
  actionIconCircle: { width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  actionIconCircleOutline: { backgroundColor: "transparent", borderWidth: 2, borderColor: colors.yellow },
  actionIconText: { fontSize: 18 },
  actionLabel: { color: colors.ink, fontSize: 12, fontWeight: "700" },
  completionCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  completionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  completionTitle: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  completionPct: { color: colors.yellow, fontSize: 14, fontWeight: "800" },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.yellow },
  completionHint: { color: colors.muted, fontSize: 12, marginTop: spacing.xs, lineHeight: 17 },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: spacing.sm },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6, flex: 1, justifyContent: "center",
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.full, paddingVertical: 10,
  },
  tabActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  tabTextActive: { color: colors.bg },
  tabBadge: { backgroundColor: colors.line, borderRadius: radius.full, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  tabBadgeActive: { backgroundColor: colors.bg },
  tabBadgeText: { color: colors.ink, fontSize: 10, fontWeight: "800" },
  tabBadgeTextActive: { color: colors.yellow },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm, marginTop: spacing.md },
  sectionHeaderBar: { width: 3, height: 12, borderRadius: 2, backgroundColor: colors.yellow },
  sectionHeaderText: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  infoLabel: { color: colors.muted, fontSize: 13 },
  infoValue: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  infoValueEmpty: { color: colors.muted, fontSize: 13 },
  addFieldButton: { borderWidth: 1, borderColor: colors.yellow, borderStyle: "dashed", borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  addFieldButtonText: { color: colors.yellow, fontSize: 11, fontWeight: "700" },
  emptyText: { color: colors.muted, fontSize: 13, marginBottom: spacing.sm },
  lastSessionRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  lastSessionText: { color: colors.ink, fontSize: 13, fontWeight: "600", flex: 1, marginRight: spacing.sm },
  lastSessionStatus: { fontSize: 12, fontWeight: "700" },
  noteCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  noteText: { color: colors.ink, fontSize: 13 },
  noteDate: { color: colors.muted, fontSize: 11, marginTop: 4 },
  injuryCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.coral,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  injuryType: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  injuryDate: { color: colors.muted, fontSize: 11, marginTop: 2 },
  injuryNote: { color: colors.muted, fontSize: 12, marginTop: 4 },
  editButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16,
    alignItems: "center", marginTop: spacing.md, marginBottom: spacing.sm,
  },
  editButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  injuryNavButton: {
    backgroundColor: colors.coral, borderRadius: radius.md, paddingVertical: 16,
    alignItems: "center", marginBottom: spacing.sm,
  },
  injuryNavButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  notesNavButton: {
    backgroundColor: colors.violet, borderRadius: radius.md, paddingVertical: 16,
    alignItems: "center", marginBottom: spacing.sm,
  },
  notesNavButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  freezeButton: {
    borderWidth: 1, borderColor: colors.teal, borderRadius: radius.md, paddingVertical: 14,
    alignItems: "center", marginBottom: spacing.sm,
  },
  freezeButtonText: { color: colors.teal, fontWeight: "700", fontSize: 14 },
  deleteButton: { alignItems: "center", paddingVertical: spacing.lg, marginBottom: spacing.xl },
  deleteButtonText: { color: colors.coral, fontWeight: "700", fontSize: 13 },
});
