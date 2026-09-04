-- Besinler ve Sporcu Tarifleri için kapsamlı, güvenilir kaynaklara dayanan
-- global içerik (club_id NULL) — her kulüp sıfırdan girmek zorunda kalmasın
-- diye. Besin değerleri 100g/100ml üzerinden, USDA FoodData Central ve
-- benzeri kabul görmüş referanslara dayanır (uygulamadaki mevcut örnek
-- placeholder'larla — Yulaf: 389 kcal/17g protein/66g karb/7g yağ — aynı
-- 100g kuru ağırlık kuralına uyuyor).

insert into public.nutrition_foods (club_id, category, name, description, found_in, calories, protein_g, carbs_g, fat_g, benefit, source) values
-- KARBONHİDRAT
(null, 'karbonhidrat', 'Yulaf', 'Beta-glukan lifi içeren, kan şekerini dengede tutan kompleks karbonhidrat kaynağı.', 'Yulaf ezmesi, granola, müsli', 389, 16.9, 66.3, 6.9, 'Antrenman öncesi yavaş salınımlı enerji sağlar, uzun süre tokluk hissi verir.', 'USDA FoodData Central'),
(null, 'karbonhidrat', 'Tam Buğday Ekmeği', 'Rafine edilmemiş tahıldan yapılan, lif ve B vitaminleri açısından zengin ekmek.', 'Fırın ürünleri', 247, 13, 41, 3.4, 'Beyaz ekmeğe göre kan şekerini daha yavaş yükseltir, sindirim sistemini destekler.', 'USDA FoodData Central'),
(null, 'karbonhidrat', 'Esmer Pirinç', 'Kabuğu soyulmamış, lif ve mineral değeri beyaz pirince göre yüksek tahıl.', 'Pirinç çeşitleri', 111, 2.6, 23, 0.9, 'Uzun süreli enerji ve doygunluk sağlar, sindirimi düzenler.', 'USDA FoodData Central'),
(null, 'karbonhidrat', 'Tatlı Patates', 'Beta-karoten ve kompleks karbonhidrat açısından zengin kök sebze.', 'Sebze reyonu', 86, 1.6, 20, 0.1, 'Antrenman öncesi enerji deposu, aynı zamanda A vitamini kaynağı.', 'USDA FoodData Central'),
(null, 'karbonhidrat', 'Muz', 'Hızlı sindirilen karbonhidrat ve potasyum kaynağı — sporcuların klasik atıştırmalığı.', 'Meyve reyonu', 89, 1.1, 23, 0.3, 'Antrenman öncesi/sırasında hızlı enerji, kramp riskini azaltan potasyum sağlar.', 'Harvard T.H. Chan School of Public Health, The Nutrition Source'),
(null, 'karbonhidrat', 'Kinoa', 'Tüm esansiyel amino asitleri içeren nadir bitkisel karbonhidrat kaynağı (pişmiş).', 'Tahıl/bakliyat reyonu', 120, 4.4, 21, 1.9, 'Hem karbonhidrat hem bitkisel protein sağlar, glutensizdir.', 'USDA FoodData Central'),
(null, 'karbonhidrat', 'Bal', 'Doğal, hızlı sindirilen basit şeker kaynağı.', 'Kahvaltılık reyonu', 304, 0.3, 82, 0, 'Müsabaka öncesi/sırasında hızlı enerji ihtiyacında pratik bir seçenek.', 'USDA FoodData Central'),
(null, 'karbonhidrat', 'Hurma', 'Doğal şeker, lif ve potasyum açısından zengin kurutulmuş meyve.', 'Kuruyemiş/kurutulmuş meyve reyonu', 277, 1.8, 75, 0.2, 'Antrenman öncesi hızlı enerji, sindirimi de destekleyen lif içerir.', 'USDA FoodData Central'),
(null, 'karbonhidrat', 'Tam Buğday Makarna', 'Rafine edilmemiş buğday unundan yapılan, lifi yüksek makarna (pişmiş).', 'Makarna reyonu', 124, 5.3, 25, 1.1, 'Müsabaka öncesi "karbonhidrat yükleme" için klasik, doyurucu bir seçenek.', 'USDA FoodData Central'),
(null, 'karbonhidrat', 'Patates', 'Haşlanmış haliyle yüksek potasyum içeren kolay sindirilen karbonhidrat kaynağı.', 'Sebze reyonu', 87, 1.9, 20, 0.1, 'Antrenman sonrası glikojen depolarının hızlı doldurulmasına yardımcı olur.', 'USDA FoodData Central'),
(null, 'karbonhidrat', 'Elma', 'Lif (pektin) ve doğal şeker içeren, pratik bir atıştırmalık meyve.', 'Meyve reyonu', 52, 0.3, 14, 0.2, 'Kan şekerini yavaş yükseltir, taşınabilir bir enerji kaynağıdır.', 'USDA FoodData Central'),
(null, 'karbonhidrat', 'Yaban Mersini', 'Antioksidan (antosiyanin) açısından zengin küçük meyve.', 'Meyve reyonu / dondurulmuş meyve', 57, 0.7, 14, 0.3, 'Antrenmanın yol açtığı oksidatif stresi azaltmaya yardımcı olabilir.', 'USDA FoodData Central'),
(null, 'karbonhidrat', 'Kuru Üzüm', 'Yoğunlaştırılmış doğal şeker ve demir içeren kurutulmuş meyve.', 'Kuruyemiş/kurutulmuş meyve reyonu', 299, 3.1, 79, 0.5, 'Kompakt, taşınabilir ve hızlı enerji veren bir antrenman atıştırmalığı.', 'USDA FoodData Central'),
(null, 'karbonhidrat', 'Kırmızı Mercimek', 'Karbonhidrat ve bitkisel protein dengesi sunan bakliyat (pişmiş).', 'Bakliyat reyonu', 116, 9, 20, 0.4, 'Hem enerji hem doku onarımı için protein sağlayan çok yönlü bir besin.', 'USDA FoodData Central'),
(null, 'karbonhidrat', 'Karpuz', 'Yüksek su içeriğiyle hem hidrasyon hem hızlı enerji sağlayan meyve.', 'Meyve reyonu', 30, 0.6, 8, 0.2, 'Sıcak havada antrenman sonrası sıvı ve enerji ihtiyacını birlikte karşılar.', 'USDA FoodData Central'),

