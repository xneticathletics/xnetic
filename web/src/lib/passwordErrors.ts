// Supabase Auth'un şifre değiştirme işlemlerinden dönen İngilizce/teknik
// hata mesajlarını Türkçe'ye çevirir — mobildeki src/lib/passwordErrors.ts
// ile birebir aynı.
export function translatePasswordError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("should be different from the old password") || lower.includes("same as the old password")) {
    return "Yeni şifre, eski şifreyle aynı olamaz. Farklı bir şifre seç.";
  }
  if (lower.includes("at least 6 characters") || lower.includes("should be at least")) {
    return "Şifre en az 6 karakter olmalı.";
  }
  if (lower.includes("session") || lower.includes("not authenticated") || lower.includes("jwt")) {
    return "Oturum süresi doldu. Lütfen çıkış yapıp tekrar giriş yap.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Bağlantı hatası. İnternet bağlantını kontrol edip tekrar dene.";
  }
  return "Şifre değiştirilemedi. Lütfen tekrar dene.";
}
