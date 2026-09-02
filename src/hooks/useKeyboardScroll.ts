import { useCallback, useEffect, useRef } from "react";
import { Keyboard, Platform, ScrollView, UIManager, findNodeHandle } from "react-native";
import type { NativeSyntheticEvent, TargetedEvent } from "react-native";

// KeyboardAvoidingView tek başına, klavye açıldığında ekranın altının
// kapanmasını engelliyor ama uzun formlarda odaklanılan alanı otomatik
// GÖRÜNÜR yapmıyor (React Native'in bilinen sınırlaması). Bu hook, hangi
// TextInput'a dokunulursa dokunulsun (tek tek alan takibi gerekmeden)
// ScrollView'i o alanı gösterecek şekilde otomatik kaydırır.
//
// Önceki sürüm odaklanma anında sabit bir gecikmeyle (setTimeout) kaydırmayı
// deniyordu — ama klavye animasyonunun ne zaman biteceğini TAHMİN ediyordu,
// bu da cihaza/duruma göre hiç kaymama sonucu verebiliyordu. Bunun yerine
// artık gerçek "klavye açıldı" olayını (Keyboard.addListener) dinleyip,
// ölçümü klavye TAM açıldıktan sonra yapıyoruz — zamanlama artık tahmin
// değil, gerçek olaya bağlı.
export function useKeyboardScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const focusedTargetRef = useRef<number | null>(null);

  const handleFocus = useCallback((event: NativeSyntheticEvent<TargetedEvent>) => {
    // event.target genelde zaten bir native node kimliği (sayı) ama bazı
    // durumlarda component instance da olabilir — ikisini de destekliyoruz.
    const rawTarget = event.target as any;
    const targetHandle = typeof rawTarget === "number" ? rawTarget : findNodeHandle(rawTarget);
    focusedTargetRef.current = targetHandle ?? null;
  }, []);

  useEffect(() => {
    const scrollToFocusedInput = () => {
      const scrollNode = scrollRef.current;
      const targetHandle = focusedTargetRef.current;
      if (!scrollNode || !targetHandle) return;
      const scrollHandle = findNodeHandle(scrollNode);
      if (!scrollHandle) return;

      try {
        UIManager.measureLayout(
          targetHandle,
          scrollHandle,
          () => {
            // Ölçüm başarısız olursa sessizce yut — klavye yine de
            // KeyboardAvoidingView sayesinde alanı tamamen kapatmaz.
          },
          (_x: number, y: number) => {
            scrollNode.scrollTo({ y: Math.max(0, y - 100), animated: true });
          }
        );
      } catch {
        // sessizce yut
      }
    };

    // iOS'ta "will" olayı animasyonla eş zamanlı, Android'de "did" tek
    // güvenilir seçenek — platforma göre en erken güvenilir olayı kullan.
    const eventName = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const subscription = Keyboard.addListener(eventName, scrollToFocusedInput);
    return () => subscription.remove();
  }, []);

  return { scrollRef, handleFocus };
}
