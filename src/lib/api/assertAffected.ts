// Supabase/PostgREST'te RLS'in USING koşulu bir satırı filtrelediğinde,
// `.update()`/`.delete()` HATA DÖNMEZ — sadece 0 satır etkilenir ve
// çağıran kod bunu fark etmez (WITH CHECK ihlali hata verir ama USING
// filtrelemesi sessizdir). Bu proje genelinde birkaç admin-only yazma
// fonksiyonu (updateCoach, deactivateCoach, deactivateUser,
// setBranchCoordinator, deleteBranch, setAthleteType) `.select()` hiç
// eklemeden çağırıyordu — yani RLS bir yazmayı engellediğinde ekran
// "başarılı" gösterip hiçbir şey değişmemiş oluyordu. Bu yardımcı, o
// satır sayısını (data.length) kontrol edip 0 ise anlamlı bir hata
// fırlatır.
export function assertRowAffected<T>(data: T[] | null, message = "Bu işlem için yetkin yok ya da kayıt bulunamadı."): void {
  if (!data || data.length === 0) throw new Error(message);
}
