import type { UserRole } from "../context/AuthContext";

export type NotificationTarget = {
  tab: "Ana Menü" | "Profil" | "Sosyal" | "Mağaza" | "Etkinlik";
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
    case "payment_claim": {
      const athleteId = payload?.athleteId as string | undefined;
      const athleteName = payload?.athleteName as string | undefined;
      return athleteId
        ? { tab: "Ana Menü", screen: "AthletePayments", params: { athleteId, athleteName: athleteName ?? "Sporcu" } }
        : { tab: "Ana Menü", screen: "PaymentsList", params: { filter: "pending" } };
    }
    case "payment_reminder":
      return { tab: "Ana Menü", screen: "MyPayments" };
    case "absence":
    case "consecutive_absence":
      return { tab: "Ana Menü", screen: isPlanner ? "TodayAttendance" : "MyAttendance" };
    case "match_scheduled":
    case "match_result": {
      // Maç bildirimine dokununca ilgili maça gidiyor (sonuç ekranı hem
      // maçı görüntülemeye hem sonuç girmeye/düzenlemeye yarıyor) — sadece
      // antrenör/admin için, çünkü MatchResult ekranı onlara özel. Payload'da
      // matchId yoksa (eski bir bildirim) eskisi gibi genel listeye düşer.
      const matchId = payload?.matchId as string | undefined;
      if (isPlanner && matchId) return { tab: "Ana Menü", screen: "MatchResult", params: { matchId } };
      return { tab: "Ana Menü", screen: isPlanner ? "TrainingSessions" : "MySchedule" };
    }
    case "training_session":
    case "session_excuse": {
      // Antrenman/mazeret bildirimine dokununca (antrenör/admin için) o
      // antrenmanın yoklama listesine gidiyor — SessionRoster hem sporcu
      // listesini hem mazeretleri gösteriyor. Payload eksikse (eski bir
      // bildirim ya da veli/sporcu tarafı) eskisi gibi genel listeye düşer.
      const sessionId = payload?.sessionId as string | undefined;
      const groupId = payload?.groupId as string | undefined;
      const groupName = payload?.groupName as string | undefined;
      if (isPlanner && sessionId && groupId) {
        return { tab: "Ana Menü", screen: "SessionRoster", params: { sessionId, groupId, groupName: groupName ?? "" } };
      }
      return { tab: "Ana Menü", screen: isPlanner ? "TrainingSessions" : "MySchedule" };
    }
    case "session_rpe": {
      // Antrenman bitişinde giden "zorluk derecesini değerlendir"
      // bildirimi — doğrudan o antrenmanın sporcu detayına gidiyor, çünkü
      // değerlendirme penceresi kısa (varsayılan 60 dk).
      const sessionId = payload?.sessionId as string | undefined;
      const athleteId = payload?.athleteId as string | undefined;
      const athleteName = payload?.athleteName as string | undefined;
      if (sessionId && athleteId) {
        return { tab: "Ana Menü", screen: "MySessionDetail", params: { sessionId, athleteId, athleteName: athleteName ?? "" } };
      }
      return { tab: "Ana Menü", screen: "MySchedule" };
    }
    case "wellness_reminder":
      return { tab: "Ana Menü", screen: "WellnessCheckin" };
    case "fitness_program": {
      // "Fitness" ekranı sadece antrenör/admin'in Ana Sayfa'sında var (bkz.
      // HomeScreen.tsx TILES_BY_ROLE) — veli/sporcu buraya gönderilirse
      // hiç erişemeyecekleri bir yönetim ekranına düşerdi.
      if (isPlanner) return { tab: "Ana Menü", screen: "Fitness" };
      // Veli/sporcu için payload'da programId + athleteId varsa (bkz.
      // fitnessPrograms.ts notifyProgramPublished) doğrudan programın
      // kendisine gidiyor — önceden bu bilgi taşınmadığı için her zaman
      // "Sporcum" listesine düşüyordu. Eski bir bildirimde (payload'sız)
      // ya da athlete_id çözülemediyse yine o listeye düşülür.
      const programId = payload?.programId as string | undefined;
      const athleteId = payload?.athleteId as string | undefined;
      const athleteName = payload?.athleteName as string | undefined;
      if (programId && athleteId) {
        // Bireysel program AYRI bir tabloda (individual_fitness_programs) ve
        // ayrı bir detay ekranında — payload'daki individual bayrağı olmadan
        // grup programı ekranına gidip boş/hatalı açılırdı.
        const screen = payload?.individual === true ? "IndividualFitnessProgramDetail" : "FitnessProgramDetail";
        return { tab: "Ana Menü", screen, params: { programId, athleteId, athleteName: athleteName ?? "" } };
      }
      return { tab: "Ana Menü", screen: "MyAthleteList" };
    }
    case "membership_freeze": {
      const athleteId = payload?.athleteId as string | undefined;
      return athleteId ? { tab: "Ana Menü", screen: "AthleteDetail", params: { athleteId } } : null;
    }
    case "subscription_alert":
      // Yeni kulüp ödemesi / abonelik süresi doldu / yenileme ödemesi
      // bildirdi — hepsi süper admini "Abonelikler"e yönlendirir. club_admin
      // için henüz ayrı bir "aboneliğim" ekranı yok (durum kötüyse zaten
      // tam ekran bir kapı gösteriliyor, aktifken gidilecek bir yer yok).
      return role === "super_admin" ? { tab: "Ana Menü", screen: "SuperAdminSubscriptions" } : null;
    case "event_published":
    case "event_reminder": {
      const eventId = payload?.eventId as string | undefined;
      return eventId ? { tab: "Etkinlik", screen: "EventDetail", params: { eventId } } : null;
    }
    case "event_registration_submitted": {
      const eventId = payload?.eventId as string | undefined;
      if (!isPlanner || !eventId) return null;
      return { tab: "Etkinlik", screen: "EventRegistrations", params: { eventId } };
    }
    case "event_registration_approved":
    case "event_registration_rejected":
    case "event_cancelled": {
      // Bu üç gönderim noktası da payload'a eventId koyuyor (bkz.
      // src/lib/api/events.ts) ama bu case onu hep görmezden gelip
      // doğrudan genel listeye düşürüyordu — kişi hangi etkinlikten
      // bahsedildiğini kendi aramak zorunda kalıyordu. Artık varsa
      // doğrudan o etkinliğe gidiyor.
      const eventId = payload?.eventId as string | undefined;
      return eventId
        ? { tab: "Etkinlik", screen: "EventDetail", params: { eventId } }
        : { tab: "Etkinlik", screen: "MyEventRegistrations" };
    }
    case "social_post_submitted":
      return isPlanner ? { tab: "Sosyal", screen: "SocialFeed", params: { initialTab: "pending" } } : null;
    case "content_report":
      return isPlanner ? { tab: "Profil", screen: "ContentReports" } : null;
    case "social_post_approved":
      return { tab: "Sosyal", screen: "SocialFeed" };
    case "shop_order":
      // Artık sunucu tarafında (create_shop_order / update_shop_order_status
      // RPC'leri) gönderiliyor: yeni sipariş yöneticiye + ilgili branş
      // koordinatörüne, onay/teslim bilgisi siparişi veren veliye gider.
      // Yönetici ve koordinatör (antrenör) sipariş yönetimine, veli kendi
      // siparişlerine yönlenir.
      if (role === "parent") return { tab: "Mağaza", screen: "MyShopOrders" };
      return isPlanner ? { tab: "Mağaza", screen: "ShopOrders" } : null;
    case "password_reset_request":
      // Şifresini unutan kişinin talebi (bkz. request-password-reset-notice).
      // Yönetici, Kullanıcılar ekranında bekleyen talepleri üstte görüp
      // "Şifreyi Sıfırla" ile geçici şifre üretiyor. Kulüp yöneticisinin
      // KENDİ talebi süper admine gidiyor; o da Kulüpler ekranından ilgili
      // kulübü açıp yöneticinin şifresini sıfırlıyor.
      if (role === "super_admin") return { tab: "Ana Menü", screen: "SuperAdminClubs" };
      return role === "club_admin"
        ? { tab: "Profil", screen: "ClubSettings", params: { screen: "UsersList" } }
        : null;
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
