-- Beslenme Rehberi yazıları artık, besinler/tarifler gibi, "global" (club_id
-- NULL) satırlar da taşıyabiliyor: tüm kulüpler okur, sadece süper admin
-- ekler/düzenler/siler. Kulübe özel yazılar (club_id dolu) aynen çalışmaya
-- devam ediyor. Aşağıda çocuk/genç sporcu beslenmesiyle ilgili, kaynaklı
-- global yazılar ekleniyor.
alter table public.nutrition_articles alter column club_id drop not null;

drop policy if exists nutrition_articles_select on public.nutrition_articles;
create policy nutrition_articles_select on public.nutrition_articles for select
  using (club_id is null or club_id = current_club_id() or is_super_admin());

drop policy if exists nutrition_articles_global_insert on public.nutrition_articles;
create policy nutrition_articles_global_insert on public.nutrition_articles for insert
  with check (club_id is null and is_super_admin());

drop policy if exists nutrition_articles_global_update on public.nutrition_articles;
create policy nutrition_articles_global_update on public.nutrition_articles for update
  using (club_id is null and is_super_admin())
  with check (club_id is null and is_super_admin());

insert into public.nutrition_articles (club_id, category, title, body, source) values
(null, 'musabaka_gunu', 'Müsabaka ve Turnuva Günü: Ne, Ne Zaman Yenir?',
$b$Müsabaka günü amaç, yeni bir şey denemek değil; antrenmanda alıştığın ve karnını rahatsız etmeyen yiyeceklerle enerji depolarını doldurmaktır.

Maçtan önce
• Maça 3-4 saat kala karbonhidrat ağırlıklı, yağı ve lifi düşük bir öğün ye: makarna, pilav, ekmek, yulaf, muz, düşük yağlı yoğurt gibi.
• Karbonhidratlar mideden protein ve yağa göre daha hızlı boşalır; bu yüzden ana öğünün çoğunu karbonhidrat oluşturmalı.
• Sabah erken maçın varsa tam öğün yerine karbonhidratlı hafif bir atıştırmalık (muz, tost, yulaf) seç.

Turnuvada maçlar arası
• Sonraki maça 2 saatten az varsa: kolay sindirilen karbonhidratlı atıştırmalık (muz, kuru meyve, galeta, bal-ekmek) ve az miktarda protein.
• 2 saatten fazla varsa: yeni bir ön maç öğünü gibi daha dengeli ye.
• Her fırsatta su iç; bol yağlı, kızarmış ve çok baharatlı yiyeceklerden uzak dur.

Maçtan sonra
• Son maçtan sonra karbonhidrat ve proteini birlikte içeren bir öğün al (ör. tavuklu pilav, yoğurtlu meyve, süt ve sandviç). Bir derlemede toparlanma için maçtan sonra 4-6 saat boyunca her 2 saatte bir kilo başına yaklaşık 1,0-1,2 g karbonhidrat öneriliyor.
• 60 dakikayı aşan uzun etkinliklerde saatte 30-60 g karbonhidrat (ör. muz, kuru meyve) enerji düşüşünü azaltmaya yardımcı olabilir.

Unutma: Bu yazı genel bilgidir; bireysel ihtiyaçların (yaş, kilo, branş, alerji) için diyetisyen veya spor hekimine danış.$b$,
'Optimizing Performance Nutrition for Adolescent Athletes (Nutrients, 2025): https://www.mdpi.com/2072-6643/17/17/2792 — Johns Hopkins Medicine, Nutrition for Athletes: What to Eat Before a Competition: https://www.hopkinsmedicine.org/health/expert-qa/nutrition-for-athletes-what-to-eat-before-a-competition — Alabama Cooperative Extension, Eat to Compete: https://www.aces.edu/blog/topics/home-family/eat-to-compete-sports-nutrition-for-young-adults-eating-before-between-athletic-events/'),

