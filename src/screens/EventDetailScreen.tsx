import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Dimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import {
  getEvent, publishEvent, cancelEvent, deleteEvent, listMyRegistrations,
  EVENT_TYPE_LABEL, REGISTRATION_STATUS_LABEL, type EventRow, type EventRegistrationRow,
} from "../lib/api/events";
import { useAuth } from "../context/AuthContext";
import { useBranchSelect } from "../context/BranchSelectContext";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "EventDetail">;

const screenWidth = Dimensions.get("window").width;

export default function EventDetailScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const { role } = useAuth();
  const { selectedBranch, isLocked } = useBranchSelect();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [myRegistration, setMyRegistration] = useState<EventRegistrationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Yayınla/İptal Et/Sil bildirim gönderimi vs. içerdiği için birkaç saniye
  // sürebiliyor — buton kendi üstünde dönen bir gösterge olmadan basıldıktan
  // sonra hiçbir tepki vermiyormuş gibi görünüyordu.
  const [actionLoading, setActionLoading] = useState<"publish" | "cancel" | "delete" | null>(null);

  const isAdmin = role === "club_admin";
  const canManage = isAdmin || (isLocked && !!event?.branch && event.branch === selectedBranch);
  const canRegister = role === "parent" || role === "athlete";

  const load = useCallback(async () => {
    try {
      setError(null);
      const [e, myRegs] = await Promise.all([
        getEvent(eventId),
        canRegister ? listMyRegistrations() : Promise.resolve([]),
      ]);
      setEvent(e);
      setMyRegistration(myRegs.find((r) => r.event_id === eventId && r.status !== "cancelled") ?? null);
    } catch (err: any) {
      setError(err.message ?? "Etkinlik yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [eventId, canRegister]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handlePublish = async () => {
    if (!event || actionLoading) return;
    setActionLoading("publish");
    try {
      await publishEvent(event);
      await load();
    } catch (e: any) {
      Alert.alert("Hata", e.message ?? "Yayınlanamadı", [{ text: "Tamam" }]);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = () => {
    if (!event) return;
    Alert.alert("Etkinliği iptal et", "Bu etkinlik iptal edilecek. Emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "İptal Et", style: "destructive",
        onPress: async () => {
          setActionLoading("cancel");
          try {
            await cancelEvent(event.id);
            await load();
          } catch (e: any) {
            Alert.alert("Hata", e.message ?? "İptal edilemedi", [{ text: "Tamam" }]);
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!event) return;
    Alert.alert("Taslağı sil", "Bu taslak kalıcı olarak silinecek. Emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil", style: "destructive",
        onPress: async () => {
          setActionLoading("delete");
          try {
            await deleteEvent(event.id);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert("Hata", e.message ?? "Silinemedi", [{ text: "Tamam" }]);
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>{error ?? "Etkinlik bulunamadı"}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {event.banner_url ? (
          <Image source={{ uri: event.banner_url }} style={{ width: screenWidth, height: screenWidth * 0.56 }} resizeMode="cover" />
        ) : (
          <View style={[styles.bannerPlaceholder, { width: screenWidth, height: screenWidth * 0.56 }]}>
            <Text style={{ fontSize: 48 }}>🏆</Text>
          </View>
        )}

        <View style={{ padding: spacing.lg }}>
          <View style={styles.badgeRow}>
            <Text style={styles.typeBadge}>{EVENT_TYPE_LABEL[event.type]}</Text>
            {event.status === "draft" && <Text style={[styles.typeBadge, styles.draftBadge]}>Taslak</Text>}
            {event.status === "cancelled" && <Text style={[styles.typeBadge, styles.cancelledBadge]}>İptal Edildi</Text>}
            {event.branch && <Text style={styles.branchBadge}>{event.branch}</Text>}
          </View>

          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.infoCard}>
            <InfoRow icon="📅" label={formatDateRange(event.start_date, event.end_date)} />
            {event.location && <InfoRow icon="📍" label={event.location} />}
            <InfoRow icon="💰" label={event.fee_try > 0 ? `${event.fee_try.toLocaleString("tr-TR")} ₺` : "Ücretsiz"} />
            {event.capacity !== null && <InfoRow icon="👥" label={`Kontenjan: ${event.capacity}`} />}
            {event.registration_deadline && (
              <InfoRow icon="⏰" label={`Son Kayıt: ${new Date(event.registration_deadline).toLocaleDateString("tr-TR")}`} />
            )}
          </View>

          {!!event.description && <Text style={styles.description}>{event.description}</Text>}
        </View>
      </ScrollView>

      {canManage && (
        <View style={styles.footer}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate("EventForm", { eventId: event.id })}
              disabled={!!actionLoading}
            >
              <Text style={styles.secondaryButtonText}>Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate("EventRegistrations", { eventId: event.id })}
              disabled={!!actionLoading}
            >
              <Text style={styles.secondaryButtonText}>Kayıtlar</Text>
            </TouchableOpacity>
          </View>
          {event.status === "draft" && (
            <TouchableOpacity style={styles.primaryButton} onPress={handlePublish} disabled={!!actionLoading}>
              {actionLoading === "publish" ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.primaryButtonText}>Yayınla</Text>
              )}
            </TouchableOpacity>
          )}
          {event.status === "published" && (
            <TouchableOpacity style={styles.destructiveButton} onPress={handleCancel} disabled={!!actionLoading}>
              {actionLoading === "cancel" ? (
                <ActivityIndicator color={colors.coral} />
              ) : (
                <Text style={styles.destructiveButtonText}>Etkinliği İptal Et</Text>
              )}
            </TouchableOpacity>
          )}
          {event.status === "draft" && (
            <TouchableOpacity style={styles.destructiveButton} onPress={handleDelete} disabled={!!actionLoading}>
              {actionLoading === "delete" ? (
                <ActivityIndicator color={colors.coral} />
              ) : (
                <Text style={styles.destructiveButtonText}>Taslağı Sil</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {!canManage && canRegister && event.status === "published" && (
        <View style={styles.footer}>
          {myRegistration ? (
            <View style={styles.statusCard}>
              <Text style={styles.statusCardText}>Kayıt Durumun: {REGISTRATION_STATUS_LABEL[myRegistration.status]}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("EventRegister", { eventId: event.id })}>
              <Text style={styles.primaryButtonText}>Katıl</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function InfoRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

function formatDateRange(start: string, end: string | null): string {
  const s = new Date(start).toLocaleDateString("tr-TR");
  if (!end || end === start) return s;
  return `${s} — ${new Date(end).toLocaleDateString("tr-TR")}`;
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  error: { color: colors.coral },
  bannerPlaceholder: { backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.sm },
  typeBadge: {
    color: colors.bg, backgroundColor: colors.yellow, fontSize: 11, fontWeight: "800",
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, overflow: "hidden",
  },
  draftBadge: { backgroundColor: colors.muted },
  cancelledBadge: { backgroundColor: colors.coral },
  branchBadge: {
    color: colors.violet, backgroundColor: "transparent", borderWidth: 1, borderColor: colors.violet,
    fontSize: 11, fontWeight: "700", paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, overflow: "hidden",
  },
  title: { color: colors.ink, fontSize: 22, fontWeight: "800", marginBottom: spacing.md },
  infoCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6 },
  infoIcon: { fontSize: 16 },
  infoLabel: { color: colors.ink, fontSize: 14, fontWeight: "600", flex: 1 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  footer: {
    padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg, gap: spacing.sm,
  },
  primaryButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center" },
  primaryButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  secondaryButton: {
    flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingVertical: 12, alignItems: "center", backgroundColor: colors.surface,
  },
  secondaryButtonText: { color: colors.ink, fontWeight: "700", fontSize: 13 },
  destructiveButton: { borderWidth: 1, borderColor: colors.coral, borderRadius: radius.md, paddingVertical: 12, alignItems: "center" },
  destructiveButtonText: { color: colors.coral, fontWeight: "700", fontSize: 13 },
  statusCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, alignItems: "center",
  },
  statusCardText: { color: colors.ink, fontWeight: "700", fontSize: 14 },
});
