import { supabase } from "../supabase";
import { sendNotification } from "./notifications";

export type ScheduleTemplate = {
  id: string;
  group_id: string;
  day_of_week: number; // 0=Pzt..6=Paz (TrainingSessionsScreen'deki WEEKDAY_LABELS ile aynı kural)
  start_time: string;
  end_time: string;
  venue_id: string | null;
  active: boolean;
  groups?: { name: string } | null;
  venues?: { name: string } | null;
};

export type ScheduleTemplateInput = {
  group_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  venue_id: string | null;
};

const TEMPLATE_FIELDS = "id, group_id, day_of_week, start_time, end_time, venue_id, active, groups(name), venues(name)";

// Kaç hafta ilerisi için antrenman kaydı hazır bulunsun (aidattaki
// MONTHS_AHEAD'in haftalık karşılığı).
const WEEKS_AHEAD = 4;

export async function listTemplatesForGroups(groupIds: string[]): Promise<ScheduleTemplate[]> {
  if (groupIds.length === 0) return [];
  const { data, error } = await supabase
    .from("training_schedule_templates")
    .select(TEMPLATE_FIELDS)
    .in("group_id", groupIds)
    .order("day_of_week", { ascending: true });
  if (error) throw error;
  return (data as unknown as ScheduleTemplate[]) ?? [];
}

export async function createTemplate(input: ScheduleTemplateInput): Promise<ScheduleTemplate> {
  const { data, error } = await supabase
    .from("training_schedule_templates")
    .insert(input)
    .select(TEMPLATE_FIELDS)
    .single();
  if (error) throw error;
  return data as unknown as ScheduleTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from("training_schedule_templates").delete().eq("id", id);
  if (error) throw error;
}

export async function setTemplateActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("training_schedule_templates").update({ active }).eq("id", id);
  if (error) throw error;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// Bugünden itibaren önümüzdeki weeksAhead hafta içinde, verilen gün
// (0=Pzt..6=Paz) hangi takvim tarihlerine denk geliyor — yerel tarih
// parçalarından elle kuruluyor (paymentPlans.ts'teki aynı UTC-kayması
// uyarısıyla: toISOString() burada KULLANILMIYOR).
function generateDatesForDayOfWeek(dayOfWeek: number, weeksAhead: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < weeksAhead * 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const ourDay = (d.getDay() + 6) % 7; // JS: 0=Paz..6=Cmt → 0=Pzt..6=Paz
    if (ourDay === dayOfWeek) dates.push(toDateKey(d));
  }
  return dates;
}

export type GenerateScheduleResult = {
  created: number;
  skippedConflict: { groupName: string; venueName: string; date: string; time: string }[];
};