(null, 'genc_beslenme_temeli', 'Genç Sporcunun Beslenme Temeli',
$b$Genç sporcu aynı anda hem büyür hem antrenman yapar; bu yüzden vücudu yetişkin sporcudan daha fazla düzenli enerjiye ihtiyaç duyar. Yetersiz beslenme sadece performansı değil, büyümeyi ve gelişimi de etkiler.

Temel ilkeler
• Öğünleri atlama: gün içinde 3 ana öğün ve 2-3 ara öğün, enerji seviyesini dengede tutar.
• Karbonhidrat ana yakıttır: tam tahıllı ekmek, pilav, makarna, bulgur, yulaf, patates, meyve. Derlemelerde antrenman yüküne göre günde kilo başına yaklaşık 6-10 g karbonhidrat belirtiliyor.
• Protein her öğüne yayılmalı: yumurta, süt-yoğurt, peynir, tavuk, balık, kırmızı et, baklagiller.
• Sağlıklı yağlar: zeytinyağı, ceviz-fındık, avokado, balık.
• Her gün sebze ve meyve: vitamin, mineral ve lif kaynağıdır.

Enerji yetmiyor olabilir mi?
Antrenman yükü arttığında ihtiyaç da artar. Sürekli yorgunluk, performans düşüşü, sık hastalanma veya iştahsızlık varsa öğünlerin yeterli olup olmadığına bir uzmanla bakmak gerekir.

Her çocuğun ihtiyacı yaşa, kiloya, branşa ve antrenman yüküne göre farklıdır; kişiye özel plan için diyetisyene veya spor hekimine danış.$b$,
'Optimizing Performance Nutrition for Adolescent Athletes (Nutrients, 2025): https://www.mdpi.com/2072-6643/17/17/2792 — Nutritional Recommendations for the Young Athlete (JPOSNA): https://jposna.org/index.php/jposna/article/view/599/702 — T.C. Sağlık Bakanlığı, Türkiye Beslenme Rehberi (TÜBER): https://dosyasb.saglik.gov.tr/Eklenti/10915,tuber-turkiye-beslenme-rehberipdf.pdf'),

(null, 'protein', 'Protein: Ne Kadar Yeterli?',
$b$Kas gelişimi ve toparlanma için protein önemlidir; ancak genç sporcuların çoğu ihtiyacını normal beslenmeyle zaten karşılar.

Ne kadar?
• Genç sporcular için derlemelerde günlük yaklaşık 1,4-2,0 g/kg protein aralığı veriliyor. Örneğin 50 kg bir sporcu için günde 70-100 g.
• Bir seferde çok yüklenmek yerine öğünlere yaymak daha mantıklı: öğün başına yaklaşık 0,25-0,30 g/kg (20-40 g civarı) ve yaklaşık 3-4 saat arayla.
• Çok yüksek miktarlar (ör. 2,5 g/kg üzeri) ek fayda sağlamıyor.

Nereden?
Yumurta, süt, yoğurt, ayran, peynir, tavuk, hindi, balık, kırmızı et, mercimek, nohut, kuru fasulye. Örnek 20-25 g protein: 3 yumurta, 1 küçük tavuk göğsü porsiyonu veya 2 su bardağı süt + 1 kase yoğurt.

Protein tozu gerekli mi?
Genç sporcular için önerilmez: ihtiyaç genellikle yiyecekle karşılanır ve toz ürünlerin içeriği her zaman güvenilir olmayabilir. Önce yiyecek, gerekirse mutlaka doktor/diyetisyen kontrolünde.

Böbrek veya başka bir sağlık sorunu olan çocuklarda miktarı hekim belirlemelidir.$b$,
'Optimizing Performance Nutrition for Adolescent Athletes (Nutrients, 2025): https://www.mdpi.com/2072-6643/17/17/2792 — Nutritional Recommendations for the Young Athlete (JPOSNA): https://jposna.org/index.php/jposna/article/view/599/702'),

