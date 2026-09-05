const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export type BillingPeriod = "monthly" | "yearly";

export type CreateClubInput = {
  clubName: string;
  adminName: string;
  email: string;
  phone: string;
  password: string;
  billingPeriod: BillingPeriod;
  // KVKK Aydınlatma Metni ve Kullanım Şartları'nın okunup kabul edildiği —
  // edge function bu true olmadan hesap oluşturmuyor ve kabul anını
  // user_consents'e kaydediyor (bkz. supabase/functions/create-club).
  consentAccepted: boolean;
};

// create-club Edge Function'ını ham fetch ile çağırıyoruz (inviteUser.ts'deki
// aynı sebeple). Burada kullanıcının HENÜZ hiçbir oturumu yok, bu yüzden
// Authorization olarak anon key gönderiliyor — fonksiyon verify_jwt=false ile
// yayınlandığı için bu, kimliksiz bir çağrıyı Supabase gateway'inden geçirmeye
// yeter (mobildeki src/lib/api/clubSignup.ts ile birebir aynı — kulüp
// oluşturma artık SADECE web'den yapılabiliyor, mobil bu akışı içermiyor).
export async function createClub(input: CreateClubInput): Promise<{ clubId: string }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-club`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(input),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error || `İstek başarısız oldu (kod: ${response.status}).`);
  }
  return { clubId: json.clubId };
}
