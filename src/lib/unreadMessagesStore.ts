import { getTotalUnreadMessageCount } from "./api/messages";

// Alt menüdeki "Mesajlar" rozetini, mesajlar okunduğunda/yeni mesaj
// geldiğinde her ekranın kendi state'inden bağımsız olarak güncel
// tutmak için basit bir pub-sub deposu.
type Listener = (count: number) => void;

let count = 0;
const listeners = new Set<Listener>();

export function getCachedUnreadMessagesCount() {
  return count;
}

export function subscribeUnreadMessages(listener: Listener): () => void {
  listeners.add(listener);
  listener(count);
  return () => listeners.delete(listener);
}

export async function refreshUnreadMessagesCount() {
  try {
    const next = await getTotalUnreadMessageCount();
    count = next;
    listeners.forEach((l) => l(next));
  } catch {
    // sessizce yut — rozet kritik bir özellik değil
  }
}
