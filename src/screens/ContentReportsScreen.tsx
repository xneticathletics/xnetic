import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, spacing } from "../theme/tokens";
import { listContentReports, resolveContentReport, REPORT_REASONS, type ContentReport } from "../lib/api/moderation";

const TYPE_LABEL: Record<string, string> = { message: "Mesaj", social_post: "Sosyal paylaşım", user: "Kullanıcı" };

export default function ContentReportsScreen() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setReports(await listContentReports());
    } catch (e: any) {
      setError(e?.message ?? "Şikayetler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const resolve = async (id: string) => {
    try {
      await resolveContentReport(id);
      await load();
    } catch (e: any) {
      Alert.alert("Hata", e?.message ?? "İşlem yapılamadı");
    }
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={reports}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Henüz şikayet yok.</Text> : null}
        renderItem={({ item }) => (
          <View style={[styles.card, item.status === "resolved" && { opacity: 0.55 }]}>
            <Text style={styles.head}>
              {TYPE_LABEL[item.content_type]} · {REPORT_REASONS.find((r) => r.key === item.reason)?.label}
            </Text>
            <Text style={styles.meta}>
              Şikayet eden: {item.reporter_name} → Şikayet edilen: {item.reported_name}
            </Text>
            {!!item.content_snapshot && <Text style={styles.snapshot}>"{item.content_snapshot}"</Text>}
            {!!item.details && <Text style={styles.body}>{item.details}</Text>}
            <Text style={styles.meta}>{new Date(item.created_at).toLocaleString("tr-TR")}</Text>
            {item.status === "open" ? (
              <TouchableOpacity style={styles.btn} onPress={() => resolve(item.id)}>
                <Text style={styles.btnText}>İncelendi olarak işaretle</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.done}>✓ İncelendi</Text>
            )}
          </View>
        )}
      />
      <Text style={styles.hint}>
        İçeriği kaldırmak için Sosyal sekmesinden paylaşımı silebilir, gerekirse kullanıcıyı Kulüp Ayarları'ndan devre dışı bırakabilirsiniz.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  error: { color: colors.coral, textAlign: "center", marginTop: spacing.sm },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: spacing.md, marginBottom: spacing.sm },
  head: { color: colors.ink, fontWeight: "800", fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  snapshot: { color: colors.ink, fontStyle: "italic", marginTop: spacing.sm },
  body: { color: colors.ink, marginTop: spacing.sm },
  btn: { marginTop: spacing.sm, backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: "center" },
  btnText: { color: colors.bg, fontWeight: "800" },
  done: { color: colors.teal, marginTop: spacing.sm, fontWeight: "700" },
  hint: { color: colors.muted, fontSize: 12, textAlign: "center", padding: spacing.md },
});
