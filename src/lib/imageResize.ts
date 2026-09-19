import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

// Telefondan seçilen fotoğraflar birkaç MB olabiliyor; bucket'ların dosya
// boyutu sınırı küçük (ör. etkinlik banner'ı 2 MB) ve "The object exceeded
// the maximum allowed size" hatasıyla yükleme reddediliyordu. Yüklemeden
// önce genişliği en fazla maxWidth'e küçültüp JPEG'e çeviriyoruz (zaten
// daha küçükse büyütülmüyor).
export async function resizeImageToMaxWidth(uri: string, maxWidth: number, compress: number): Promise<string> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const context = ImageManipulator.manipulate(uri);
  const target = original.width > maxWidth ? context.resize({ width: maxWidth, height: null }) : context;
  const rendered = await target.renderAsync();
  const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress });
  return result.uri;
}