-- PROTEİN
(null, 'protein', 'Tavuk Göğsü', 'Yağı düşük, biyoyararlanımı yüksek klasik hayvansal protein kaynağı (pişmiş, derisiz).', 'Et reyonu', 165, 31, 0, 3.6, 'Kas onarımı ve gelişimi için yüksek kaliteli, yağı düşük protein sağlar.', 'USDA FoodData Central'),
(null, 'protein', 'Yumurta', 'Tüm esansiyel amino asitleri içeren "tam protein" kaynağı (haşlanmış).', 'Süt/yumurta reyonu', 155, 13, 1.1, 11, 'Kas proteini sentezini destekleyen, ucuz ve pratik bir protein kaynağı.', 'USDA FoodData Central'),
(null, 'protein', 'Somon', 'Omega-3 yağ asitleri açısından da zengin yağlı balık (pişmiş).', 'Balık reyonu', 208, 20, 0, 13, 'Kas onarımının yanında iltihabı azaltan omega-3 sağlar.', 'USDA FoodData Central'),
(null, 'protein', 'Yağsız Dana Eti', 'Demir ve B12 açısından da zengin kırmızı et (pişmiş, az yağlı).', 'Et reyonu', 205, 27, 0, 10, 'Kas gelişimi ve oksijen taşınımı için gereken demiri birlikte sağlar.', 'USDA FoodData Central'),
(null, 'protein', 'Yunan Yoğurdu', 'Normal yoğurda göre süzülerek proteini yoğunlaştırılmış yoğurt türü (yağsız).', 'Süt ürünleri reyonu', 59, 10, 3.6, 0.4, 'Antrenman sonrası kolay sindirilen hızlı bir protein kaynağıdır.', 'USDA FoodData Central'),
(null, 'protein', 'Lor Peyniri (Süzme Peynir)', 'Yavaş sindirilen kazein proteini açısından zengin süt ürünü.', 'Süt ürünleri reyonu', 98, 11, 3.4, 4.3, 'Gece boyu kas onarımını desteklemesi için yatmadan önce iyi bir seçenektir.', 'USDA FoodData Central'),
(null, 'protein', 'Nohut', 'Protein ve lif dengesi sunan bitkisel bakliyat (pişmiş).', 'Bakliyat reyonu', 164, 9, 27, 2.6, 'Vejetaryen sporcular için hem protein hem enerji sağlayan çok yönlü besin.', 'USDA FoodData Central'),
(null, 'protein', 'Ton Balığı', 'Yağı düşük, proteini yüksek pratik konserve balık (suda, süzülmüş).', 'Konserve reyonu', 116, 26, 0, 1, 'Antrenman çantasında taşınabilecek, hazır bir yüksek protein kaynağı.', 'USDA FoodData Central'),
(null, 'protein', 'Süt', 'Hem hızlı hem yavaş sindirilen protein (whey+kazein) içeren doğal içecek (yarım yağlı).', 'Süt ürünleri reyonu', 50, 3.4, 5, 1.6, 'Karbonhidrat+protein dengesiyle antrenman sonrası toparlanmayı destekler.', 'Harvard T.H. Chan School of Public Health, The Nutrition Source'),
(null, 'protein', 'Hindi Göğsü', 'Yağı çok düşük, proteini yüksek beyaz et (pişmiş).', 'Et/şarküteri reyonu', 135, 30, 0, 1, 'Yağdan kaçınıp yüksek protein almak isteyen sporcular için ideal.', 'USDA FoodData Central'),
(null, 'protein', 'Tofu', 'Soya fasulyesinden üretilen bitkisel "tam protein" kaynağı.', 'Vegan/vejetaryen reyonu', 76, 8, 1.9, 4.8, 'Vejetaryen/vegan sporcular için önemli bir kas onarım kaynağıdır.', 'USDA FoodData Central'),
(null, 'protein', 'Beyaz Peynir (Light)', 'Az yağlı versiyonlarıyla protein/yağ dengesi daha iyi olan süt ürünü.', 'Süt ürünleri reyonu', 175, 20, 2, 9, 'Kalsiyum ve protein ihtiyacını bir arada karşılayan pratik bir seçenek.', 'USDA FoodData Central'),
(null, 'protein', 'Karides', 'Yağı çok düşük, proteini yüksek deniz ürünü (pişmiş).', 'Deniz ürünleri reyonu', 99, 24, 0.2, 0.3, 'Düşük kalorili, yüksek proteinli bir öğün seçeneği sunar.', 'USDA FoodData Central'),
(null, 'protein', 'Kuru Fasulye', 'Protein, lif ve kompleks karbonhidratı bir arada sunan bakliyat (pişmiş).', 'Bakliyat reyonu', 127, 8.7, 22.8, 0.5, 'Hem enerji hem kas onarımı için dengeli bir bitkisel kaynaktır.', 'USDA FoodData Central'),

