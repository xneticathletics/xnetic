import { useCallback, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";

// Bir değeri panoya kopyalayıp, kopyalanan alanın YANINDA (ekranın ortasında
// değil) kısa süre görünüp kendiliğinden kaybolan bir "Kopyalandı" etiketi
// göstermek için. Her kopyalanabilir alan kendi anahtarını (key) verir —
// aynı anda sadece o alanın etiketi görünür.
export function useCopyToast(hideAfterMs: number = 1200) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(async (key: string, value: string) => {
    if (!value.trim()) return;
    await Clipboard.setStringAsync(value.trim());
    if (timerRef.current) clearTimeout(timerRef.current);
    setCopiedKey(key);
    timerRef.current = setTimeout(() => setCopiedKey(null), hideAfterMs);
  }, [hideAfterMs]);

  return { copy, copiedKey };
}
