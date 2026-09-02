const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export type BillingPeriod = "monthly" | "yearly";

export type CreateClubInput = {
  clubName: string;
  adminName: string;
  email: string;
  phone: string;
  password: string;
  billingPeriod: BillingPeriod;
};

// create-club Edge Function'ını ham fetch ile çağırıyoruz (invite-user'daki
// aynı sebeple — bkz. inviteUser.ts). Burada kullanıcının HENÜZ hiçbir
// oturumu yok, bu yüzden Authorization olarak anon key gönderiliyor —
// fonksiyon verify_jwt=false ile yayınlandığı için bu, tamamen kimliksiz
// bir çağrıyı Supabase gateway'inden geçirmeye yeter.
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