-- YAĞ
(null, 'yag', 'Zeytinyağı', 'Tekli doymamış yağ asitleri açısından zengin, Akdeniz mutfağının temel yağı.', 'Yağ reyonu', 884, 0, 0, 100, 'Kalp sağlığını destekler, yağda çözünen A/D/E/K vitaminlerinin emilimine yardımcı olur.', 'Harvard T.H. Chan School of Public Health, The Nutrition Source'),
(null, 'yag', 'Avokado', 'Tekli doymamış yağ ve potasyum açısından zengin meyve.', 'Sebze/meyve reyonu', 160, 2, 8.5, 15, 'Doymuş yağ oranı düşük, uzun süreli enerji ve tokluk hissi sağlar.', 'USDA FoodData Central'),
(null, 'yag', 'Ceviz', 'Bitkisel omega-3 (ALA) açısından zengin kuruyemiş.', 'Kuruyemiş reyonu', 654, 15, 14, 65, 'İltihabı azaltmaya yardımcı omega-3 ve antioksidan sağlar.', 'USDA FoodData Central'),
(null, 'yag', 'Badem', 'E vitamini ve sağlıklı yağ açısından zengin kuruyemiş.', 'Kuruyemiş reyonu', 579, 21, 22, 50, 'Antioksidan E vitamini ile hücreleri antrenman stresine karşı korumaya yardımcı olur.', 'USDA FoodData Central'),
(null, 'yag', 'Chia Tohumu', 'Yüksek lif ve omega-3 içeren küçük tohum.', 'Kuruyemiş/tohum reyonu', 486, 17, 42, 31, 'Suyla şişerek uzun süreli tokluk verir, sindirimi destekleyen lif sağlar.', 'USDA FoodData Central'),
(null, 'yag', 'Keten Tohumu', 'Bitkisel omega-3 ve lignan açısından zengin tohum.', 'Kuruyemiş/tohum reyonu', 534, 18, 29, 42, 'Hormon dengesi ve kalp sağlığını destekleyen bitkisel omega-3 kaynağıdır.', 'USDA FoodData Central'),
(null, 'yag', 'Uskumru', 'Omega-3 açısından en zengin balıklardan biri (pişmiş).', 'Balık reyonu', 262, 24, 0, 18, 'Antrenmanın yol açtığı iltihabı azaltmaya yardımcı yüksek omega-3 içerir.', 'USDA FoodData Central'),
(null, 'yag', 'Fıstık Ezmesi', 'Yer fıstığından üretilen, protein ve sağlıklı yağ dengesi sunan ezme.', 'Kahvaltılık reyonu', 588, 25, 20, 50, 'Enerji yoğun, taşınabilir ve hem yağ hem protein sağlayan pratik bir kaynak.', 'USDA FoodData Central'),
(null, 'yag', 'Zeytin', 'Tekli doymamış yağ içeren, geleneksel Akdeniz atıştırmalığı.', 'Turşu/konserve reyonu', 115, 0.8, 6, 11, 'Sağlıklı yağ ve az miktarda antioksidan polifenol sağlar.', 'USDA FoodData Central'),
(null, 'yag', 'Kaju', 'Magnezyum açısından zengin, kremamsı dokulu kuruyemiş.', 'Kuruyemiş reyonu', 553, 18, 30, 44, 'Kas fonksiyonu için önemli magnezyumu sağlayan enerji yoğun bir atıştırmalık.', 'USDA FoodData Central'),
(null, 'yag', 'Yer Fıstığı', 'Protein ve yağ açısından zengin, ekonomik bir kuruyemiş.', 'Kuruyemiş reyonu', 567, 26, 16, 49, 'Hem yağ hem protein ihtiyacını karşılayan doyurucu bir atıştırmalık.', 'USDA FoodData Central'),
(null, 'yag', 'Tahin', 'Susamdan üretilen, kalsiyum açısından da zengin bir ezme.', 'Kahvaltılık reyonu', 595, 17, 21, 54, 'Kemik sağlığı için kalsiyum ile birlikte enerji yoğun yağ sağlar.', 'USDA FoodData Central'),
(null, 'yag', 'Susam', 'Kalsiyum ve sağlıklı yağ içeren küçük tohum.', 'Baharat/tohum reyonu', 573, 18, 23, 50, 'Salatalara/yoğurda eklenerek kolayca sağlıklı yağ takviyesi sağlar.', 'USDA FoodData Central'),
(null, 'yag', 'Fındık', 'E vitamini ve tekli doymamış yağ açısından zengin kuruyemiş.', 'Kuruyemiş reyonu', 628, 15, 17, 61, 'Kalp sağlığını destekleyen yağ profiliyle enerji yoğun bir atıştırmalıktır.', 'USDA FoodData Central'),

