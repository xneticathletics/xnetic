// Serbest bir girişten rakamları ayıklar, başında "0" yoksa ekler ve 11
// haneye keser — telefon numarasını hem görüntüleme (formatPhoneNumber)
// hem de giriş kimliği (loginIdentifier) tarafında aynı şekilde
// normalize etmek için ortak nokta.
export function extractPhoneDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length > 0 && !digits.startsWith("0")) digits = `0${digits}`;
  return digits.slice(0, 11);
}

// Türkiye telefon numaralarını (sabit/mobil fark etmeksizin) tek tip bir
// biçimde gösterir: 0XXX-XXX-XX-XX (toplam 11 rakam). Kullanıcı yazdıkça
// otomatik olarak tire ekler ve 11 rakamdan fazla girişe izin vermez.
// Kullanıcı başındaki "0"ı yazmayı unutup direkt "532..." yazsa bile
// otomatik olarak başa ekleriz — elle "0" girmesine gerek kalmaz.
export function formatPhoneNumber(input: string): string {
  const digits = extractPhoneDigits(input);
  const parts = [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 9), digits.slice(9, 11)];
  return parts.filter(Boolean).join("-");
}
