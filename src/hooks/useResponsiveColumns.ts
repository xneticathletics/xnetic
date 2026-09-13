import { useWindowDimensions } from "react-native";

// Sporcu/Antrenör/Mağaza/Aidat-grup listeleri telefonda hep sabit bir
// numColumns kullanıyordu — tablette (özellikle yatay dönüşe artık izin
// verdiğimiz için) bu, kartların gereksiz genişleyip aradaki alanın boş
// kalmasına yol açıyordu. Material Design'ın genişlik sınıfı eşikleriyle
// (compact <600, medium 600-839, expanded >=840) aynı kırılma noktalarını
// kullanıyoruz — telefon genişliğinde (<600) davranış birebir eskisiyle
// aynı kalıyor, sadece tablet genişliklerinde kolon sayısı artıyor.
export function useResponsiveColumns(baseColumns: number): number {
  const { width } = useWindowDimensions();
  if (width >= 840) return baseColumns * 2;
  if (width >= 600) return Math.round(baseColumns * 1.5);
  return baseColumns;
}

// FlatList'in numColumns'lı ızgaralarında son satırda numColumns'dan az
// öğe kalırsa, kartların `flex: 1` olması yüzünden o satırdaki tek/eksik
// kart tüm satır genişliğine uzuyor (diğer satırlardaki kartlarla aynı
// genişlikte kalmıyor). Son satırı görünmez "doldurucu" hücrelerle
// numColumns'a tamamlayarak gerçek kartların hep eşit genişlikte kalmasını
// sağlıyoruz — renderItem tarafında null gelen öğeler opacity:0 boş bir
// View olarak çizilmeli.
export function fillGridRow<T>(data: readonly T[], columns: number): (T | null)[] {
  if (columns <= 1) return [...data];
  const remainder = data.length % columns;
  if (data.length === 0 || remainder === 0) return [...data];
  return [...data, ...(Array(columns - remainder).fill(null) as null[])];
}
