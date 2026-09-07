import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useAuth } from "../context/AuthContext";
import { getNotificationTarget } from "../lib/notificationNavigation";
import { navigateFromRoot } from "../navigation/navigationRef";

// Görsel bir şey render etmez — sadece push bildirimine DOKUNULDUĞUNDA
// (uygulama arka planda ya da tamamen kapalıyken) ilgili ekrana
// yönlendirmeyi tetikler. Uygulama içi zil listesindeki dokunuş
// NotificationBell.tsx'te ayrıca ele alınıyor (orada doğrudan bir
// navigation prop'u var) — ikisi de aynı getNotificationTarget haritasını
// paylaşır.
export default function NotificationResponseHandler() {
  const { role } = useAuth();
  const roleRef = useRef(role);
  roleRef.current = role;
  const consumedColdStart = useRef(false);

  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const currentRole = roleRef.current;
      if (!currentRole) return;
      const data = response.notification.request.content.data as
        | { eventType?: string; payload?: Record<string, unknown> }
        | undefined;
      if (!data?.eventType) return;
      const target = getNotificationTarget(data.eventType, data.payload ?? null, currentRole);
      if (target) navigateFromRoot(target);
    };

    // Uygulama TAMAMEN kapalıyken bir bildirime dokunulup açıldığında,
    // bu "soğuk başlangıç" yanıtı addNotificationResponseReceivedListener
    // yerine burada gelir. Sadece uygulama ömründe BİR KEZ kontrol
    // ediyoruz — yoksa role her değiştiğinde (ör. şifre değişimi sonrası
    // oturum tazelenince) aynı eski yanıt tekrar tekrar işlenip
    // kullanıcıyı beklenmedik bir anda başka bir ekrana atardı.
    if (!consumedColdStart.current) {
      consumedColdStart.current = true;
      Notifications.getLastNotificationResponseAsync()
        .then((response) => { if (response) handleResponse(response); })
        .catch(() => {});
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, []);

  return null;
}
