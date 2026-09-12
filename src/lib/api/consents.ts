import { supabase } from "../supabase";
import { getCurrentAppUserId } from "./currentUser";

// "saglik" (sağlık verisi işleme izni) 2026-09-12'de kaldırıldı — kulüp
// artık sporcuların sağlık verisini (kan grubu, alerji, ilaç, sağlık notu)
// hiç toplamıyor, bu yüzden ayrı bir rıza maddesine de gerek kalmadı.
// Daha önce bu tipi kabul etmiş kullanıcıların user_consents'taki eski
// "saglik" satırına dokunulmadı — zararsız, sadece artık talep edilmiyor.
export type ConsentType = "kvkk" | "foto_video" | "sorumluluk";

// Sıra bu dizideki gibi, tek tek gösterilir — sırasını değiştirmek akışın
// sırasını da değiştirir.
export const REQUIRED_CONSENT_TYPES: ConsentType[] = ["kvkk", "foto_video", "sorumluluk"];

export async function getMyAcceptedConsentTypes(): Promise<ConsentType[]> {
  const userId = await getCurrentAppUserId();
  if (!userId) return [];
  const { data, error } = await supabase.from("user_consents").select("consent_type").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.consent_type as ConsentType);
}

export async function hasAllRequiredConsents(): Promise<boolean> {
  const accepted = await getMyAcceptedConsentTypes();
  return REQUIRED_CONSENT_TYPES.every((t) => accepted.includes(t));
}

export async function acceptConsent(type: ConsentType): Promise<void> {
  const userId = await getCurrentAppUserId();
  if (!userId) throw new Error("Kullanıcı bulunamadı");
  const { error } = await supabase.from("user_consents").upsert(
    { user_id: userId, consent_type: type },
    { onConflict: "user_id,consent_type", ignoreDuplicates: true }
  );
  if (error) throw error;
}
