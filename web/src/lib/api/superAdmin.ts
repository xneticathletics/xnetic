import { supabase } from "../supabase";
import { sendNotification } from "./notifications";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Mobildeki src/lib/api/superAdmin.ts ile birebir aynı — Süper Admin'in
// platform geneli (kulüp bağımsız) yönetim araçları için ortak API katmanı.
export type ClubSummary = {
  id: string;
  name: string;
  created_at: string;
  subscription: { billing_period: string; status: string; amount_try?: number } | null;
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

  // Kulüp Detayı sayfasındaki "Geçmiş" listesi buradan besleniyor — durum
  // her değiştiğinde bir satır düşer (bkz. club_subscription_history
  // migration'ı: tek süper admin olduğu için "kim yaptı" değil, "kulübün
  // abonelik durumu zaman içinde nasıl değişti" bilgisini tutuyoruz).
  await supabase.from("club_subscription_history").insert({
    club_id: input.club_id,
    status: input.status,
    billing_period: input.billing_period,
    amount_try: input.amount_try,
  });

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

// --- Kulüp Detayı sayfası ---------------------------------------------

export async function getClub(clubId: string): Promise<ClubSummary | null> {
  const [clubResult, subResult] = await Promise.all([
    supabase.from("clubs").select("id, name, created_at").eq("id", clubId).maybeSingle(),
    supabase
      .from("club_subscriptions")
      .select("billing_period, status, amount_try")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (clubResult.error) throw clubResult.error;
  if (!clubResult.data) return null;
  return { ...clubResult.data, subscription: subResult.data ?? null };
}

export type ClubAdmin = { id: string; name: string; phone: string | null };

export async function getClubAdmins(clubId: string): Promise<ClubAdmin[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, phone")
    .eq("club_id", clubId)
    .eq("role", "club_admin")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type SubscriptionHistoryEntry = {
  id: string;
  status: string;
  billing_period: string;
  amount_try: number | null;
  changed_at: string;
};

export async function getClubSubscriptionHistory(clubId: string): Promise<SubscriptionHistoryEntry[]> {
  const { data, error } = await supabase
    .from("club_subscription_history")
    .select("id, status, billing_period, amount_try, changed_at")
    .eq("club_id", clubId)
    .order("changed_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// "Kulübü Kalıcı Olarak Sil" — delete-club edge function'ını çağırır (bkz.
// supabase/functions/delete-club). confirmClubName tam eşleşmezse fonksiyon
// zaten reddediyor, burada ayrıca bir kontrol yapmıyoruz.
export async function deleteClub(clubId: string, confirmClubName: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Oturum bulunamadı, lütfen tekrar giriş yap.");

  const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-club`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ clubId, confirmClubName }),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.error || `İstek başarısız oldu (kod: ${response.status}).`);
}

// --- İçeriği Globale Yükselt --------------------------------------------

export const PROMOTABLE_TABLES = [
  { table: "fitness_exercises", label: "Fitness Hareketleri" },
  { table: "nutrition_foods", label: "Besinler" },
  { table: "nutrition_recipes", label: "Sporcu Tarifleri" },
  { table: "performance_test_catalog", label: "Performans Testleri" },
] as const;
export type PromotableTable = (typeof PROMOTABLE_TABLES)[number]["table"];

export type ClubContentItem = { id: string; name: string; club_id: string; club_name: string };

// 4 tablonun görünen ad kolonu aynı değil — nutrition_recipes'te "name" yok,
// "title" var (diğer 3 tabloda "name").
const NAME_COLUMN: Record<PromotableTable, string> = {
  fitness_exercises: "name",
  nutrition_foods: "name",
  nutrition_recipes: "title",
  performance_test_catalog: "name",
};

// Bir kulübün eklediği, henüz global olmayan (club_id dolu) içerikleri
// listeler — Süper Admin bunlardan birini seçip "Globale Yükselt"e basabilir.
export async function listClubSpecificContent(table: PromotableTable): Promise<ClubContentItem[]> {
  const nameColumn = NAME_COLUMN[table];
  const { data, error } = await supabase
    .from(table)
    .select(`id, ${nameColumn}, club_id, clubs!club_id(name)`)
    .not("club_id", "is", null)
    .order(nameColumn, { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r[nameColumn],
    club_id: r.club_id,
    club_name: r.clubs?.name ?? "—",
  }));
}

// promote-to-global edge function'ını çağırır (bkz.
// supabase/functions/promote-to-global) — RLS normal client'a bunu
// yaptırmıyor, servis-rol gerekiyor.
export async function promoteToGlobal(table: PromotableTable, id: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Oturum bulunamadı, lütfen tekrar giriş yap.");

  const response = await fetch(`${SUPABASE_URL}/functions/v1/promote-to-global`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ table, id }),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.error || `İstek başarısız oldu (kod: ${response.status}).`);
}

// --- Finansal Trend Raporu ------------------------------------------------

export type FinancialTrendMonth = { month: string; revenueTry: number; newClubs: number };

// Son 12 ay için: o ay "active" olan (onaylanan) abonelik tutarlarının
// toplamı + o ay katılan yeni kulüp sayısı. club_subscription_history
// bundan sonraki her durum değişikliğini kaydettiği için geçmiş veri bu
// tarihten itibaren birikecek — geriye dönük veri yok, bu beklenen.
export async function getFinancialTrend(): Promise<FinancialTrendMonth[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [historyResult, clubsResult] = await Promise.all([
    supabase
      .from("club_subscription_history")
      .select("amount_try, changed_at")
      .eq("status", "active")
      .gte("changed_at", since.toISOString()),
    supabase.from("clubs").select("created_at").gte("created_at", since.toISOString()),
  ]);
  if (historyResult.error) throw historyResult.error;
  if (clubsResult.error) throw clubsResult.error;

  const months: FinancialTrendMonth[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < 12; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    months.push({ month: key, revenueTry: 0, newClubs: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const byKey = new Map(months.map((m) => [m.month, m]));
  const keyOf = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  (historyResult.data ?? []).forEach((r) => {
    const m = byKey.get(keyOf(r.changed_at));
    if (m) m.revenueTry += r.amount_try ?? 0;
  });
  (clubsResult.data ?? []).forEach((c) => {
    const m = byKey.get(keyOf(c.created_at));
    if (m) m.newClubs += 1;
  });

  return months;
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
