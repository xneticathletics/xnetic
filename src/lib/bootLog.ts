// TEŞHİS AMAÇLI GEÇİCİ ARAÇ: açılışta bazı gerçek cihazlarda uygulamanın
// süresiz siyah ekranda takılı kalma sebebini bulmak için — her önemli
// açılış adımını burada işaretleyip ekranda (BootLogOverlay) gösteriyoruz.
// Sorun kesin olarak çözülüp doğrulanınca bu dosya ve kullanıldığı yerler
// kaldırılacak, kalıcı bir ürün özelliği DEĞİL.
type Listener = (steps: string[]) => void;

const steps: string[] = [];
const listeners = new Set<Listener>();

export function logBoot(step: string) {
  steps.push(step);
  listeners.forEach((l) => l(steps));
}

export function subscribeBoot(listener: Listener): () => void {
  listeners.add(listener);
  listener(steps);
  return () => listeners.delete(listener);
}
