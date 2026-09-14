import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { colors, radius } from "../theme/tokens";

export type AvatarGender = "erkek" | "kadin" | null | undefined;
export type AvatarKind = "athlete" | "coach";

const ICONS: Record<AvatarKind, Record<"erkek" | "kadin", string>> = {
  athlete: { erkek: "👦", kadin: "👧" },
  coach: { erkek: "👨", kadin: "👩" },
};

// Fotoğrafı olmayan sporcu/antrenör kartlarında baş harf yerine (ya da
// baş harfle birlikte, cinsiyet bilinmiyorsa) gösterilen geçici avatar —
// gender bilgisi girilmemişse (null/undefined) sessizce baş harfe düşer,
// yeni bir davranış eklemez.
export default function Avatar({
  photoUrl, name, gender, kind, size = 44, backgroundColor, textColor,
}: {
  photoUrl?: string | null;
  name: string;
  gender?: AvatarGender;
  kind: AvatarKind;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
}) {
  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }

  const icon = gender ? ICONS[kind][gender] : null;

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: backgroundColor ?? colors.yellowSoft },
      ]}
    >
      {icon ? (
        <Text style={{ fontSize: size * 0.5 }}>{icon}</Text>
      ) : (
        <Text style={{ color: textColor ?? colors.yellow, fontSize: size * 0.36, fontWeight: "800" }}>
          {name.slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
});
