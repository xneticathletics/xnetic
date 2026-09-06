import { extractPhoneDigits, formatPhoneNumber } from "./phoneFormat";

// Supabase Auth bu projede sadece e-posta+şifre ile çalışıyor (SMS
// sağlayıcısı yok). Gerçek e-postası olmayan veli/sporcu için, Auth'un
// iç kimliği olarak kullanılan ama hiçbir yerde GÖSTERİLMEYEN sentetik
// bir e-posta üretiyoruz — kişi uygulamaya kendi telefon numarası ya da
// kullanıcı adıyla giriş yapıyormuş gibi hissediyor.
//
// ÖNEMLİ: Bu fonksiyonun birebir aynısı supabase/functions/invite-user/
// index.ts içinde de (Deno tarafı, buradan import edemediği için) ayrı
// bir kopya olarak duruyor. Biri değişirse diğeri de değişmeli.
const FAKE_LOGIN_DOMAIN = "xnetic.local";

export function resolveLoginEmail(identifier: string): string {
  const trimmed = identifier.trim();
  if (!trimmed) throw new Error("Giriş bilgisi boş olamaz.");
  if (trimmed.includes("@")) return trimmed.toLowerCase();

  const rawDigitCount = trimmed.replace(/\D/g, "").length;
  if (rawDigitCount >= 9) {
    const digits = extractPhoneDigits(trimmed);
    return `tel${digits}@${FAKE_LOGIN_DOMAIN}`;
  }

  const username = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!username) throw new Error("Geçerli bir telefon numarası veya kullanıcı adı gir.");
  return `usr${username}@${FAKE_LOGIN_DOMAIN}`;
}

// resolveLoginEmail'in tersi — Profil > Kişisel Bilgiler'de kullanıcının
// ŞU AN neyle giriş yaptığını okunabilir şekilde göstermek için (sentetik
// tel.../usr...@xnetic.local adresi hiçbir zaman ham hâliyle gösterilmez).
export function describeLoginIdentifier(loginEmail: string): string {
  const atIndex = loginEmail.indexOf("@");
  const domain = atIndex >= 0 ? loginEmail.slice(atIndex + 1) : "";
  if (domain !== FAKE_LOGIN_DOMAIN) return loginEmail;

  const local = loginEmail.slice(0, atIndex);
  if (local.startsWith("tel")) return formatPhoneNumber(local.slice(3));
  if (local.startsWith("usr")) return local.slice(3);
  return loginEmail;
}

// Sporcu/Veli giriş hesabı oluştururken kullanıcı adı alanına canlı
// uygulanır — boşluk, nokta ve diğer semboller, büyük harf hiç
// yazılamasın diye (telefon girişini bozmaz, rakamlar zaten etkilenmiyor).
export function sanitizeUsernameInput(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}