(null, 'su_sivi', 'Su ve Sıvı Dengesi',
$b$Terleyerek kaybedilen sıvı, dikkat ve performansı düşürür; çocuklar ve gençler sıcakta dehidrasyona daha hassas olabilir. Susamayı beklemeden içmek gerekir.

Günlük ihtiyaç
Genç sporcular için derlemelerde antrenman dışı temel ihtiyaç günde yaklaşık 2,0-2,4 litre olarak veriliyor; antrenman ve sıcakla artar.

Antrenman öncesi, sırası, sonrası
• Öncesi: antrenmandan yaklaşık 1 saat önce bir-iki bardak su (yaklaşık 240-600 ml; önceki sıvı durumuna göre).
• Sırası: yaklaşık her 15-20 dakikada birkaç yudum-yarım bardak; sıcak ve yoğun antrenmanda daha fazla.
• Sonrası: kaybedilen her 0,5 kg (bir libre) için yaklaşık 480-600 ml sıvı. Antrenman öncesi ve sonrası tartılmak ne kadar kaybedildiğini gösterir.

Ne içmeli?
En iyi seçenek sudur. Şekerli gazlı içecekler, meyve suyu ve enerji içecekleri su yerine geçmez (bkz. "Enerji ve Spor İçecekleri").

Uyarı işaretleri: baş dönmesi, baş ağrısı, kas krampı, aşırı yorgunluk, koyu renkli idrar. Belirtiler geçmezse antrenmanı bırakıp gölgeye alın ve sağlık personeline haber verin.$b$,
'Optimizing Performance Nutrition for Adolescent Athletes (Nutrients, 2025): https://www.mdpi.com/2072-6643/17/17/2792 — Nutritional Recommendations for the Young Athlete (JPOSNA): https://jposna.org/index.php/jposna/article/view/599/702'),

(null, 'enerji_icecekleri', 'Enerji ve Spor İçecekleri: Çocuklar İçin Uygun mu?',
$b$Enerji içecekleri ile spor içecekleri aynı şey değildir; karıştırılmamalıdır.

Enerji içecekleri
Amerikan Pediatri Akademisi (AAP) çocukların ve gençlerin enerji içeceklerini hiç tüketmemesi gerektiğini belirtir. İçerdikleri kafein ve diğer uyarıcılar çocuk ve genç beslenmesinde yer almaz; kalp çarpıntısı, uyku bozukluğu ve huzursuzluk riski taşırlar. Derlemeler de gençlerde enerji içeceğini önermiyor.

Spor içecekleri
Şeker ve elektrolit içerirler. Çoğu antrenmanda gerekmezler; su yeterlidir. Ancak uzun süren, yoğun ve sıcak ortamda yapılan etkinliklerde sınırlı ve gerekirse kullanılabilirler. Gündelik içecek olarak (okulda, evde) tüketmek şeker, diş çürüğü ve fazla kilo riskini artırır.

Şeker miktarı
Dünya Sağlık Örgütü'ne göre serbest şekerler (eklenmiş şeker, bal, şurup, meyve suyu) günlük enerjinin %10'undan az olmalı; %5'in altı ek fayda sağlar.

Ne yapmalı?
• Antrenmanda ve günlük hayatta ilk tercih su.
• Kafeinli içecek yerine yeterli uyku ve dengeli öğünler.
• Uzun turnuvada gerekirse ayran, süt, meyve ve tuzlu atıştırmalıklar seçenek olabilir.$b$,
'AAP, Sports Drinks and Energy Drinks for Children and Adolescents: Are They Appropriate? (Pediatrics, 2011): https://publications.aap.org/pediatrics/article/127/6/1182/30098/Sports-Drinks-and-Energy-Drinks-for-Children-and — WHO, Guideline: Sugars intake for adults and children: https://www.who.int/publications/i/item/WHO-NMH-NHD-15.3 — Optimizing Performance Nutrition for Adolescent Athletes (Nutrients, 2025): https://www.mdpi.com/2072-6643/17/17/2792'),