-- VİTAMİN
(null, 'vitamin', 'Portakal', 'Yüksek C vitamini içeren klasik turunçgil.', 'Meyve reyonu', 47, 0.9, 12, 0.1, 'Bağışıklık sistemini destekler, demirin bitkisel kaynaklardan emilimini artırır.', 'NIH Office of Dietary Supplements'),
(null, 'vitamin', 'Kırmızı Biber', 'Portakaldan bile daha fazla C vitamini içeren sebze.', 'Sebze reyonu', 31, 1, 6, 0.3, 'Yüksek C vitamini ile bağışıklığı ve doku onarımını destekler.', 'NIH Office of Dietary Supplements'),
(null, 'vitamin', 'Ispanak', 'A, K, folat ve demir açısından zengin yeşil yapraklı sebze.', 'Sebze reyonu', 23, 2.9, 3.6, 0.4, 'Kemik sağlığı (K vitamini) ve oksijen taşınımı (demir) için önemlidir.', 'NIH Office of Dietary Supplements'),
(null, 'vitamin', 'Havuç', 'Beta-karoten (A vitamini öncülü) açısından zengin kök sebze.', 'Sebze reyonu', 41, 0.9, 10, 0.2, 'Göz sağlığı ve bağışıklık sistemi için A vitamini sağlar.', 'NIH Office of Dietary Supplements'),
(null, 'vitamin', 'Brokoli', 'C ve K vitamini açısından zengin, lifli bir sebze.', 'Sebze reyonu', 34, 2.8, 7, 0.4, 'Bağışıklık ve kemik sağlığını destekleyen çift vitamin kaynağıdır.', 'NIH Office of Dietary Supplements'),
(null, 'vitamin', 'Kivi', 'Portakaldan daha yoğun C vitamini içeren meyve.', 'Meyve reyonu', 61, 1.1, 15, 0.5, 'Yoğun C vitamini ile bağışıklık sistemini ve doku onarımını destekler.', 'NIH Office of Dietary Supplements'),
(null, 'vitamin', 'Çilek', 'C vitamini ve antioksidan açısından zengin kırmızı meyve.', 'Meyve reyonu', 32, 0.7, 8, 0.3, 'Antioksidanlarıyla antrenman sonrası hücresel stresi azaltmaya yardımcı olur.', 'NIH Office of Dietary Supplements'),
(null, 'vitamin', 'Karnabahar', 'C ve K vitamini içeren, lifi yüksek sebze.', 'Sebze reyonu', 25, 1.9, 5, 0.3, 'Düşük kalorili şekilde bağışıklık ve kemik sağlığına katkı sağlar.', 'NIH Office of Dietary Supplements'),
(null, 'vitamin', 'Mantar', 'Güneşe maruz bırakılanları D vitamini açısından zengin olan az sayıda bitkisel besinden biri.', 'Sebze reyonu', 22, 3.1, 3.3, 0.3, 'Bitkisel kaynaklardan D vitamini almanın nadir yollarından biridir.', 'NIH Office of Dietary Supplements'),
(null, 'vitamin', 'Yumurta Sarısı', 'D, A ve B12 vitaminlerinin doğal olarak bulunduğu az sayıda besinden biri.', 'Süt/yumurta reyonu', 322, 16, 3.6, 27, 'D vitamini kemik ve kas fonksiyonu için, B12 enerji üretimi için gereklidir.', 'NIH Office of Dietary Supplements'),
(null, 'vitamin', 'Sardalya', 'D vitamini ve omega-3 açısından zengin küçük yağlı balık (konserve, yağıyla).', 'Konserve reyonu', 208, 25, 0, 11, 'Kemik sağlığı için D vitamini, iltihap kontrolü için omega-3 sağlar.', 'NIH Office of Dietary Supplements'),
(null, 'vitamin', 'Ayçiçek Tohumu', 'E vitamini açısından en zengin besinlerden biri.', 'Kuruyemiş/tohum reyonu', 584, 21, 20, 51, 'Antioksidan E vitamini ile hücreleri oksidatif strese karşı korur.', 'NIH Office of Dietary Supplements'),
(null, 'vitamin', 'Limon', 'Yüksek C vitamini içeren, yemeklere kolayca eklenebilen turunçgil.', 'Meyve reyonu', 29, 1.1, 9, 0.3, 'Az miktarda tüketimle bile günlük C vitamini ihtiyacına katkı sağlar.', 'NIH Office of Dietary Supplements'),
(null, 'vitamin', 'Papaya', 'C ve A vitamini açısından zengin tropikal meyve.', 'Meyve reyonu', 43, 0.5, 11, 0.3, 'Bağışıklık sistemi ve göz sağlığını birlikte destekler.', 'NIH Office of Dietary Supplements'),
(null, 'vitamin', 'Mango', 'A ve C vitamini açısından zengin, tatlı tropikal meyve.', 'Meyve reyonu', 60, 0.8, 15, 0.4, 'Bağışıklık sistemini destekleyen doğal bir tatlı atıştırmalıktır.', 'NIH Office of Dietary Supplements');

