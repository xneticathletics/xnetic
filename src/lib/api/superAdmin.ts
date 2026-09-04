import { supabase } from "../supabase";
import { sendNotification } from "./notifications";

export type ClubSummary = {
  id: string;
  name: string;
  created_at: string;
  subscription: { billing_period: string; status: string } | null;
};

export type PlatformStats = {
  totalClubs: number;
  activeSubscriptions: number;
  // Sadece GERÇEKTEN tamamlanmış (status='active', iyzico onaylı) ödemelerin
  // amount_try toplamı — "kasaya giren para". mock_paid hiçbir gerçek para
  // hareketi içermediği için buna dahil EDİLMEZ; iyzico bağlanana kadar bu
  // rakam ₺0 kalır, bu beklenen ve doğru bir davranış.
  completedRevenueTry: number;
};

// Sadece Süper Admin'in erişebildiği, tüm kulüpleri (kiracıları) listeleyen
// sorgu — clubs/club_subscriptions RLS politikaları zaten is_super_admin()
// için tam erişime izin veriyor.
export async function listAllClubs(): Promise<ClubSummary[]> {
  const [clubsResult, subsResult] = await Promise.all([
    supabase.from("clubs").select("id, name, created_at").order("created_at", { ascending: false }),
    supabase.from("club_subscriptions").select("club_id, billing_period, status").order("created_at", { ascending: false }),
  ]);
  if (clubsResult.error) throw clubsResult.error;
  if (subsResult.error) throw subsResult.error;

  const subByClub = new Map<string, { billing_period: string; status: string }>();
  (subsResult.data ?? []).forEach((s) => {
    if (!subByClub.has(s.club_id)) subByClub.set(s.club_id, s);
  });

  return (clubsResult.data ?? []).map((c) => ({ ...c, subscription: subByClub.get(c.id) ?? null }));
}

export type SubscriptionRow = {
  // Boşsa (club_subscriptions'ta hiç kaydı yoksa) "" — yeni kayıt oluşturmak için kullanılır.
  id: string;
  club_id: string;
  club_name: string;
  billing_period: string;
  // Gerçek bir durum değeri yoksa "none" — henüz hiç abonelik kaydı açılmamış demektir.
  status: string;
  amount_try: number;
  created_at: string;
};

// Abonelikler ekranı için — her kulübün EN SON abonelik kaydıyla birlikte
// (varsa) tam listesi. listAllClubs'taki özet rozetlerin aksine, burada
// düzenlemek için gereken id/tutar da dahil.
export async function listAllSubscriptions(): Promise<SubscriptionRow[]> {
  const [clubsResult, subsResult] = await Promise.all([
    supabase.from("clubs").select("id, name").order("name", { ascending: true }),
    supabase
      .from("club_subscriptions")
      .select("id, club_id, billing_period, status, amount_try, created_at")
      .order("created_at", { ascending: false }),
  ]);
  if (clubsResult.error) throw clubsResult.error;
  if (subsResult.error) throw subsResult.error;

  const latestByClub = new Map<string, (typeof subsResult.data)[number]>();
  (subsResult.data ?? []).forEach((s) => {
    if (!latestByClub.has(s.club_id)) latestByClub.set(s.club_id, s);
  });

  return (clubsResult.data ?? []).map((c) => {
    const s = latestByClub.get(c.id);
    return {
      id: s?.id ?? "",
      club_id: c.id,
      club_name: c.name,
      billing_period: s?.billing_period ?? "monthly",
      status: s?.status ?? "none",
      amount_try: s?.amount_try ?? 0,
      created_at: s?.created_at ?? "",
    };
  });
}

function computePeriodEnd(billingPeriod: string): string {
  const d = new Date();
  if (billingPeriod === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

// Bir kulübün aboneliğini günceller (id verilirse) ya da hiç kaydı yoksa
// yeni bir tane açar (id boşsa). iyzico entegrasyonu hazır olana kadar
// Süper Admin ödemeyi elle (banka havalesi vb.) takip edip buradan
// durumu/tutarı işliyor. Durum "active"e çekilince (onay), dönem bitişi
// otomatik hesaplanır ve kulüp admin(ler)ine onay bildirimi (+push) gider.
export async function upsertSubscription(input: {
  id?: string;
  club_id: string;
  billing_period: string;
  status: string;
  amount_try: number;
}) {
  const currentPeriodEnd = input.status === "active" ? computePeriodEnd(input.billing_period) : null;

  if (input.id) {
    const { error } = await supabase
      .from("club_subscriptions")
      .update({
        billing_period: input.billing_period,
        status: input.status,
        amount_try: input.amount_try,
        ...(input.status === "active" ? { current_period_end: currentPeriodEnd } : {}),
      })
      .eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("club_subscriptions").insert({
      club_id: input.club_id,
      billing_period: input.billing_period,
      status: input.status,
      amount_try: input.amount_try,
      current_period_end: currentPeriodEnd,
    });
    if (error) throw error;
  }

  if (input.status === "active") {
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .eq("club_id", input.club_id)
      .eq("role", "club_admin")
      .eq("is_active", true);
    await Promise.all(
      (admins ?? []).map((a) =>
        sendNotification(
          a.id,
          "Ödemen Onaylandı 🎉",
          "Kulübünün abonelik ödemesi onaylandı — X-NETIC'i hemen kullanmaya başlayabilirsin."
        ).catch(() => {})
      )
    );
  }
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [clubsCount, activeSubs, completedPayments] = await Promise.all([
    supabase.from("clubs").select("id", { count: "exact", head: true }),
    supabase.from("club_subscriptions").select("id", { count: "exact", head: true }).in("status", ["mock_paid", "active"]),
    supabase.from("club_subscriptions").select("amount_try").eq("status", "active"),
  ]);
  const completedRevenueTry = (completedPayments.data ?? []).reduce((sum, r) => sum + (r.amount_try ?? 0), 0);

  return {
    totalClubs: clubsCount.count ?? 0,
    activeSubscriptions: activeSubs.count ?? 0,
    completedRevenueTry: Math.round(completedRevenueTry),
  };
}

// Süper Admin'in TEK ulaşabildiği kişi kategorisi: kulüp adminleri.
// Herhangi bir gerçek kulübün veli/sporcu/antrenör verisine hiç erişimi
// olmaması gerektiği için (gizlilik/güvenlik) mesajlaşma ve duyuru burada
// KASITLI olarak sadece club_admin rolüyle sınırlı tutuluyor.
export async function notifyAllClubAdmins(title: string, body: string): Promise<number> {
  const { data, error } = await supabase.from("users").select("id").eq("role", "club_admin").eq("is_active", true);
  if (error) throw error;
  const admins = data ?? [];
  await Promise.all(admins.map((a) => sendNotification(a.id, title, body).catch(() => {})));
  return admins.length;
}