// payment_plans → payments üretim mantığının antrenman karşılığı: aktif
// şablonlardan önümüzdeki WEEKS_AHEAD haftanın gerçek training_sessions
// kayıtlarını üretir. Üretmeden ÖNCE hedef aralıktaki TÜM mevcut
// antrenmanları TEK sorguda çekip (N+1'i önleme — bkz. topUpAllActivePlans)
// hangi slotların (a) zaten bizim tarafımızdan üretilmiş (idempotent,
// sessizce atla) hangilerinin (b) BAŞKA bir grup tarafından dolu
// (çakışma, atla + raporla) olduğunu ayırt eder.
export async function generateSessionsFromTemplates(groupIds?: string[]): Promise<GenerateScheduleResult> {
  let query = supabase.from("training_schedule_templates").select(TEMPLATE_FIELDS).eq("active", true);
  if (groupIds && groupIds.length > 0) query = query.in("group_id", groupIds);
  const { data: templatesData, error: templatesError } = await query;
  if (templatesError) throw templatesError;
  const templates = (templatesData as unknown as ScheduleTemplate[]) ?? [];
  if (templates.length === 0) return { created: 0, skippedConflict: [] };

  type Candidate = {
    group_id: string; venue_id: string | null; session_date: string; start_time: string; end_time: string;
    groupName: string; venueName: string;
  };
  const candidates: Candidate[] = [];
  for (const t of templates) {
    for (const date of generateDatesForDayOfWeek(t.day_of_week, WEEKS_AHEAD)) {
      candidates.push({
        group_id: t.group_id, venue_id: t.venue_id, session_date: date,
        start_time: t.start_time, end_time: t.end_time,
        groupName: t.groups?.name ?? "Grup", venueName: t.venues?.name ?? "Salon atanmadı",
      });
    }
  }
  if (candidates.length === 0) return { created: 0, skippedConflict: [] };

  const dates = candidates.map((c) => c.session_date);
  const minDate = dates.reduce((a, b) => (b < a ? b : a));
  const maxDate = dates.reduce((a, b) => (b > a ? b : a));
  const { data: existing, error: existingError } = await supabase
    .from("training_sessions")
    .select("group_id, venue_id, session_date, start_time")
    .gte("session_date", minDate)
    .lte("session_date", maxDate);
  if (existingError) throw existingError;

  const existingBySlot = new Map<string, string>(); // "venue|date|time" -> group_id
  (existing ?? []).forEach((s) => {
    if (!s.venue_id) return;
    existingBySlot.set(`${s.venue_id}|${s.session_date}|${s.start_time}`, s.group_id);
  });

  const toInsert: Candidate[] = [];
  const skippedConflict: GenerateScheduleResult["skippedConflict"] = [];

  for (const c of candidates) {
    const occupiedBy = c.venue_id ? existingBySlot.get(`${c.venue_id}|${c.session_date}|${c.start_time}`) : undefined;
    if (occupiedBy === undefined) {
      toInsert.push(c);
    } else if (occupiedBy !== c.group_id) {
      skippedConflict.push({ groupName: c.groupName, venueName: c.venueName, date: c.session_date, time: c.start_time.slice(0, 5) });
    }
    // occupiedBy === c.group_id: önceki bir üretimden zaten var — sessizce atla.
  }

  if (toInsert.length === 0) return { created: 0, skippedConflict };

  // uq_venue_slot KISMİ (partial) bir unique index — "WHERE venue_id IS NOT
  // NULL" — supabase-js'in upsert(onConflict:...) seçeneği kısmi index'lerin
  // WHERE koşulunu ifade edemiyor (ON CONFLICT hedefi eşleşmiyor hatası
  // verir), bu yüzden toplu upsert yerine TEK TEK insert edip gerçek bir
  // yarış durumundan doğan 23505'i (yukarıdaki ön-kontrol yakalayamadıysa)
  // normal bir çakışma gibi ele alıyoruz.
  const affectedGroupIds = new Set<string>();
  let createdCount = 0;
  for (const c of toInsert) {
    const { error: insertError } = await supabase.from("training_sessions").insert({
      group_id: c.group_id, venue_id: c.venue_id, session_date: c.session_date,
      start_time: c.start_time, end_time: c.end_time,
    });
    if (insertError) {
      if ((insertError as { code?: string }).code === "23505") {
        skippedConflict.push({ groupName: c.groupName, venueName: c.venueName, date: c.session_date, time: c.start_time.slice(0, 5) });
        continue;
      }
      throw insertError;
    }
    createdCount++;
    affectedGroupIds.add(c.group_id);
  }

  if (createdCount > 0) await notifyScheduleUpdated(Array.from(affectedGroupIds));

  return { created: createdCount, skippedConflict };
}

// Her üretilen antrenman için AYRI bildirim göndermek (potansiyel olarak
// haftalarca kayıt için) spam olur — bunun yerine etkilenen gruplara TEK
// bir toplu "program güncellendi" bildirimi gider.
async function notifyScheduleUpdated(groupIds: string[]): Promise<void> {
  try {
    if (groupIds.length === 0) return;
    const [groupsResult, assistantResult, athletesResult] = await Promise.all([
      supabase.from("groups").select("head_coach_id").in("id", groupIds),
      supabase.from("group_coaches").select("coach_id").in("group_id", groupIds),
      supabase.from("athletes").select("parent_user_id, athlete_user_id").in("group_id", groupIds).eq("status", "active"),
    ]);
    const recipients = new Set<string>();
    (groupsResult.data ?? []).forEach((g) => { if (g.head_coach_id) recipients.add(g.head_coach_id); });
    (assistantResult.data ?? []).forEach((r) => recipients.add(r.coach_id));
    (athletesResult.data ?? []).forEach((a) => {
      if (a.parent_user_id) recipients.add(a.parent_user_id);
      if (a.athlete_user_id) recipients.add(a.athlete_user_id);
    });
    if (recipients.size === 0) return;

    const title = "📅 Haftalık Program Güncellendi";
    const body = "Antrenman programın güncellendi — Takvim'den kontrol edebilirsin.";
    await Promise.all(Array.from(recipients).map((id) => sendNotification(id, title, body, "training_session").catch(() => {})));
  } catch {
    // Bildirim gönderimi program üretimini asla bloklamamalı.
  }
}
