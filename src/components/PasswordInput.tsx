import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, type TextInputProps } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";

// Şifre alanı + göster/gizle (göz) düğmesi — ilk giriş ve şifre sıfırlama
// ekranlarında kullanıcı yazdığını kontrol edebilsin diye.
export default function PasswordInput(props: Omit<TextInputProps, "secureTextEntry" | "style">) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.wrapper}>
      <TextInput
        {...props}
        style={styles.input}
        secureTextEntry={!visible}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => setVisible((v) => !v)}
        accessibilityLabel={visible ? "Şifreyi gizle" : "Şifreyi göster"}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.iconText}>{visible ? "🙈" : "👁️"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    paddingLeft: spacing.md, paddingRight: spacing.xs,
  },
  input: { flex: 1, color: colors.ink, paddingVertical: 12 },
  iconButton: { paddingHorizontal: 8, paddingVertical: 8 },
  iconText: { fontSize: 16 },
});
