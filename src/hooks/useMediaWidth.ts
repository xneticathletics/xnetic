import { useWindowDimensions } from "react-native";

// Etkinlik banner'ı, ürün fotoğrafı, sosyal medya görseli gibi "ekran
// genişliği kadar" boyutlandırılan medyalar telefonda güzel dururken
// tablette (özellikle artık serbest bıraktığımız yatay modda) ekranın
// çoğunu kaplayıp altındaki içeriği aşağı itiyordu. En büyük telefonlar
// bile ~430pt genişliği geçmediği için bu üst sınır telefonda hiçbir şeyi
// değiştirmiyor, sadece tablet genişliklerinde devreye giriyor.
const MAX_MEDIA_WIDTH = 480;

export function useMediaWidth(): number {
  const { width } = useWindowDimensions();
  return Math.min(width, MAX_MEDIA_WIDTH);
}