insert into public.nutrition_recipes (club_id, category, title, description, ingredients, instructions, source) values
(null, 'karbonhidrat', 'Ev Yapımı İzotonik Sporcu İçeceği', 'Satın alınan sporcu içeceklerine ucuz ve doğal bir alternatif — sıvı ve elektrolit kaybını karşılar.',
 '1 litre su
400-600 ml meyve suyu (portakal ya da üzüm)
1/2 çay kaşığı tuz
2 yemek kaşığı bal (isteğe bağlı, tatlandırmak için)
Yarım limonun suyu',
 '1. Meyve suyunu 1 litrelik bir şişeye ya da sürahiye koy.
2. Tuzu ve balı ekleyip iyice çözünene kadar karıştır.
3. Limon suyunu ekle, kalan suyla 1 litreye tamamla.
4. Antrenman/müsabaka öncesi ve sırasında soğuk olarak tüket.',
 'Karbonhidrat oranı (%6-8) ve sodyum miktarı, sporcu içeceği formülasyonlarına ilişkin genel spor beslenimi kılavuzlarına (ör. ACSM sıvı değişimi pozisyon bildirgesi) dayanır.'),

(null, 'karbonhidrat', 'Hurmalı Yulaf Enerji Barı', 'Fırın gerektirmeyen, antrenman öncesi/sırasında hızlı enerji veren pratik bir bar.',
 '200 g hurma (çekirdeği çıkarılmış)
100 g yulaf ezmesi
2 yemek kaşığı fıstık ezmesi
1 tutam tuz',
 '1. Hurmaları 15-20 dakika ılık suda bekletip suyunu süz.
2. Hurmaları mutfak robotunda pürüzsüz bir hamur kıvamına getir.
3. Yulaf, fıstık ezmesi ve tuzu ekleyip karıştır.
4. Yağlı kâğıt kaplı bir kalıba bastır, buzdolabında en az 2 saat dinlendir.
5. Dilimleyip antrenman çantasında taşı.',
 'Tarif, sporcu enerji barı tariflerinde yaygın kullanılan hurma+yulaf+kuruyemiş temel formülüne dayanır.'),

