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
