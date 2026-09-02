import { colors } from "../theme/tokens";

export type PerformanceTest = {
  key: string;
  name: string;
  unit: string;
  equipment?: string;
  instructions: string;
  // Test videosu daha sonra eklenecek — şimdilik boş, ileride bir video
  // kaynağı (URL) atanınca detay ekranındaki video simgesi otomatik
  // aktif olacak.
  videoUrl?: string;
};

export type PerformanceCategory = {
  key: string;
  label: string;
  icon: string;
  color: string;
  soft: string;
  tests: PerformanceTest[];
};

// Sahada en yaygın kullanılan testler, kategori kategori, kolaydan zora
// sıralı. Sabit bir katalog — kulüpler arası ortak, admin tarafından
// düzenlenmiyor (Beslenme'nin aksine).
export const PERFORMANCE_CATEGORIES: PerformanceCategory[] = [
  {
    key: "antropometrik",
    label: "Antropometrik",
    icon: "📏",
    color: colors.yellow,
    soft: colors.yellowSoft,
    tests: [
      {
        key: "height", name: "Boy", unit: "cm",
        instructions: "Sporcu ayakkabısız, sırtı ve topukları duvara/stadiometreye değecek şekilde dik durur. Baş, göz-kulak hizası yere paralel olacak şekilde (Frankfort düzlemi) tutulur ve en yüksek nokta okunur.",
      },
      {
        key: "weight", name: "Kilo", unit: "kg",
        instructions: "Sporcu hafif kıyafetle, ayakkabısız ve mümkünse aç karnına, kalibre edilmiş bir baskülde tartılır.",
      },
      {
        key: "bmi", name: "BKİ (Vücut Kitle İndeksi)", unit: "kg/m²",
        instructions: "Ayrı bir ölçüm yapılmaz — boy ve kilo ölçümlerinden kilo(kg) / boy(m)² formülüyle otomatik hesaplanır.",
      },
      {
        key: "sitting_height", name: "Oturarak Boy (PHV için)", unit: "cm",
        instructions: "Sporcu düz bir sırada, kalça ve dizler 90°, sırtı dik oturur. Stadiometre ile oturma yüzeyinden baş tepe noktasına kadar mesafe ölçülür — PHV (zirve boy uzama yaşı) hesaplamasında kullanılır.",
      },
      {
        key: "body_fat", name: "Vücut Yağ Oranı", unit: "%", equipment: "Kaliper / bioelektrik cihaz gerekir",
        instructions: "Kaliper ile standart cilt kıvrımı noktalarından (ör. triceps, subskapular, suprailiak) ölçüm alınır ya da bioelektrik impedans (BIA) cihazı kullanılır.",
      },
      {
        key: "phv", name: "Zirve Boy Uzama Yaşı (PHV)", unit: "yaş", equipment: "Türetilmiş hesaplama",
        instructions: "Doğrudan ölçülmez — boy, oturarak boy, kilo ve kronolojik yaş verileri Mirwald formülüne girilerek hesaplanan türetilmiş bir değerdir.",
      },
    ],
  },
  {
    key: "surat",
    label: "Sürat",
    icon: "🏃",
    color: colors.coral,
    soft: colors.coralSoft,
    tests: [
      {
        key: "sprint_10m", name: "10m Sürat (Kalkış Hızı)", unit: "sn",
        instructions: "Sporcu start çizgisinde durur ve komutla patlayıcı çıkış yapar. 10m'deki bitiş noktasına ulaşana kadar geçen süre kronometre/fotosel ile ölçülür — kalkış hızını gösterir.",
      },
      {
        key: "sprint_20m", name: "20m Sürat", unit: "sn",
        instructions: "Aynı duran start pozisyonundan çıkılır, 20m'lik mesafeyi kat etme süresi ölçülür.",
      },
      {
        key: "sprint_30m", name: "30m Sürat", unit: "sn",
        instructions: "Duran start pozisyonundan çıkılır, 30m'lik mesafeyi kat etme süresi ölçülür.",
      },
      {
        key: "sprint_40m", name: "40m Sürat", unit: "sn",
        instructions: "Duran start pozisyonundan çıkılır, 40m'lik mesafeyi kat etme süresi ölçülür.",
      },
      {
        key: "flying_sprint", name: "Flying Sprint (20m, uçan start)", unit: "sn",
        instructions: "Sporcu 10-20m'lik bir hazırlık koşusuyla önceden hızlanır ve tam hızda ölçüm bölgesine girer; böylece ivmelenme değil, saf maksimum sürat ölçülür.",
      },
    ],
  },
  {
    key: "ceviklik",
    label: "Çeviklik",
    icon: "🔄",
    color: colors.teal,
    soft: colors.tealSoft,
    tests: [
      {
        key: "t_test", name: "T-Testi", unit: "sn",
        instructions: "Koniler T şeklinde dizilir (orta çizgi 9.14m, yan koniler ortadan 4.57m). Sporcu ortadan öne sprint atar, sağa yan kayarak koniye dokunur, sola yan kayarak karşı koniye dokunur, tekrar ortaya yan kayar, sonunda geri geri koşarak başlangıca döner. Toplam süre ölçülür.",
      },
      {
        key: "pro_agility", name: "5-10-5 Pro Agility Shuttle", unit: "sn",
        instructions: "3 koni 5 yarda arayla düz bir çizgide dizilir. Sporcu ortadan başlar, bir yöne 5 yarda koşup çizgiye dokunur, ters yöne 10 yarda koşup diğer çizgiye dokunur, son olarak 5 yarda koşarak başlangıç noktasından geçer.",
      },
      {
        key: "illinois", name: "Illinois Çeviklik Testi", unit: "sn",
        instructions: "10x5m'lik alanda, standart Illinois koni dizilimiyle (başta/sonda düz koşu, ortada 4 koni ile slalom) parkur koşulur; toplam süre ölçülür.",
      },
      {
        key: "test_505", name: "505 Agility Test", unit: "sn",
        instructions: "Sporcu 15m'lik bir yaklaşım koşusuyla hız kazanır, 5m'lik dönüş noktasına ulaşıp 180° döner ve 5m geri koşar; yalnızca bu 10m'lik dönüş segmentinin süresi ölçülür.",
      },
      {
        key: "zigzag", name: "Zigzag Testi", unit: "sn",
        instructions: "Koniler çapraz açılarla 4-5 segment oluşturacak şekilde dizilir. Sporcu segmentler arasında yön değiştirerek zikzak çizip parkuru en hızlı şekilde tamamlar.",
      },
    ],
  },
  {
    key: "sicrama",
    label: "Sıçrama / Patlayıcı Kuvvet",
    icon: "💥",
    color: colors.yellow,
    soft: colors.yellowSoft,
    tests: [
      {
        key: "vertical_jump", name: "Dikey Sıçrama (Sargent Jump)", unit: "cm",
        instructions: "Sporcu duvara yakın durup kolunu tam uzatarak ulaşabildiği en yüksek noktayı işaretler. Ardından yardımsız (kol sallayarak) dikey sıçrayıp en yüksek noktaya tekrar dokunur. İki işaret arasındaki fark ölçülür.",
      },
      {
        key: "squat_jump", name: "Squat Jump (SJ)", unit: "cm",
        instructions: "Sporcu diz açısı yaklaşık 90° olacak şekilde çömelik pozisyonda 2-3 saniye sabit bekler (karşı hareket olmadan), ardından doğrudan yukarı maksimum sıçrama yapar.",
      },
      {
        key: "cmj", name: "Countermovement Jump (CMJ)", unit: "cm",
        instructions: "Sporcu ayakta dururken hızlıca çömelme (karşı hareket) yapıp, hemen ardından duraksamadan maksimum yükseklikte dikey sıçrar.",
      },
      {
        key: "broad_jump", name: "Broad Jump (Uzun Atlama)", unit: "cm",
        instructions: "Sporcu çizginin gerisinde iki ayağı bitişik durur ve iki ayakla birden öne doğru maksimum mesafeye sıçrar. Çizgiden en yakın iniş noktasına (topuk) kadar olan mesafe ölçülür.",
      },
      {
        key: "drop_jump", name: "Reaktif Sıçrama (Drop Jump / RSI)", unit: "RSI", equipment: "Sıçrama platformu gerekir",
        instructions: "Sporcu belirli yükseklikteki bir kutudan aşağı iner, yere değer değmez mümkün olan en kısa temas süresiyle maksimum yükseklikte tekrar sıçrar. Temas süresi ve sıçrama yüksekliğinden Reaktif Kuvvet İndeksi (RSI) hesaplanır.",
      },
    ],
  },
  {
    key: "kuvvet",
    label: "Kuvvet",
    icon: "💪",
    color: colors.violet,
    soft: `${colors.violet}22`,
    tests: [
      {
        key: "pushup", name: "Şınav Testi (1 dk, max tekrar)", unit: "tekrar",
        instructions: "1 dakika içinde, dirsekler tam açılıp göğüs neredeyse yere değecek şekilde doğru formda yapılabilen maksimum şınav tekrarı sayılır.",
      },
      {
        key: "situp", name: "Mekik Testi (1 dk, max tekrar)", unit: "tekrar",
        instructions: "Sporcu sırt üstü yatar, dizler bükülü, ayaklar sabitlenir. 1 dakika içinde doğru formda yapılabilen maksimum mekik tekrarı sayılır.",
      },
      {
        key: "grip_strength", name: "El Kavrama Kuvveti", unit: "kg", equipment: "Dinamometre gerekir",
        instructions: "Sporcu el dinamometresini kolunu yana sarkıtarak maksimum güçle sıkar. Her el için 2-3 deneme yapılır ve en iyi/ortalama değer kaydedilir.",
      },
      {
        key: "one_rm", name: "Squat / Bench Press 1RM", unit: "kg", equipment: "Ekipman + gözetim gerekir",
        instructions: "Isınma sonrası ağırlık kademeli olarak artırılarak sporcunun tek tekrarda doğru formda kaldırabildiği maksimum ağırlık belirlenir. Mutlaka gözetim/spot altında yapılmalıdır.",
      },
      {
        key: "med_ball_throw", name: "Medicine Ball Throw", unit: "m",
        instructions: "Sporcu sabit bir çizginin gerisinde durur ve sağlık topunu göğüs önünden (chest pass) iki elle maksimum kuvvetle öne fırlatır. Topun düştüğü noktaya kadar olan mesafe ölçülür.",
      },
    ],
  },
  {
    key: "dayaniklilik",
    label: "Dayanıklılık",
    icon: "🫁",
    color: colors.coral,
    soft: colors.coralSoft,
    tests: [
      {
        key: "cooper", name: "Cooper Testi (12 dk Koşu Mesafesi)", unit: "m",
        instructions: "Sporcu 12 dakika boyunca düzenli bir pist üzerinde mümkün olan en uzun mesafeyi koşmaya/yürümeye çalışır. Süre sonunda kat edilen toplam mesafe metre cinsinden kaydedilir.",
      },
      {
        key: "yoyo", name: "Yo-Yo Intermittent Recovery Test", unit: "seviye",
        instructions: "Sesli sinyallere göre giderek hızlanan 20m gidiş-dönüş koşuları arasında kısa aktif dinlenme (5-10m yürüyüş) yapılır. Sporcu art arda iki kez sinyale yetişemediğinde test biter, ulaşılan son seviye kaydedilir.",
      },
      {
        key: "beep_test", name: "Beep Test (20m Shuttle Run / PACER)", unit: "seviye",
        instructions: "20m aralıkla konulan iki çizgi arasında, giderek hızlanan sesli sinyallere uyarak gidiş-dönüş koşusu yapılır. Sporcunun art arda iki sinyale yetişemediği an test biter, ulaştığı son seviye/shuttle kaydedilir.",
      },
      {
        key: "vo2max", name: "VO2 Max", unit: "ml/kg/dk", equipment: "Laboratuvar / maske gerekir",
        instructions: "En doğru sonuç, laboratuvar ortamında maske takılarak egzersiz sırasında oksijen tüketiminin ölçülmesiyle elde edilir. Saha ortamında Cooper testi veya beep test sonuçlarından tahmini formüllerle de hesaplanabilir.",
      },
    ],
  },
  {
    key: "esneklik",
    label: "Esneklik",
    icon: "🤸",
    color: colors.teal,
    soft: colors.tealSoft,
    tests: [
      {
        key: "sit_reach", name: "Otur-Uzan Testi (Sit and Reach)", unit: "cm",
        instructions: "Sporcu bacaklar düz uzatılmış, ayak tabanları ölçüm kutusuna dayalı şekilde yerde oturur. Dizleri kırmadan, elleriyle öne doğru maksimum uzanır; ulaşılan mesafe cm cinsinden okunur.",
      },
      {
        key: "shoulder_flex", name: "Omuz Esneklik Testi", unit: "cm",
        instructions: "Sporcu bir elini omuz üzerinden aşağıya, diğer elini bel arkasından yukarıya uzatarak sırtında iki eli birbirine yaklaştırmaya/birleştirmeye çalışır. İki el arasındaki açıklık (veya örtüşme) cm cinsinden ölçülür; her iki taraf için ayrı ayrı yapılır.",
      },
      {
        key: "hip_gonio", name: "Kalça Fleksiyon / Ekstansiyon", unit: "derece", equipment: "Gonyometre gerekir",
        instructions: "Sporcu sırt üstü/yan yatar, gonyometre standart anatomik referans noktalarına (kalça ekleminin dönüş merkezi hizasına) yerleştirilerek kalçanın maksimum fleksiyon ve ekstansiyon açıları ölçülür.",
      },
    ],
  },
];

export function getPerformanceCategory(key: string): PerformanceCategory | undefined {
  return PERFORMANCE_CATEGORIES.find((c) => c.key === key);
}

export function getPerformanceTest(testKey: string): { test: PerformanceTest; category: PerformanceCategory } | undefined {
  for (const category of PERFORMANCE_CATEGORIES) {
    const test = category.tests.find((t) => t.key === testKey);
    if (test) return { test, category };
  }
  return undefined;
}
