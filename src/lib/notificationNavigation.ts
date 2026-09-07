import type { UserRole } from "../context/AuthContext";

export type NotificationTarget = {
  tab: "Ana Menü" | "Profil";
  screen: string;
  params?: Record<string, unknown>;
};

const PLANNER_ROLES: UserRole[] = ["coach", "club_admin"];

// Bir bildirimin event_type + payload'ından, dokununca gidilmesi gereken
// ekranı hesaplar. Aynı event_type birden çok role gidebildiği için
// (ör. antrenman bildirimi hem antrenöre hem veliye) hedef, bildirimin
// KENDİSİNDEN değil, dokunan kişinin O ANKİ rolünden belirlenir — bu
// sayede her rol kendi ekranına gider. NotificationBell (uygulama içi
// zil listesi) VE push bildirimi dokunuşu (bkz. src/lib/push.ts) aynı
// bu fonksiyonu kullanır, iki yerde ayrı ayrı bakım gerekmesin diye.
export function getNotificationTarget(
  eventType: string | null,
  payload: Record<string, unknown> | null,
  role: UserRole
): NotificationTarget | null {
  const isPlanner = PLANNER_ROLES.includes(role);

  switch (eventType) {
    case "payment_claim":
      return { tab: "Ana Menü", screen: "PaymentsList", params: { filter: "pending" } };
    case "payment_reminder":
      return { tab: "Ana Menü", screen: "MyPayments" };
    case "absence":
    case "consecutive_absence":
      return { tab: "Ana Menü", screen: isPlanner ? "TodayAttendance" : "MyAttendance" };
    case "training_session":
    case "match_scheduled":
    case "match_result":
    case "session_excuse":
      return { tab: "Ana Menü", screen: isPlanner ? "TrainingSessions" : "MySchedule" };
    case "fitness_program":
      return { tab: "Ana Menü", screen: "Fitness" };
    case "membership_freeze": {
      const athleteId = payload?.athleteId as string | undefined;
      return athleteId ? { tab: "Ana Menü", screen: "AthleteDetail", params: { athleteId } } : null;
    }
    case "announcement": {
      const announcementId = payload?.announcementId as string | undefined;
      return announcementId
        ? { tab: "Profil", screen: "AnnouncementDetail", params: { announcementId } }
        : { tab: "Profil", screen: "Announcements" };
    }
    default:
      return null;
  }
}
