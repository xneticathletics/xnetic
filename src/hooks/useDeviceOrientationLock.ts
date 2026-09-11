import { useEffect } from "react";
import * as Device from "expo-device";
import * as ScreenOrientation from "expo-screen-orientation";

// Uygulama native tarafta artık TÜM yönlere izin veriyor (app.json:
// orientation: "default") — telefonun eskisi gibi sadece dikey kalması
// (hiçbir arayüz tablet dışında yatay için tasarlanmadı) hâlâ isteniyor,
// sadece TABLETTE serbest dönüşe izin veriyoruz (masaüstü/resepsiyon
// kullanımında yatay tutmak çok yaygın). Bu yüzden kilidi artık native
// manifest yerine burada, çalışma zamanında cihaz tipine göre koyuyoruz.
export function useDeviceOrientationLock() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const type = await Device.getDeviceTypeAsync().catch(() => Device.DeviceType.UNKNOWN);
      if (cancelled) return;
      if (type === Device.DeviceType.TABLET) {
        await ScreenOrientation.unlockAsync().catch(() => {});
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
