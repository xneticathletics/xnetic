import React, { useCallback, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { listMyContacts, type Contact } from "../lib/api/messages";
import type { UserRole } from "../context/AuthContext";
import type { MessagesStackParamList } from "../navigation/MessagesStack";

type Props = NativeStackScreenProps<MessagesStackParamList, "NewMessage"> & { role: UserRole };

type RoleFilter = "all" | "coach" | "athlete" | "parent";

const ROLE_FILTERS: { key: RoleFilter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "coach", label: "Antrenörler" },
  { key: "athlete", label: "Sporcular" },
  { key: "parent", label: "Veliler" },
];

export default function NewMessageScreen({ navigation, role }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      listMyContacts(role)
        .then(setContacts)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [role])
  );

  const filtered = contacts
    .filter((c) => roleFilter === "all" || c.role === roleFilter)
    .filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {ROLE_FILTERS.map((f) => {
          const active = roleFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setRoleFilter(f.key)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        style={styles.search}
        placeholder="Kişi ara..."
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
      />

      {loading && <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              {query ? "Eşleşen kişi bulunamadı." : "Mesajlaşabileceğin kimse yok."}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.replace("Chat", { userId: item.id, userName: item.name })}
          >
            {item.photo_url ? (
              <Image source={{ uri: item.photo_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.rowName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
  filterChip: {
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface,
    borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  filterChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  filterChipText: { color: colors.muted, fontWeight: "600", fontSize: 12 },
  filterChipTextActive: { color: colors.bg, fontWeight: "800" },
  search: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12, marginBottom: spacing.md,
  },
  error: { color: colors.coral, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  avatar: {
    width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.line,
    alignItems: "center", justifyContent: "center",
  },
  avatarImage: { width: 40, height: 40, borderRadius: radius.full },
  avatarText: { color: colors.ink, fontWeight: "700" },
  rowName: { color: colors.ink, fontSize: 14, fontWeight: "600" },
});
