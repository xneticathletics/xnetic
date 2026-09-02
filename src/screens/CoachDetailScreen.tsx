import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Linking } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  getCoach, getCoachBranches, getCoachGroups,
  type Coach, type CoachBranchInfo,
} from "../lib/api/coaches";
import { listAthletesInGroups } from "../lib/api/athletes";
import { listSessionsForGroups, type TrainingSession } from "../lib/api/trainingSessions";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "CoachDetail">;

const EDUCATION_LABELS: Record<string, string> = {
  lise: "Lise", universite: "Üniversite", yuksek_lisans: "Yüksek Lisans", doktora: "Doktora",
};

type TabKey = "branch" | "personal" | "emergency";

function formatRelativeDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${dateStr}T00:00:00`);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  return d.toLocaleDateString("tr-TR");
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

export default function CoachDetailScreen({ route, navigation }: Props) {
  const { coachId } = route.params;

  const [coach, setCoach] = useState<Coach | null>(null);
  const [branches, setBranches] = useState<CoachBranchInfo[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string; branch: string }[]>([]);
  const [athleteCounts, setAthleteCounts] = useState<Record<string, number>>({});
  const [lastSession, setLastSession] = useState<TrainingSession | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("branch");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Sayfaya her dönüşte (ör. İzin İşlemleri'nden geri gelince) tüm ekranı
  // kaplayan yükleniyor göstergesi rahatsız edici olduğu için sadece İLK
  // yüklemede gösteriyoruz — sonraki dönüşlerde veri sessizce arka planda
  // tazelenir, ekranda eski veri görünmeye devam eder.
  const hasLoadedOnceRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      setError(null);
      (async () => {
        try {
          const [c, b, g] = await Promise.all([getCoach(coachId), getCoachBranches(coachId), getCoachGroups(coachId)]);
          setCoach(c);
          setBranches(b);
          setGroups(g);

          const groupIds = g.map((x) => x.id);
          if (groupIds.length > 0) {
            const [athletes, sessions] = await Promise.all([
              listAthletesInGroups(groupIds),
              listSessionsForGroups(groupIds),
            ]);
            const counts: Record<string, number> = {};
            athletes.forEach((a) => {
              if (a.group_id && a.status === "active") counts[a.group_id] = (counts[a.group_id] ?? 0) + 1;
            });
            setAthleteCounts(counts);

            const completed = sessions
              .filter((s) => s.status === "completed")
              .sort((a, b2) => `${b2.session_date}${b2.start_time}`.localeCompare(`${a.session_date}${a.start_time}`));
            setLastSession(completed[0] ?? null);
          } else {
            setAthleteCounts({});
            setLastSession(null);
          }
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
          hasLoadedOnceRef.current = true;
        }
      })();
    }, [coachId])
  );

  const branchMissing = useMemo(
    () => branches.reduce((sum, b) => sum + (b.license_no ? 0 : 1) + (b.experience_years ? 0 : 1) + (b.hire_date ? 0 : 1), 0),
    [branches]
  );
  const personalMissing = useMemo(() => {
    if (!coach) return 0;
    return [coach.birth_date, coach.phone, coach.education_level, coach.address].filter((v) => !v).length;
  }, [coach]);
  const emergencyMissing = useMemo(() => {
    if (!coach) return 0;
    return [coach.emergency_contact_name, coach.emergency_contact_phone].filter((v) => !v).length;
  }, [coach]);

  const totalFields = branches.length * 3 + 4 + 2;
  const totalMissing = branchMissing + personalMissing + emergencyMissing;
  const completionPct = totalFields > 0 ? Math.round(((totalFields - totalMissing) / totalFields) * 100) : 0;

  const handleCall = () => {
    if (coach?.phone) Linking.openURL(`tel:${coach.phone}`);
  };
  const handleMessage = () => {
    if (!coach) return;
    navigation.getParent()?.navigate(
      "Mesajlar" as never,
      { screen: "Chat", params: { userId: coach.id, userName: coach.name } } as never
    );
  };
  const goToAssignments = () => coach && navigation.navigate("CoachGroups", { coachId: coach.id, coachName: coach.name });
  const goToEditForm = () => coach && navigation.navigate("CoachForm", { coachId: coach.id });
  const goToLeave = () => coach && navigation.navigate("CoachLeave", { coachId: coach.id, coachName: coach.name });
  const goToBranch = () => coach && navigation.navigate("CoachBranch", { coachId: coach.id, coachName: coach.name });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error || !coach) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>{error ?? "Antrenör bulunamadı."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.headerCard}>
        <View style={styles.avatarWrap}>
          {coach.photo_url ? (
            <Image source={{ uri: coach.photo_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{coach.name.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{coach.name}</Text>
          <Text style={styles.roleLabel}>Antrenör</Text>
          {branches.length > 0 && (
            <View style={{ marginTop: spacing.sm }}>
              {branches.map((b) => {
                const branchGroups = groups.filter((g) => g.branch === b.branch_name);
                return (
                  <View key={b.branch_id} style={styles.branchBlock}>
                    <View style={styles.branchTag}>
                      <Text style={styles.branchTagText}>{b.branch_name.toUpperCase()} · {b.level}. Kademe</Text>
                    </View>
                    {branchGroups.length > 0 && (
                      <Text style={styles.groupsLine} numberOfLines={2}>{branchGroups.map((g) => g.name).join(", ")}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionCard} onPress={handleCall} disabled={!coach.phone}>
          <View style={[styles.actionIconCircle, { backgroundColor: colors.teal }]}>
            <Text style={styles.actionIconText}>📞</Text>
          </View>
          <Text style={styles.actionLabel}>Ara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={handleMessage}>
          <View style={[styles.actionIconCircle, { backgroundColor: colors.violet }]}>
            <Text style={styles.actionIconText}>💬</Text>
          </View>
          <Text style={styles.actionLabel}>Mesaj</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={goToAssignments}>
          <View style={[styles.actionIconCircle, styles.actionIconCircleOutline]}>
            <Text style={styles.actionIconText}>📌</Text>
          </View>
          <Text style={styles.actionLabel}>Atamalar</Text>
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
          { key: "branch", label: "Branş", missing: branchMissing },
          { key: "personal", label: "Kişisel", missing: personalMissing },
          { key: "emergency", label: "Acil", missing: emergencyMissing },
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
        {activeTab === "branch" &&
          (branches.length === 0 ? (
            <TouchableOpacity onPress={goToBranch}>
              <Text style={styles.emptyRowText}>Henüz branş atanmadı — eklemek için dokun.</Text>
            </TouchableOpacity>
          ) : (
            branches.map((b, i) => (
              <View key={b.branch_id} style={i > 0 ? { marginTop: spacing.md } : undefined}>
                {branches.length > 1 && <Text style={styles.branchTitle}>{b.branch_name}</Text>}
                <InfoRow label="Kademe" value={`${b.level}. Kademe`} />
                <InfoRow label="Belge numarası" value={b.license_no} onAdd={goToBranch} />
                <InfoRow label="Deneyim yılı" value={b.experience_years} onAdd={goToBranch} />
                <InfoRow label="Kulübe başlama" value={b.hire_date} onAdd={goToBranch} />
              </View>
            ))
          ))}

        {activeTab === "personal" && (
          <>
            <InfoRow label="Doğum Tarihi" value={coach.birth_date} onAdd={goToEditForm} />
            <InfoRow label="Telefon" value={coach.phone} onAdd={goToEditForm} />
            <InfoRow
              label="Öğrenim Durumu"
              value={coach.education_level ? EDUCATION_LABELS[coach.education_level] ?? coach.education_level : null}
              onAdd={goToEditForm}
            />
            <InfoRow label="Adres" value={coach.address} onAdd={goToEditForm} />
          </>
        )}

        {activeTab === "emergency" && (
          <>
            <InfoRow label="Ad Soyad" value={coach.emergency_contact_name} onAdd={goToEditForm} />
            <InfoRow label="Telefon" value={coach.emergency_contact_phone} onAdd={goToEditForm} />
          </>
        )}
      </View>

      <SectionHeader title="Sorumlu Gruplar" />
      <View style={styles.card}>
        {groups.length === 0 ? (
          <Text style={styles.emptyRowText}>Henüz bir gruba atanmadı.</Text>
        ) : (
          groups.map((g, i) => (
            <View key={g.id} style={[styles.groupRow, i === groups.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.groupRowName}>{g.name}</Text>
              <Text style={styles.groupRowCount}>{athleteCounts[g.id] ?? 0} sporcu</Text>
            </View>
          ))
        )}
      </View>

      {lastSession && (
        <>
          <SectionHeader title="Son Antrenman" />
          <View style={styles.card}>
            <View style={styles.lastSessionRow}>
              <Text style={styles.lastSessionText}>
                {lastSession.groups?.name ?? "Grup"} · {lastSession.venues?.name ?? "Salon atanmadı"}
              </Text>
              <Text style={styles.lastSessionDate}>
                {formatRelativeDate(lastSession.session_date)} {lastSession.start_time.slice(0, 5)}
              </Text>
            </View>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.editButton} onPress={goToEditForm}>
        <Text style={styles.editButtonText}>Düzenle</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.leaveNavButton} onPress={goToLeave}>
        <Text style={styles.leaveNavButtonText}>İzin İşlemleri</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.branchNavButton} onPress={goToBranch}>
        <Text style={styles.branchNavButtonText}>Branş ve Belge İşlemleri</Text>
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
  headerInfo: { flex: 1, justifyContent: "center" },
  name: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  roleLabel: { color: colors.muted, fontSize: 13, marginTop: 2 },
  branchBlock: { marginBottom: spacing.sm },
  branchTag: {
    alignSelf: "flex-start", backgroundColor: colors.teal, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  branchTagText: { color: colors.bg, fontSize: 10, fontWeight: "800" },
  groupsLine: { color: colors.muted, fontSize: 12, marginTop: 4 },
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
  emptyRowText: { color: colors.muted, fontSize: 13 },
  branchTitle: { color: colors.teal, fontSize: 13, fontWeight: "700", marginBottom: 4, textTransform: "uppercase" },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  infoLabel: { color: colors.muted, fontSize: 13 },
  infoValue: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  infoValueEmpty: { color: colors.muted, fontSize: 13 },
  addFieldButton: { borderWidth: 1, borderColor: colors.yellow, borderStyle: "dashed", borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  addFieldButtonText: { color: colors.yellow, fontSize: 11, fontWeight: "700" },
  groupRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  groupRowName: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  groupRowCount: { color: colors.muted, fontSize: 12 },
  lastSessionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lastSessionText: { color: colors.ink, fontSize: 13, fontWeight: "600", flex: 1, marginRight: spacing.sm },
  lastSessionDate: { color: colors.muted, fontSize: 12 },
  editButton: {
    backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16,
    alignItems: "center", marginTop: spacing.sm,
  },
  editButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  leaveNavButton: {
    backgroundColor: colors.violet, borderRadius: radius.md, paddingVertical: 16,
    alignItems: "center", marginTop: spacing.sm,
  },
  leaveNavButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  branchNavButton: {
    backgroundColor: colors.teal, borderRadius: radius.md, paddingVertical: 16,
    alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  branchNavButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