(null, 'protein', 'Proteinli Kakaolu Enerji Topları', 'Antrenman sonrası ya da öğün arası için pratik, fırınsız bir protein atıştırmalığı.',
 '150 g hurma (çekirdeği çıkarılmış)
50 g badem
30 g yulaf ezmesi
20 g protein tozu (whey ya da bitkisel)
1 yemek kaşığı kakao
1 tatlı kaşığı hindistan cevizi yağı',
 '1. Hurmaları robotta pürüzsüz hale getir.
2. Bademleri ekleyip kısa aralıklarla çekerek kabaca ufala.
3. Yulaf, protein tozu, kakao ve hindistan cevizi yağını ekleyip karıştır.
4. Karışımdan küçük toplar şekillendir.
5. Buzdolabında en az 1 saat dinlendirip servis et.',
 'Hurma+kuruyemiş+protein tozu temel formülü, yaygın sporcu enerji topu tariflerine dayanır.'),

(null, 'protein', 'Muzlu Antrenman Sonrası Smoothie', 'Antrenmandan sonraki ilk 30-60 dakikada tüketilmesi önerilen, karbonhidrat+protein dengesi sunan bir içecek.',
 '1 muz
250 ml süt (ya da badem sütü)
1 yemek kaşığı yoğurt
1 ölçek protein tozu
Bir avuç yaban mersini',
 '1. Tüm malzemeleri blendera koy.
2. Pürüzsüz kıvam alana kadar karıştır.
3. Antrenmandan hemen sonra soğuk olarak iç.',
 'Antrenman sonrası karbonhidrat+protein birlikteliğinin toparlanmayı desteklediği spor beslenimi kaynaklarına dayanır.'),

