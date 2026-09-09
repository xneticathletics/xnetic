import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "../theme/tokens";
import { useHomeButton } from "../hooks/useHomeButton";
import AthletePickerModal from "../components/AthletePickerModal";
import type { Athlete } from "../lib/api/athletes";
import type { HomeStackParamList } from "../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "IndividualFitnessProgramsHub">;

// Fitness sekmesindeki "Bireysel Programlar" girişi — sporcu bazlı bir
// özellik olduğu için (Wellness/Program/Fitness Grupları gibi genel bir
// liste değil) önce bir sporcu seçtiriyor, sonra o sporcunun bireysel
// programlarını gösteren (zaten var olan, salt okunur) ekrana geçiyor.
export default function IndividualFitnessProgramsHubScreen({ navigation }: Props) {
  useHomeButton(navigation);
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleSelect = (athlete: Athlete) => {
    setPickerVisible(false);
    navigation.navigate("IndividualFitnessProgramList", { athleteId: athlete.id, athleteName: athlete.full_name });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📝</Text>
      <Text style={styles.title}>Bireysel Programlar</Text>
      <Text style={styles.subtitle}>
        Sporcuların kendi yazdığı bireysel fitness programlarını incelemek için bir sporcu seç.
      </Text>
      <TouchableOpacity style={styles.pickButton} onPress={() => setPickerVisible(true)}>
        <Text style={styles.pickButtonText}>Sporcu Seç</Text>
      </TouchableOpacity>

      <AthletePickerModal
        visible={pickerVisible}
        selectedId={null}
        onSelect={handleSelect}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  icon: { fontSize: 40, marginBottom: spacing.md },
  title: { color: colors.ink, fontSize: 18, fontWeight: "800", marginBottom: spacing.xs },
  subtitle: { color: colors.muted, fontSize: 13, textAlign: "center", marginBottom: spacing.lg, lineHeight: 19 },
  pickButton: { backgroundColor: colors.violet, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: 14 },
  pickButtonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
});
