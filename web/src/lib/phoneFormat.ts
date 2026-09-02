// Serbest bir girişten rakamları ayıklar, başında "0" yoksa ekler ve 11
// haneye keser — mobildeki src/lib/phoneFormat.ts ile birebir aynı.
export function extractPhoneDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length > 0 && !digits.startsWith("0")) digits = `0${digits}`;
  return digits.slice(0, 11);
}

// Türkiye telefon numaralarını tek tip bir biçimde gösterir:
// 0XXX-XXX-XX-XX. Kullanıcı yazdıkça otomatik tire ekler.
export function formatPhoneNumber(input: string): string {
  const digits = extractPhoneDigits(input);
  const parts = [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 9), digits.slice(9, 11)];
  return parts.filter(Boolean).join("-");
}
