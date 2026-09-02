import React, { useCallback, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { getMatch, updateMatch, notifyMatchResult, getMatchResult, type MatchRow } from "../lib/api/matches";
import { listBranches } from "../lib/api/branches";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "MatchResult">;

const RESULT_LABEL: Record<string, string> = { win: "Galibiyet", draw: "Beraberlik", loss: "Mağlubiyet" };
const RESULT_COLOR: Record<string, string> = { win: colors.teal, draw: colors.yellow, loss: colors.coral };

export default function MatchResultScreen({ route, navigation }: Props) {
  const { matchId } = route.params;
  const { handleFocus } = useKeyboardScroll();

  const [match, setMatch] = useState<MatchRow | null>(null);
  const [isIndividual, setIsIndividual] = useState(false);
  const [ourScore, setOurScore] = useState("");
  const [oppScore, setOppScore] = useState("");
  const [resultNote, setResultNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getMatch(matchId), listBranches()])
        .then(([m, branches]) => {
          setMatch(m);
          setOurScore(m.our_score !== null ? String(m.our_score) : "");
          setOppScore(m.opponent_score !== null ? String(m.opponent_score) : "");
          setResultNote(m.result_note ?? "");
          const branch = branches.find((b) => b.name === m.groups?.branch);
          setIsIndividual(branch?.is_individual ?? false);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [matchId])
  );

  const handleSave = async () => {
    if (savingRef.current || !match) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      let updated: MatchRow;
      let shouldNotify: boolean;

      if (isIndividual) {
        const trimmedNote = resultNote.trim() || null;
        shouldNotify = trimmedNote !== null && trimmedNote !== (match.result_note?.trim() || null);
        updated = await updateMatch(matchId, {
          group_id: match.group_id,
          opponent_name: match.opponent_name,
          match_date: match.match_date,
          start_time: match.start_time.slice(0, 5),
          location: match.location,
          notes: match.notes,
          our_score: null,
          opponent_score: null,
          result_note: trimmedNote,
        });
      } else {
        const newOur = ourScore.trim() ? Number(ourScore) : null;
        const newOpp = oppScore.trim() ? Number(oppScore) : null;
        shouldNotify = (newOur !== match.our_score || newOpp !== match.opponent_score) && newOur !== null && newOpp !== null;
        updated = await updateMatch(matchId, {
          group_id: match.group_id,
          opponent_name: match.opponent_name,
          match_date: match.match_date,
          start_time: match.start_time.slice(0, 5),
          location: match.location,
          notes: match.notes,
          our_score: newOur,
          opponent_score: newOpp,
          result_note: null,
        });
      }

      if (shouldNotify) {
        notifyMatchResult(updated).catch(() => {});
      }
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? "Kaydedilemedi");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.error}>{error ?? "Müsabaka bulunamadı."}</Text>
      </View>
    );
  }

  const liveOur = ourScore.trim() ? Number(ourScore) : null;
  const liveOpp = oppScore.trim() ? Number(oppScore) : null;
  const liveResult = getMatchResult({ our_score: liveOur, opponent_score: liveOpp });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerGroup}>🏆 {match.groups?.name ?? "Grup atanmadı"}</Text>
          {!isIndividual && <Text style={styles.headerOpponent}>vs. {match.opponent_name}</Text>}
          <Text style={styles.headerDate}>{match.match_date} · {match.start_time.slice(0, 5)}</Text>
        </View>

        {isIndividual ? (
          <>
            <Text style={styles.noteLabel}>Sonuç Açıklaması</Text>
            <TextInput
              onFocus={handleFocus}
              style={styles.noteInput}
              value={resultNote}
              onChangeText={setResultNote}
              placeholder="Örn. Ali 1., Ayşe 3. oldu. Mehmet finale kaldı."
              placeholderTextColor={colors.muted}
              multiline
            />
          </>
        ) : (
          <>
            <View style={styles.scoreRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Bizim Skor</Text>
                <TextInput
                  onFocus={handleFocus}
                  style={styles.scoreInput}
                  value={ourScore}
                  onChangeText={setOurScore}
                  keyboardType="numeric"
                  placeholder="—"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <Text style={styles.dash}>–</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Rakip Skor</Text>
                <TextInput
                  onFocus={handleFocus}
                  style={styles.scoreInput}
                  value={oppScore}
                  onChangeText={setOppScore}
                  keyboardType="numeric"
                  placeholder="—"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            {liveResult && (
              <View style={[styles.resultBadge, { backgroundColor: `${RESULT_COLOR[liveResult]}22` }]}>
                <Text style={[styles.resultBadgeText, { color: RESULT_COLOR[liveResult] }]}>{RESULT_LABEL[liveResult]}</Text>
              </View>
            )}
          </>
        )}

        <Text style={styles.hint}>
          Sonucu kaydedince grubun velilerine, antrenörlerine, koordinatörüne ve sporcularına otomatik bildirim gider.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.saveButtonText}>Sonucu Kaydet</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  error: { color: colors.coral, marginBottom: spacing.md },
  header: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  headerGroup: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  headerOpponent: { color: colors.muted, fontSize: 13, marginTop: 2 },
  headerDate: { color: colors.muted, fontSize: 12, marginTop: 4 },
  scoreRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, marginBottom: spacing.md },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6, textAlign: "center" },
  noteLabel: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  scoreInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, fontSize: 22, fontWeight: "800", textAlign: "center", paddingVertical: 14,
  },
  noteInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, fontSize: 14, paddingHorizontal: spacing.md, paddingVertical: 12,
    minHeight: 100, textAlignVertical: "top", marginBottom: spacing.md,
  },
  dash: { color: colors.muted, fontSize: 22, fontWeight: "800", marginBottom: 14 },
  resultBadge: { alignSelf: "center", borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6, marginBottom: spacing.md },
  resultBadgeText: { fontSize: 13, fontWeight: "800" },
  hint: { color: colors.muted, fontSize: 12, textAlign: "center", lineHeight: 17, marginBottom: spacing.lg },
  saveButton: { backgroundColor: colors.yellow, borderRadius: radius.md, paddingVertical: 16, alignItems: "center" },
  saveButtonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
});
