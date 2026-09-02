import { Platform } from "react-native";
import * as Calendar from "expo-calendar";
import type { TrainingSession } from "./api/trainingSessions";
import type { MatchRow } from "./api/matches";

const CALENDAR_NAME = "X-NETIC";

// Antrenman/müsabaka programını telefonun KENDİ takvim uygulamasına
// yazıyoruz — her senkronizasyonda kendi oluşturduğumuz takvimdeki
// etkinlikleri silip yeniden yazıyoruz (diff tutmaya gerek kalmadan,
// "yeniden senkronize et" her zaman güncel hâli garanti eder). Sadece
// kendi ("X-NETIC" adlı) takvimimize dokunuyoruz — kullanıcının diğer
// takvimlerine/etkinliklerine hiç dokunulmuyor.
export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === "granted";
}

async function getOrCreateClubCalendarId(): Promise<string> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existing = calendars.find((c) => c.title === CALENDAR_NAME);
  if (existing) return existing.id;

  let source: Calendar.Source;
  if (Platform.OS === "ios") {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    source = defaultCalendar.source;
  } else {
    source = { isLocalAccount: true, name: CALENDAR_NAME, type: Calendar.SourceType.LOCAL } as Calendar.Source;
  }

  return Calendar.createCalendarAsync({
    title: CALENDAR_NAME,
    color: "#FFC845",
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: Platform.OS === "ios" ? source.id : undefined,
    source,
    name: CALENDAR_NAME,
    ownerAccount: CALENDAR_NAME,
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

function combineDateTime(date: string, time: string): Date {
  // "SS:DD" ya da "SS:DD:SS" gelebilir, ikisini de kabul ediyoruz.
  const [h, m] = time.split(":");
  const d = new Date(`${date}T00:00:00`);
  d.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
  return d;
}

// iOS/Android'in takvim API'si bitiş anının başlangıçtan KESİNLİKLE sonra
// olmasını şart koşuyor ("the start date must be before the end date") —
// bitiş saati boş/hatalı girilmiş ya da başlangıçla aynı/erken olan bir
// antrenman kaydı olursa native tarafta hata fırlatıp SENKRONUN TAMAMINI
// durduruyordu. Burada en az 1 dakikaya zorlayarak bunu kökten engelliyoruz.
function ensureAfter(start: Date, end: Date): Date {
  return end.getTime() > start.getTime() ? end : new Date(start.getTime() + 60 * 1000);
}

export type SyncInput = {
  sessions?: TrainingSession[];
  matches?: MatchRow[];
};

// Verilen antrenman/müsabaka listesini cihazın takvimine yazar. Önce
// takvimdeki eski X-NETIC etkinliklerini temizler, sonra hepsini baştan
// ekler — böylece iptal edilen/değişen bir antrenman da doğru yansır.
// Tek bir kaydın (ör. bozuk saat verisi) native tarafta hata vermesi TÜM
// senkronu durdurmasın diye her etkinlik ayrı ayrı try/catch'le ekleniyor.
export async function syncScheduleToDeviceCalendar(input: SyncInput): Promise<{ count: number; skipped: number }> {
  const granted = await requestCalendarPermission();
  if (!granted) throw new Error("Takvim erişim izni verilmedi.");

  const calendarId = await getOrCreateClubCalendarId();

  const existingEvents = await Calendar.getEventsAsync(
    [calendarId],
    new Date(Date.now() - 1000 * 60 * 60 * 24 * 365),
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
  );
  await Promise.all(existingEvents.map((e) => Calendar.deleteEventAsync(e.id).catch(() => {})));

  let count = 0;
  let skipped = 0;

  for (const s of input.sessions ?? []) {
    if (s.status === "cancelled") continue;
    try {
      const start = combineDateTime(s.session_date, s.start_time);
      const end = ensureAfter(start, combineDateTime(s.session_date, s.end_time));
      await Calendar.createEventAsync(calendarId, {
        title: `Antrenman — ${s.groups?.name ?? "Grup"}`,
        startDate: start,
        endDate: end,
        location: s.venues?.name ?? undefined,
        notes: s.topic ?? undefined,
      });
      count++;
    } catch {
      skipped++;
    }
  }

  for (const m of input.matches ?? []) {
    try {
      const start = combineDateTime(m.match_date, m.start_time);
      const end = new Date(start.getTime() + 90 * 60 * 1000); // maç süresi bilinmiyor, 90 dk varsayılan
      await Calendar.createEventAsync(calendarId, {
        title: `🏆 Müsabaka — ${m.groups?.name ?? "Grup"}${m.opponent_name ? ` vs. ${m.opponent_name}` : ""}`,
        startDate: start,
        endDate: end,
        location: m.location ?? undefined,
      });
      count++;
    } catch {
      skipped++;
    }
  }

  return { count, skipped };
}