(null, 'protein', 'Yoğurtlu Granola Kâsesi', 'Yüksek proteinli, hazırlaması 5 dakika süren pratik bir kahvaltı/atıştırmalık.',
 '200 g Yunan yoğurdu
3 yemek kaşığı granola
1 tatlı kaşığı bal
Mevsim meyvesi (çilek, muz vb.)',
 '1. Yoğurdu bir kâseye al.
2. Üzerine granola ve doğranmış meyveyi ekle.
3. Balı gezdirip servis et.',
 'Yunan yoğurdunun yüksek protein içeriğine dayanan klasik bir sporcu kahvaltısı formülüdür.'),

(null, 'yag', 'Fındık-Fıstık Enerji Barı', 'Sağlıklı yağ ve enerji yoğunluğu yüksek, uzun antrenmanlar öncesi için doyurucu bir bar.',
 '150 g hurma
50 g ceviz
50 g badem
2 yemek kaşığı fıstık ezmesi
1 tutam tuz',
 '1. Hurmaları robotta pürüzsüz hale getir.
2. Ceviz ve bademi ekleyip kısa aralıklarla çekerek kabaca ufala.
3. Fıstık ezmesi ve tuzu ekleyip karıştır.
4. Kalıba bastırıp buzdolabında 2 saat dinlendir, dilimle.',
 'Kuruyemiş+hurma temel formülü, sporcu enerji barı tariflerinde yaygın kullanılan bir yapıdır.'),

(null, 'yag', 'Avokadolu Tam Tahıllı Tost', 'Sağlıklı yağ ve kompleks karbonhidratı bir arada sunan doyurucu bir öğün.',
 '2 dilim tam buğday ekmeği
1 adet olgun avokado
Yarım limonun suyu
Tuz, karabiber
1 adet haşlanmış yumurta (isteğe bağlı)',
 '1. Avokadoyu bir kâsede ezerek limon suyu, tuz ve karabiberle karıştır.
2. Ekmek dilimlerini kızart.
3. Üzerine avokado karışımını yay.
4. İstersen dilimlenmiş haşlanmış yumurta ile üzerini tamamla.',
 'Tekli doymamış yağ açısından zengin avokadonun tam tahılla birlikteliği yaygın bir sporcu beslenmesi önerisidir.'),

(null, 'vitamin', 'Vitamin Bombası Yeşil Smoothie', 'A, C ve K vitaminlerini bir araya getiren, hazırlaması 5 dakika süren bir içecek.',
 '1 avuç taze ıspanak
1 adet elma
1 adet muz
150 ml taze sıkılmış portakal suyu
Küçük bir parça taze zencefil (isteğe bağlı)',
 '1. Tüm malzemeleri blendera koy.
2. Pürüzsüz kıvam alana kadar karıştır.
3. Hemen servis et.',
 'Yeşil yapraklı sebze + turunçgil birlikteliği, yaygın vitamin-yoğun smoothie tariflerine dayanır.'),

(null, 'vitamin', 'Kırmızı Meyve Antioksidan Kâsesi', 'C vitamini ve antioksidanlar açısından zengin, antrenman sonrası toparlanmayı destekleyen bir atıştırmalık.',
 '1 avuç çilek
1 avuç yaban mersini
1 adet kivi
Yarım portakal (dilimlenmiş)
1 tatlı kaşığı bal',
 '1. Tüm meyveleri yıka ve doğra.
2. Bir kâsede birleştir.
3. Üzerine balı gezdirip servis et.',
 'Kırmızı/mor meyvelerin yüksek antioksidan içeriği geniş kabul gören bir beslenme bilimi bulgusudur.');
