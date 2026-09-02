import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listClubUsers, type ClubUser } from "../lib/api/clubUsers";
import { resetUserPassword } from "../lib/api/passwordReset";
import { listPendingPasswordResetRequests, markNotificationRead } from "../lib/api/notifications";
import { useCopyToast } from "../hooks/useCopyToast";
import type { ClubSettingsStackParamList } from "../navigation/ClubSettingsStack";
import type { UserRole } from "../context/AuthContext";

type Props = NativeStackScreenProps<ClubSettingsStackParamList, "UsersList">;

const ROLE_LABEL: Record<UserRole, string> = {
  club_admin: "Kulüp Yöneticisi",
  coach: "Antrenör",
  parent: "Veli",
  athlete: "Sporcu",
  super_admin: "Süper Admin",
};

const ROLE_ORDER: UserRole[] = ["club_admin", "coach", "parent", "athlete"];

export default function UsersListScreen({}: Props) {
  const [users, setUsers] = useState<ClubUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  // Sıfırlama talep eden bir kullanıcıyı üstte göstermek + Şifreyi
  // Sıfırla'ya basınca ilgili bildirim(ler)i okundu işaretlemek için —
  // aynı kullanıcı için birden fazla okunmamış talep olabilir diye id listesi.
  const [pendingByUserId, setPendingByUserId] = useState<Record<string, string[]>>({});
  const resettingRef = useRef(false);
  const { copy, copiedKey } = useCopyToast();

  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [u, pending] = await Promise.all([listClubUsers(), listPendingPasswordResetRequests()]);
      setUsers(u);
      const byUser: Record<string, string[]> = {};
      pending.forEach((p) => {
        (byUser[p.requesterId] ??= []).push(p.notificationId);
      });
      setPendingByUserId(byUser);
    } catch (e: any) {
      setError(e.message ?? "Kullanıcılar yüklenemedi");
    } finally {
      setLoading(false);
      hasLoadedOnceRef.current = true;
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedOnceRef.current) setLoading(true);
      load();
    }, [load])
  );

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || (u.phone ?? "").toLowerCase().includes(q));
  }, [users, query]);

  // Şifreyi Sıfırla'ya basınca kullanıcı hemen "bekleyenler"den çıkıp
  // normal bölümüne kaysın istemiyoruz — admin yeni şifreyi kopyalayana
  // kadar kart üstte, yerinde kalsın. O yüzden "üstte göster" koşulu hem
  // bekleyen talebi hem de henüz kapatılmamış bir sonucu kapsıyor.
  const isPinned = useCallback((u: ClubUser) => !!pendingByUserId[u.id]?.length || !!results[u.id], [pendingByUserId, results]);

  const pendingUsers = useMemo(() => filteredUsers.filter(isPinned), [filteredUsers, isPinned]);

  const sections = useMemo(() => {
    const byRole: Partial<Record<UserRole, ClubUser[]>> = {};
    filteredUsers.forEach((u) => {
      if (isPinned(u)) return; // zaten üstteki bölümde gösteriliyor
      (byRole[u.role] ??= []).push(u);
    });
    return ROLE_ORDER.filter((r) => byRole[r]?.length).map((role) => ({
      role,
      usersInRole: byRole[role]!,
    }));
  }, [filteredUsers, isPinned]);

  const handleReset = (user: ClubUser) => {
    Alert.alert(
      "Şifreyi sıfırla",
      `${user.name} için yeni bir geçici şifre üretilecek, eski şifresi geçersiz olacak. Devam edilsin mi?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sıfırla",
          style: "destructive",
          onPress: async () => {
            if (resettingRef.current) return;
            resettingRef.current = true;
            setResettingId(user.id);
            try {
              const res = await resetUserPassword(user.id);
              setResults((r) => ({ ...r, [user.id]: res.tempPassword }));
              // Bu kullanıcı için bekleyen talep(ler) varsa, işlem
              // tamamlandığı için bildirim(ler)i okundu işaretle ve
              // listeden (üst bölümden) kaldır.
              const pendingIds = pendingByUserId[user.id];
              if (pendingIds?.length) {
                await Promise.all(pendingIds.map((id) => markNotificationRead(id).catch(() => {})));
                setPendingByUserId((prev) => {
                  const next = { ...prev };
                  delete next[user.id];
                  return next;
                });
              }
            } catch (e: any) {
              Alert.alert("Hata", e.message ?? "Şifre sıfırlanamadı", [{ text: "Tamam" }]);
            } finally {
              resettingRef.current = false;
              setResettingId(null);
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

  const renderUserCard = (u: ClubUser, highlighted: boolean) => (
    <View key={u.id} style={[styles.card, highlighted && styles.cardHighlighted]}>
      <View style={styles.cardRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {!!pendingByUserId[u.id]?.length && <Text style={styles.pendingTag}>🔔 Şifre sıfırlama talep etti</Text>}
          <Text style={styles.cardName} numberOfLines={1}>{u.name}</Text>
          {!!u.phone && <Text style={styles.cardPhone}>{u.phone}</Text>}
        </View>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => handleReset(u)}
          disabled={resettingId === u.id}
        >
          {resettingId === u.id ? (
            <ActivityIndicator color={colors.bg} size="small" />
          ) : (
            <Text style={styles.resetButtonText}>Şifreyi Sıfırla</Text>
          )}
        </TouchableOpacity>
      </View>

      {!!results[u.id] && (
        <View style={styles.resultBox}>
          <View style={styles.resultTitleRow}>
            <Text style={styles.resultTitle}>✓ Yeni Geçici Şifre</Text>
            <TouchableOpacity onPress={() => dismissResult(u.id)}>
              <Text style={styles.dismissText}>Kapat</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.passwordRow}
            onPress={() => copy(u.id, results[u.id])}
            activeOpacity={0.7}
          >
            <Text selectable style={styles.passwordText}>{results[u.id]}</Text>
            <Text style={styles.copyIcon}>{copiedKey === u.id ? "✓" : "📋"}</Text>
          </TouchableOpacity>
          {copiedKey === u.id && <Text style={styles.copiedText}>Kopyalandı</Text>}
          <Text style={styles.resultHint}>
            Bu şifreyi kişiye ilet — bir daha görüntülenmeyecek. İlk girişte değiştirmesi zorunlu.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Kullanıcı ara..."
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
      />

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && pendingUsers.length === 0 && sections.length === 0 && (
        <Text style={styles.empty}>{query ? "Eşleşen kullanıcı bulunamadı." : "Henüz kullanıcı yok."}</Text>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.yellow} />}
      >
        {pendingUsers.length > 0 && (
          <View style={{ marginBottom: spacing.md }}>
            <View style={styles.roleHeaderRow}>
              <View style={[styles.roleHeaderBar, { backgroundColor: colors.coral }]} />
              <Text style={styles.roleHeaderText}>Sıfırlama Talep Edenler</Text>
            </View>
            {pendingUsers.map((u) => renderUserCard(u, true))}
          </View>
        )}

        {sections.map(({ role, usersInRole }) => (
          <View key={role} style={{ marginBottom: spacing.md }}>
            <View style={styles.roleHeaderRow}>
              <View style={styles.roleHeaderBar} />
              <Text style={styles.roleHeaderText}>{ROLE_LABEL[role]}</Text>
            </View>
            {usersInRole.map((u) => renderUserCard(u, false))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.md,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  roleHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.xs },
  roleHeaderBar: { width: 3, height: 12, borderRadius: 2, backgroundColor: colors.yellow },
  roleHeaderText: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  cardHighlighted: { borderColor: colors.coral },
  pendingTag: { color: colors.coral, fontSize: 11, fontWeight: "700", marginBottom: 2 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  cardPhone: { color: colors.muted, fontSize: 12, marginTop: 2 },
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
});
