import { useRef } from "react";
import { Alert } from "react-native";
import { usePreventRemove } from "@react-navigation/native";

// Bir oluşturma/düzenleme formunda kaydedilmemiş değişiklik varken geri
// gidilmeye çalışılırsa (geri tuşu, kaydırma hareketi, Ana Sayfa vb.) onay
// ister. navigation.addListener("beforeRemove", ...) yerine BİLEREK
// usePreventRemove kullanılıyor — native-stack'te beforeRemove, geri
// KAYDIRMA hareketiyle (swipe-back) birlikte tam desteklenmiyor ve "ekran
// native tarafta kaldırıldı ama JS state'te kalmış" hatasına yol açıyor;
// usePreventRemove bu senaryo için React Navigation'ın resmi çözümü (ilk
// bu desenle AthleteFormScreen.tsx'te kullanıldı, buraya ortak hook olarak
// çıkarıldı).
//
// Kaydet başarıyla tamamlanınca handleSave içinde navigation.goBack()'ten
// HEMEN ÖNCE markSaved() çağrılmalı — aksi halde state güncellemesi henüz
// ekrana yansımadığı (hasUnsavedChanges hâlâ eski değeri gördüğü) için
// başarılı kayıttan sonra da yanlışlıkla "emin misin?" sorusu çıkar.
export function useUnsavedChangesGuard(navigation: any, hasUnsavedChanges: boolean) {
  const justSavedRef = useRef(false);

  usePreventRemove(hasUnsavedChanges, ({ data }: any) => {
    if (justSavedRef.current) {
      navigation.dispatch(data.action);
      return;
    }
    Alert.alert(
      "Çıkmak istediğine emin misin?",
      "Yaptığın değişiklikler kaydedilmeyecek.",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Çık", style: "destructive", onPress: () => navigation.dispatch(data.action) },
      ]
    );
  });

  const markSaved = () => {
    justSavedRef.current = true;
  };

  return { markSaved };
}
