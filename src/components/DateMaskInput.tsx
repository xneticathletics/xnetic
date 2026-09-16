import React, { useState, useEffect } from "react";
import { TextInput, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";

// BirthDateInput.tsx ile BİREBİR AYNI maskeleme mantığı — kullanıcı sadece
// rakam yazar, "GG-AA-YYYY" formatını ve tireleri otomatik ekleriz. Doğum
// tarihine özel olmayan tarih alanları için (ör. Aidat'ta "İlk Ödeme
// Tarihi") ayrı, nötr isimli bir bileşen olarak tutuluyor — BirthDateInput
// zaten 5 farklı ekranda kullanılıyor, adını genelleştirmek gereksiz risk.
// Dışarıya (ve veritabanına) hep "YYYY-AA-GG" (ISO) formatında değer verir.

function isoToDisplay(iso: string | null): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const [, y, mo, d] = m;
  return `${d}-${mo}-${y}`;
}

function displayDigitsToIso(digits: string): string | null {
  if (digits.length !== 8) return null;
  const d = digits.slice(0, 2);
  const mo = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  return `${y}-${mo}-${d}`;
}

function formatDigitsForDisplay(digits: string): string {
  let out = "";
  for (let i = 0; i < digits.length && i < 8; i++) {
    if (i === 2 || i === 4) out += "-";
    out += digits[i];
  }
  return out;
}

export default function DateMaskInput({
  value,
  onChange,
  onFocus,
  placeholder = "GG-AA-YYYY",
}: {
  value: string | null; // ISO: YYYY-AA-GG
  onChange: (iso: string | null) => void;
  onFocus?: (e: any) => void;
  placeholder?: string;
}) {
  const [display, setDisplay] = useState(() => isoToDisplay(value));

  useEffect(() => {
    setDisplay(isoToDisplay(value));
  }, [value]);

  const handleChangeText = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, 8);
    setDisplay(formatDigitsForDisplay(digits));
    onChange(displayDigitsToIso(digits));
  };

  return (
    <TextInput
      onFocus={onFocus}
      style={styles.input}
      value={display}
      onChangeText={handleChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType="number-pad"
      maxLength={10}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md,
    color: colors.ink, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
});