(null, 'kahvalti', 'Kahvaltı: Güne Enerjiyle Başlamak',
$b$Kahvaltı, özellikle ergenlerde en sık atlanan öğündür. Derlemeler, kahvaltının aynı sabah dikkat, hafıza ve yürütücü işlevler gibi zihinsel becerileri desteklediğini gösteriyor; etki özellikle yetersiz beslenen çocuklarda daha belirgin. Uzun vadeli etkiler ve hangi kahvaltı bileşiminin en iyi olduğu konusunda kanıtlar henüz tutarsız.

Sabah antrenmanı veya okul günü için pratik kahvaltı
• Karbonhidrat + protein: yulaflı süt, peynirli-yumurtalı tam tahıllı ekmek, yoğurt ve meyve.
• Yanına bir meyve veya bir avuç ceviz-fındık.
• Sabah çok erken antrenman varsa: hafif bir atıştırmalık (muz, tost) yeterli olabilir; antrenman sonrası tam kahvaltı yapılabilir.

İpuçları
• Akşamdan hazırlanan basit seçenekler (yulaf, haşlanmış yumurta, sandviç) sabah acele derdini azaltır.
• Kahvaltıda şekerli gevrek, çikolatalı krema ve gazlı içecek yerine daha doyurucu seçenekler tercih et.
• Sürekli sabahları iştahsızsan, öğün saatlerini yavaş yavaş öne çekmeyi dene.$b$,
'The Effects of Breakfast and Breakfast Composition on Cognition in Children and Adolescents: A Systematic Review (Advances in Nutrition, 2016): https://pubmed.ncbi.nlm.nih.gov/27184287/'),

(null, 'kemik_sagligi', 'Kemik Sağlığı: Kalsiyum, D Vitamini ve Demir',
$b$Ergenlik, kemik yapımının en yoğun olduğu dönemdir. Bu dönemde kazanılan kemik kütlesi ömür boyu sağlığı etkiler; yetersiz kalsiyum ve D vitamini stres kırığı riskini artırabilir.

Kalsiyum
9-18 yaş için günde yaklaşık 1300 mg önerilir. Süt, yoğurt, ayran, peynir, kefir, yeşil yapraklı sebzeler ve badem iyi kaynaklardır (1 su bardağı süt yaklaşık 300 mg).

D vitamini
Günde en az 600 IU (15 µg) önerilir. Güneş ışığı ve yağlı balık kaynaklarındandır. Kapalı salonda antrenman yapan veya kışın dışarıya az çıkan sporcularda eksiklik daha sık görülür. Takviye gerekip gerekmediğine kan tahliliyle doktor karar vermelidir.

Demir
Günlük ihtiyaç 13-18 yaşında erkeklerde yaklaşık 11 mg, kızlarda yaklaşık 15 mg'dır. Kırmızı et, karaciğer, yumurta, baklagiller ve koyu yeşil yapraklı sebzeler kaynaktır. Bitkisel demir, C vitamini (limon, portakal, biber) ile birlikte alınınca daha iyi emilir; çay ve süt, öğünle birlikte içilirse emilimi azaltabilir.

Sık yorgunluk, halsizlik, solgunluk veya performans düşüşü varsa demir eksikliği açısından doktora başvur; takviyeyi kendi başına başlama.$b$,
'Bone Health in Young Athletes: a Narrative Review (Curr Osteoporos Rep): https://pmc.ncbi.nlm.nih.gov/articles/PMC10248337/ — Optimizing Performance Nutrition for Adolescent Athletes (Nutrients, 2025): https://www.mdpi.com/2072-6643/17/17/2792'),

