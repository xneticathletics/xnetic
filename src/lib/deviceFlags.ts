import * as SecureStore from "expo-secure-store";

// Bu cihazda daha önce başarılı bir giriş yapılıp yapılmadığını hatırlar.
// "Kulüp Oluştur" linkini sadece HİÇ giriş yapılmamış cihazlarda göstermek
// için kullanılır — session persistImi kapalı olduğu için (bkz. supabase.ts)
// bu, oturumdan bağımsız, kalıcı ayrı bir bayrak olmak zorunda.
const HAS_SIGNED_IN_KEY = "xnetic_has_signed_in";

export async function hasSignedInBefore(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(HAS_SIGNED_IN_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function markSignedIn(): Promise<void> {
  try {
    await SecureStore.setItemAsync(HAS_SIGNED_IN_KEY, "true");
  } catch {
    // sessizce yut — bu sadece bir UX kolaylığı, kritik değil
  }
}

// Sadece test/geliştirme amaçlı: bu cihazı "hiç giriş yapılmamış" durumuna
// geri döndürür, böylece "Kulüp Oluştur" linki test için tekrar görünür.
export async function resetSignedInFlag(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(HAS_SIGNED_IN_KEY);
  } catch {
    // sessizce yut
  }
}
