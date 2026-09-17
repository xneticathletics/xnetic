import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

// ImagePicker'ın allowsEditing:true (native kırpma ekranı) seçeneği, iOS'un
// kendi UIImagePickerController'ında bazı fotoğraflarda (iCloud'da henüz
// cihaza inmemiş orijinaller, HEIC, çok yüksek çözünürlüklü kareler) SESSİZCE
// başarısız oluyor — kırpma ekranı hiç açılmadan seçim "canceled" dönüyor,
// kullanıcı hiçbir hata görmeden eski fotoğrafta kalıyor (Expo'nun kendi
// dokümantasyonunda da belirtilen bilinen bir iOS kısıtlaması). Bu yüzden
// TÜM fotoğraf seçim ekranlarında (kulüp logosu, sporcu/antrenör/profil
// fotoğrafı) artık allowsEditing HİÇ kullanılmıyor — seçim her zaman ham
// haliyle alınıp kareye kırpma burada, seçimden SONRA kendimiz yapılıyor;
// bu adım bir görsel dosyası üzerinde çalıştığı için asla sessizce
// başarısız olmuyor.
export async function cropToSquare(uri: string, width: number, height: number): Promise<string> {
  const size = Math.min(width, height);
  const originX = Math.round((width - size) / 2);
  const originY = Math.round((height - size) / 2);
  const context = ImageManipulator.manipulate(uri).crop({ originX, originY, width: size, height: size });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
  return result.uri;
}