(null, 'yetersiz_enerji', 'Yetersiz Enerji Alımı (RED-S): Yeterince Yemiyor Olabilir misin?',
$b$RED-S (sporda göreceli enerji yetersizliği), sporcunun yediği enerjinin antrenman ve yaşamın gerektirdiğinden az olmasıyla ortaya çıkan bir durumdur. Sadece kilo verme amacıyla değil, farkında olmadan yetersiz yemekle de oluşabilir. Uluslararası Olimpiyat Komitesi (IOC) 2023 uzlaşı bildirisi bunun sağlığı ve performansı geniş bir yelpazede etkileyebildiğini vurgular; yeterli karbonhidrat alınmamasının da önemli olduğunu belirtir.

Olası uyarı işaretleri
• Sürekli yorgunluk ve performans düşüşü
• Sık sakatlanma, stres kırığı, geç iyileşme
• Sık hastalanma
• Kızlarda adet düzeninin bozulması veya gecikmesi
• Ruh hali değişiklikleri, konsantrasyon sorunu
• Yemekle ve kiloyla aşırı uğraşma

Genç sporcu için enerji dengesi
Derlemelerde genç sporcularda enerji kullanılabilirliğinin yağsız kütle başına günde yaklaşık 45 kcal/kg civarında olması tercih edilir; 30'un altı risklidir. Bunu evde hesaplamak yerine uzmana bırakın.

Ne yapmalı?
• Öğün atlamayın, antrenman yüküne göre yemeyi artırın.
• Antrenör ve aile "zayıf olmak daha hızlı olmak demek" yaklaşımını benimsememeli; kilo üzerine baskı yapmamalı.
• Belirtiler varsa spor hekimi ve diyetisyene başvurun.$b$,
'IOC consensus statement on Relative Energy Deficiency in Sport (REDs), 2023: https://www.olympics.com/ioc/news/ioc-publishes-new-consensus-statement-on-relative-energy-deficiency-in-sport-reds-to-protect-athlete-health — Optimizing Performance Nutrition for Adolescent Athletes (Nutrients, 2025): https://www.mdpi.com/2072-6643/17/17/2792'),

(null, 'uyku_beslenme', 'Uyku ve Beslenme',
$b$Uyku, beslenme kadar önemli bir toparlanma aracıdır. Uyku Vakfı ergenler için gecede 8-10 saat öneriyor; genç sporcular ise ortalama yaklaşık 6,3 saat uyuyor.

Neden önemli?
Bir derlemede, gecede 8 saatten az uyuyan genç sporcularda sakatlanma olasılığının yaklaşık 1,7 kat, yoğun antrenman dönemlerinde daha da yüksek olduğu bildirilmiş; 8 saatten fazla uyuyanlarda risk daha düşük bulunmuş. Aynı derleme, yeterli beslenen sporcuların da daha az sakatlandığını gösteriyor.

Uykuyu destekleyebilecek beslenme alışkanlıkları
• Akşam yemeğini çok geç ve çok ağır yemeyin; yatmadan hemen önce büyük öğün yerine hafif bir atıştırmalık (süt, yoğurt, muz) seçin.
• Kafeinli içecekleri (enerji içeceği, kola, çay) akşamları vermeyin.
• Bazı besinlerin (kivi, tart kiraz suyu, triptofan içeren süt ürünleri, hindi) uykuyu desteklediği öne sürülüyor; ancak bu konudaki araştırmalar sınırlı ve gençlerde kesin sonuç yok, mucize beklemeyin.

Pratik öneriler
• Her gün aynı saatte yatıp kalkmaya çalışın.
• Yatmadan önce ekran kullanımını azaltın.
• Uyku sorunu sürerse hekime danışın; melatonin gibi takviyeleri doktor önerisi olmadan vermeyin.$b$,
'Sleep, Nutrition, and Injury Risk in Adolescent Athletes: A Narrative Review (Nutrients, 2023): https://pmc.ncbi.nlm.nih.gov/articles/PMC10745648/');
