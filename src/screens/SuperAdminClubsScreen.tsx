import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listAllClubs, getClubAdmins, deleteClub, type ClubSummary, type ClubAdmin } from "../lib/api/superAdmin";
import { resetUserPassword } from "../lib/api/passwordReset";
import { listPendingPasswordResetRequests, markNotificationRead } from "../lib/api/notifications";
import { useCopyToast } from "../hooks/useCopyToast";
import { useHomeButton } from "../hooks/useHomeButton";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "SuperAdminClubs">;

const STATUS_LABELS: Record<string, string> = {
  mock_paid: "Test Ödemesi",
  active: "Aktif",
  cancelled: "İptal Edildi",
  past_due: "Ödeme Gecikti",
};

const PERIOD_LABELS: Record<string, string> = { monthly: "Aylık", yearly: "Yıllık" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function SuperAdminClubsScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const { copy, copiedKey } = useCopyToast();
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kulüp yöneticisi şifresini sıfırlama — kulüp kartına dokununca o
  // kulübün yöneticileri açılıyor. Kulüp yöneticisinin şifre sıfırlama
  // talebi SÜPER ADMİNE geliyor (kendi kulübünde onu sıfırlayabilecek
  // kimse yok, bkz. request_password_reset_notice), bu yüzden işlem
  // mobilde de yapılabilmeli — eskiden yalnızca web panelinde vardı.
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null);
  const [adminsByClub, setAdminsByClub] = useState<Record<string, ClubAdmin[]>>({});
  const [adminsLoading, setAdminsLoading] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  // Hangi yönetici şifre sıfırlama talebinde bulundu (bildirim id'leriyle) —
  // işlem bitince o bildirim(ler) okundu işaretleniyor.
  const [pendingByUserId, setPendingByUserId] = useState<Record<string, string[]>>({});

  // "Kulübü Kalıcı Olarak Sil" — web panelindeki AdminClubDetailPage'deki
  // aynı "Tehlikeli Bölge" — onay için kulüp adının TAM yazılması gerekiyor
  // (yanlışlıkla başka bir kulübü silmeyi engellemek için, edge function da
  // aynı kontrolü tekrar yapıyor).
  const [deleteConfirmByClub, setDeleteConfirmByClub] = useState<Record<string, string>>({});
  const [deletingClubId, setDeletingClubId] = useState<string | null>(null);
  const [deleteErrorByClub, setDeleteErrorByClub] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      Promise.all([listAllClubs(), listPendingPasswordResetRequests().catch(() => [])])
        .then(([data, pending]) => {
          if (cancelled) return;
          setClubs(data);
          const map: Record<string, string[]> = {};
          pending.forEach((p) => {
            map[p.requesterId] = [...(map[p.requesterId] ?? []), p.notificationId];
          });
          setPendingByUserId(map);
        })
        .catch((e) => { if (!cancelled) setError(e.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [])
  );

  const toggleClub = async (clubId: string) => {
    if (expandedClubId === clubId) {
      setExpandedClubId(null);
      return;
    }
    setExpandedClubId(clubId);
    if (adminsByClub[clubId]) return;
    setAdminsLoading(clubId);
    try {
      const rows = await getClubAdmins(clubId);
      setAdminsByClub((prev) => ({ ...prev, [clubId]: rows }));
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Yöneticiler yüklenemedi", [{ text: "Tamam" }]);
    } finally {
      setAdminsLoading(null);
    }
  };

  const handleReset = (admin: ClubAdmin) => {
    Alert.alert(
      "Şifreyi sıfırla",
      `${admin.name} için yeni bir geçici şifre üretilecek, eski şifresi geçersiz olacak. Devam edilsin mi?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sıfırla",
          style: "destructive",
          onPress: async () => {
            if (resettingId) return;
            setResettingId(admin.id);
            try {
              const res = await resetUserPassword(admin.id);
              setResults((r) => ({ ...r, [admin.id]: res.tempPassword }));
              const pendingIds = pendingByUserId[admin.id];
              if (pendingIds?.length) {
                await Promise.all(pendingIds.map((id) => markNotificationRead(id).catch(() => {})));
                setPendingByUserId((prev) => {
                  const next = { ...prev };
                  delete next[admin.id];
                  return next;
                });
              }
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Şifre sıfırlanamadı", [{ text: "Tamam" }]);
            } finally {
              setResettingId(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteClub = (club: ClubSummary) => {
    const typed = (deleteConfirmByClub[club.id] ?? "").trim();
    if (typed !== club.name) return;
    Alert.alert(
      "Kulübü kalıcı olarak sil",
      `"${club.name}" ve TÜM bağlı verisi (sporcular, antrenörler, veliler, ödemeler, fitness/beslenme kayıtları — her şey) kalıcı olarak silinecek. Bu işlem GERİ ALINAMAZ. Emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Kalıcı Olarak Sil",
          style: "destructive",
          onPress: async () => {
            if (deletingClubId) return;
            setDeletingClubId(club.id);
            setDeleteErrorByClub((prev) => ({ ...prev, [club.id]: "" }));
            try {
              await deleteClub(club.id, typed);
              setClubs((prev) => prev.filter((c) => c.id !== club.id));
              setExpandedClubId(null);
              Alert.alert("Silindi", `"${club.name}" kalıcı olarak silindi.`, [{ text: "Tamam" }]);
            } catch (e: any) {
              setDeleteErrorByClub((prev) => ({ ...prev, [club.id]: e.message ?? "Silinemedi" }));
            } finally {
              setDeletingClubId(null);
            }
          },
        },
      ]
    );
  };

  const dismissResult = (userId: string) => {
    setResults((r) => {
      const next = { ...r };
      delete next[userId];
      return next;
    });
  };

  const renderAdmin = (admin: ClubAdmin) => (
    <View key={admin.id} style={styles.adminRow}>
      <View style={styles.adminTopRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {!!pendingByUserId[admin.id]?.length && (
            <Text style={styles.pendingTag}>🔔 Şifre sıfırlama talep etti</Text>
          )}
          <Text style={styles.adminName} numberOfLines={1}>{admin.name}</Text>
          {!!admin.phone && <Text style={styles.adminPhone}>{admin.phone}</Text>}
        </View>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => handleReset(admin)}
          disabled={resettingId === admin.id}
        >
          {resettingId === admin.id ? (
            <ActivityIndicator color={colors.bg} size="small" />
          ) : (
            <Text style={styles.resetButtonText}>Şifreyi Sıfırla</Text>
          )}
        </TouchableOpacity>
      </View>

      {!!results[admin.id] && (
        <View style={styles.resultBox}>
          <View style={styles.resultTitleRow}>
            <Text style={styles.resultTitle}>✓ Yeni Geçici Şifre</Text>
            <TouchableOpacity onPress={() => dismissResult(admin.id)}>
              <Text style={styles.dismissText}>Kapat</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.passwordRow}
            onPress={() => copy(admin.id, results[admin.id])}
            activeOpacity={0.7}
            accessibilityLabel="Geçici şifreyi kopyala"
          >
            <Text selectable style={styles.passwordText}>{results[admin.id]}</Text>
            <Text style={styles.copyIcon}>{copiedKey === admin.id ? "✓" : "📋"}</Text>
          </TouchableOpacity>
          {copiedKey === admin.id && <Text style={styles.copiedText}>Kopyalandı</Text>}
          <Text style={styles.resultHint}>
            Bu şifreyi yöneticiye ilet — bir daha görüntülenmeyecek. İlk girişte değiştirmesi zorunlu.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Platformdaki tüm kulüpler ({clubs.length})</Text>

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={clubs}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz kulüp yok.</Text> : null}
        renderItem={({ item }) => {
          const admins = adminsByClub[item.id] ?? [];
          const hasPending = admins.some((a) => pendingByUserId[a.id]?.length);
          return (
            <View style={[styles.card, hasPending && styles.cardHighlighted]}>
              <TouchableOpacity onPress={() => toggleClub(item.id)} activeOpacity={0.7}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.chevron}>{expandedClubId === item.id ? "⌃" : "⌄"}</Text>
                </View>
                <Text style={styles.cardDate}>Katılım: {formatDate(item.created_at)}</Text>
                {item.subscription ? (
                  <>
                    <View style={styles.badgeRow}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{PERIOD_LABELS[item.subscription.billing_period] ?? item.subscription.billing_period}</Text>
                      </View>
                      <View style={[styles.badge, styles.badgeStatus]}>
                        <Text style={styles.badgeText}>{STATUS_LABELS[item.subscription.status] ?? item.subscription.status}</Text>
                      </View>
                    </View>
                    {item.subscription.current_period_end && (
                      <Text style={styles.cardDate}>Abonelik Bitiş: {formatDate(item.subscription.current_period_end)}</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.noSub}>Abonelik kaydı yok</Text>
                )}
              </TouchableOpacity>

              {expandedClubId === item.id && (
                <View style={styles.adminsBox}>
                  <Text style={styles.adminsTitle}>Kulüp Yöneticileri</Text>
                  {adminsLoading === item.id ? (
                    <ActivityIndicator color={colors.yellow} style={{ marginVertical: spacing.sm }} />
                  ) : admins.length === 0 ? (
                    <Text style={styles.empty}>Bu kulübün yöneticisi yok.</Text>
                  ) : (
                    admins.map(renderAdmin)
                  )}

                  <View style={styles.dangerZone}>
                    <Text style={styles.dangerTitle}>Tehlikeli Bölge</Text>
                    <Text style={styles.dangerText}>
                      Bu kulübü ve TÜM bağlı verisini kalıcı olarak siler. Bu işlem GERİ ALINAMAZ.
                    </Text>
                    <Text style={styles.dangerLabel}>Onaylamak için kulüp adını tam olarak yaz: "{item.name}"</Text>
                    <TextInput
                      style={styles.dangerInput}
                      value={deleteConfirmByClub[item.id] ?? ""}
                      onChangeText={(t) => setDeleteConfirmByClub((prev) => ({ ...prev, [item.id]: t }))}
                      placeholder={item.name}
                      placeholderTextColor={colors.muted}
                      autoCapitalize="none"
                    />
                    {!!deleteErrorByClub[item.id] && <Text style={styles.error}>{deleteErrorByClub[item.id]}</Text>}
                    <TouchableOpacity
                      style={[
                        styles.dangerButton,
                        (deleteConfirmByClub[item.id] ?? "").trim() !== item.name && styles.dangerButtonDisabled,
                      ]}
                      onPress={() => handleDeleteClub(item)}
                      disabled={deletingClubId === item.id || (deleteConfirmByClub[item.id] ?? "").trim() !== item.name}
                    >
                      {deletingClubId === item.id ? (
                        <ActivityIndicator color={colors.bg} size="small" />
                      ) : (
                        <Text style={styles.dangerButtonText}>Kulübü Kalıcı Olarak Sil</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  title: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: spacing.lg },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  cardHighlighted: { borderColor: colors.coral },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  cardName: { color: colors.ink, fontSize: 15, fontWeight: "700", flex: 1 },
  chevron: { color: colors.muted, fontSize: 16, fontWeight: "800" },
  cardDate: { color: colors.muted, fontSize: 11, marginTop: 2, marginBottom: spacing.xs },
  badgeRow: { flexDirection: "row", gap: spacing.xs },
  badge: { backgroundColor: `${colors.violet}22`, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  badgeStatus: { backgroundColor: `${colors.teal}22` },
  badgeText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  noSub: { color: colors.coral, fontSize: 11, fontStyle: "italic" },

  adminsBox: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: spacing.sm, paddingTop: spacing.sm },
  adminsTitle: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: spacing.xs },
  adminRow: { marginBottom: spacing.sm },
  adminTopRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  pendingTag: { color: colors.coral, fontSize: 11, fontWeight: "700", marginBottom: 2 },
  adminName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  adminPhone: { color: colors.muted, fontSize: 12, marginTop: 2 },
  resetButton: { backgroundColor: colors.coral, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 10 },
  resetButtonText: { color: colors.bg, fontWeight: "700", fontSize: 12 },
  resultBox: {
    backgroundColor: colors.tealSoft, borderWidth: 1, borderColor: colors.teal,
    borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm,
  },
  resultTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  resultTitle: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  dismissText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  passwordRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm,
    backgroundColor: colors.bg, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 10,
    marginBottom: spacing.xs,
  },
  passwordText: { flex: 1, color: colors.ink, fontSize: 18, fontWeight: "800", letterSpacing: 2, textAlign: "center" },
  copyIcon: { fontSize: 18 },
  copiedText: { color: colors.teal, fontSize: 11, fontWeight: "700", marginBottom: spacing.xs },
  resultHint: { color: colors.muted, fontSize: 11 },

  dangerZone: {
    borderTopWidth: 1, borderTopColor: colors.line, marginTop: spacing.md, paddingTop: spacing.md,
  },
  dangerTitle: { color: colors.coral, fontSize: 13, fontWeight: "800", marginBottom: 4 },
  dangerText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: spacing.sm },
  dangerLabel: { color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 4 },
  dangerInput: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 8, color: colors.ink, fontSize: 13, marginBottom: spacing.sm,
  },
  dangerButton: {
    backgroundColor: colors.coral, borderRadius: radius.sm, paddingVertical: 10, alignItems: "center",
  },
  dangerButtonDisabled: { opacity: 0.4 },
  dangerButtonText: { color: colors.bg, fontWeight: "800", fontSize: 12 },
});
