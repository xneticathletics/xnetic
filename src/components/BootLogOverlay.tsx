// TEŞHİS AMAÇLI GEÇİCİ BİLEŞEN — bkz. ../lib/bootLog.ts.
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { subscribeBoot } from "../lib/bootLog";

export default function BootLogOverlay() {
  const [steps, setSteps] = useState<string[]>([]);
  useEffect(() => subscribeBoot(setSteps), []);
  return (
    <View style={styles.container} pointerEvents="none">
      {steps.map((s, i) => (
        <Text key={i} style={styles.text}>
          {i + 1}. {s}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", top: 60, left: 12, right: 12, zIndex: 9999 },
  text: { color: "#00FF00", fontSize: 11, fontFamily: "Courier" },
});
