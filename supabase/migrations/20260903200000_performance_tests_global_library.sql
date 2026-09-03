-- Sabit (koda gömülü) performans testi kataloğu artık tamamen veritabanında
-- — fitness_exercises ile birebir aynı desen. club_id NULL olan satırlar
-- "global" kabul edilir — TÜM kulüpler görebilir, ama sadece Süper Admin
-- ekleyebilir/düzenleyebilir/silebilir.

create table if not exists "public"."performance_test_catalog" (
  "id"           uuid                     not null default gen_random_uuid(),
  "club_id"      uuid,
  "category"     text                     not null,
  "name"         text                     not null,
  "unit"         text                     not null,
  "equipment"    text,
  "instructions" text                     not null,
  "video_url"    text,
  "created_at"   timestamp with time zone not null default now(),
  constraint "performance_test_catalog_pkey" primary key (id)
);

alter table "public"."performance_test_catalog" enable row level security;

create trigger trg_set_club_id
  before insert on public.performance_test_catalog
  for each row
  execute function public.set_club_id_from_jwt();

create policy "performance_test_catalog_select" on "public"."performance_test_catalog"
  for select to PUBLIC
  using (club_id is null or club_id = public.current_club_id());

create policy "performance_test_catalog_insert" on "public"."performance_test_catalog"
  for insert to PUBLIC
  with check (
    (club_id = public.current_club_id())
    or (club_id is null and public.is_super_admin())
  );

create policy "performance_test_catalog_update" on "public"."performance_test_catalog"
  for update to PUBLIC
  using (
    (club_id = public.current_club_id())
    or (club_id is null and public.is_super_admin())
  )
  with check (
    (club_id = public.current_club_id())
    or (club_id is null and public.is_super_admin())
  );

create policy "performance_test_catalog_delete" on "public"."performance_test_catalog"
  for delete to PUBLIC
  using (
    (club_id = public.current_club_id())
    or (club_id is null and public.is_super_admin())
  );

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."performance_test_catalog" to "anon", "authenticated", "postgres", "service_role";

-- Video depolama: fitness-exercise-videos ile aynı desen, ayrı bir bucket.
-- Süper Admin'in global testler için yüklediği videolar "global/" klasörüne
-- gider; 50 MB standart üst sınır (bkz. fitness-exercise-videos'taki aynı gerekçe).
insert into storage.buckets (id, name, public, file_size_limit)
values ('performance-test-videos', 'performance-test-videos', true, 52428800)
on conflict (id) do update set file_size_limit = 52428800;

create policy "performance_test_videos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'performance-test-videos'
    and (
      (
        (storage.foldername(name))[1] = 'global'
        and exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'super_admin')
      )
      or exists (
        select 1 from public.users u
        where u.auth_user_id = auth.uid()
          and u.role in ('coach', 'club_admin')
          and u.club_id::text = (storage.foldername(name))[1]
      )
    )
  );

create policy "performance_test_videos_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'performance-test-videos'
    and (
      (
        (storage.foldername(name))[1] = 'global'
        and exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'super_admin')
      )
      or exists (
        select 1 from public.users u
        where u.auth_user_id = auth.uid()
          and u.role in ('coach', 'club_admin')
          and u.club_id::text = (storage.foldername(name))[1]
      )
    )
  );

create policy "performance_test_videos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'performance-test-videos'
    and (
      (
        (storage.foldername(name))[1] = 'global'
        and exists (select 1 from public.users u where u.auth_user_id = auth.uid() and u.role = 'super_admin')
      )
      or exists (
        select 1 from public.users u
        where u.auth_user_id = auth.uid()
          and u.role in ('coach', 'club_admin')
          and u.club_id::text = (storage.foldername(name))[1]
      )
    )
  );

-- Önceden koda gömülü (sabit) performans testi kataloğu artık veritabanına
-- taşınıyor — tüm kulüpler tarafından görülebilen, club_id = NULL "global"
-- kayıtlar olarak. Her satır için önce yeni bir satır ekleniyor, ardından o
-- eski (bare) test_key'e referans veren TÜM geçmiş performance_measurements
-- kayıtları yeni "custom:<uuid>" formatına güncelleniyor.
do $$
declare
  rec record;
  new_id uuid;
begin
  for rec in
    select * from (values
    ('antropometrik', 'height', 'Boy', 'cm', null, 'Sporcu ayakkabısız, sırtı ve topukları duvara/stadiometreye değecek şekilde dik durur. Baş, göz-kulak hizası yere paralel olacak şekilde (Frankfort düzlemi) tutulur ve en yüksek nokta okunur.'),
    ('antropometrik', 'weight', 'Kilo', 'kg', null, 'Sporcu hafif kıyafetle, ayakkabısız ve mümkünse aç karnına, kalibre edilmiş bir baskülde tartılır.'),
    ('antropometrik', 'bmi', 'BKİ (Vücut Kitle İndeksi)', 'kg/m²', null, 'Ayrı bir ölçüm yapılmaz — boy ve kilo ölçümlerinden kilo(kg) / boy(m)² formülüyle otomatik hesaplanır.'),
    ('antropometrik', 'sitting_height', 'Oturarak Boy (PHV için)', 'cm', null, 'Sporcu düz bir sırada, kalça ve dizler 90°, sırtı dik oturur. Stadiometre ile oturma yüzeyinden baş tepe noktasına kadar mesafe ölçülür — PHV (zirve boy uzama yaşı) hesaplamasında kullanılır.'),
    ('antropometrik', 'body_fat', 'Vücut Yağ Oranı', '%', 'Kaliper / bioelektrik cihaz gerekir', 'Kaliper ile standart cilt kıvrımı noktalarından (ör. triceps, subskapular, suprailiak) ölçüm alınır ya da bioelektrik impedans (BIA) cihazı kullanılır.'),
    ('antropometrik', 'phv', 'Zirve Boy Uzama Yaşı (PHV)', 'yaş', 'Türetilmiş hesaplama', 'Doğrudan ölçülmez — boy, oturarak boy, kilo ve kronolojik yaş verileri Mirwald formülüne girilerek hesaplanan türetilmiş bir değerdir.'),
    ('antropometrik', 'arm_span', 'Kol Açıklığı (Wingspan)', 'cm', null, 'Sporcu kollarını omuz hizasında yana doğru tam açar; bir orta parmak ucundan diğerine kadar olan mesafe ölçülür.'),
    ('antropometrik', 'skinfold_sum', 'Deri Kıvrımı Toplamı (7 Bölge)', 'mm', 'Kaliper gerekir', 'Standart 7 bölgeden (göğüs, karın, uyluk, triceps, subskapular, suprailiak, orta-aksiller) kaliperle kıvrım kalınlığı ölçülüp toplanır.'),
    ('antropometrik', 'waist_hip_ratio', 'Bel-Kalça Oranı', 'oran', null, 'Bel çevresi en dar noktadan, kalça çevresi en geniş noktadan mezura ile ölçülür; bel çevresinin kalça çevresine oranı hesaplanır.'),
    ('surat', 'sprint_10m', '10m Sürat (Kalkış Hızı)', 'sn', null, 'Sporcu start çizgisinde durur ve komutla patlayıcı çıkış yapar. 10m''deki bitiş noktasına ulaşana kadar geçen süre kronometre/fotosel ile ölçülür — kalkış hızını gösterir.'),
    ('surat', 'sprint_20m', '20m Sürat', 'sn', null, 'Aynı duran start pozisyonundan çıkılır, 20m''lik mesafeyi kat etme süresi ölçülür.'),
    ('surat', 'sprint_30m', '30m Sürat', 'sn', null, 'Duran start pozisyonundan çıkılır, 30m''lik mesafeyi kat etme süresi ölçülür.'),
    ('surat', 'sprint_40m', '40m Sürat', 'sn', null, 'Duran start pozisyonundan çıkılır, 40m''lik mesafeyi kat etme süresi ölçülür.'),
    ('surat', 'flying_sprint', 'Flying Sprint (20m, uçan start)', 'sn', null, 'Sporcu 10-20m''lik bir hazırlık koşusuyla önceden hızlanır ve tam hızda ölçüm bölgesine girer; böylece ivmelenme değil, saf maksimum sürat ölçülür.'),
    ('surat', 'flying_10m', 'Flying 10m Sürat', 'sn', null, 'Sporcu önceden hazırlık koşusuyla hızlanıp tam hızda 10m''lik ölçüm bölgesine girer — saf maksimum sürati (ivmelenmeden bağımsız) gösterir.'),
    ('surat', 'repeated_sprint', 'Tekrarlı Sprint Testi (RSA)', 'sn', null, '6x20m sprint, her tekrar arasında 20sn aktif dinlenmeyle koşulur; her tekrarın süresi kaydedilip performans düşüşünden (yorgunluk indeksi) sürat dayanıklılığı değerlendirilir.'),
    ('ceviklik', 't_test', 'T-Testi', 'sn', null, 'Koniler T şeklinde dizilir (orta çizgi 9.14m, yan koniler ortadan 4.57m). Sporcu ortadan öne sprint atar, sağa yan kayarak koniye dokunur, sola yan kayarak karşı koniye dokunur, tekrar ortaya yan kayar, sonunda geri geri koşarak başlangıca döner. Toplam süre ölçülür.'),
    ('ceviklik', 'pro_agility', '5-10-5 Pro Agility Shuttle', 'sn', null, '3 koni 5 yarda arayla düz bir çizgide dizilir. Sporcu ortadan başlar, bir yöne 5 yarda koşup çizgiye dokunur, ters yöne 10 yarda koşup diğer çizgiye dokunur, son olarak 5 yarda koşarak başlangıç noktasından geçer.'),
    ('ceviklik', 'illinois', 'Illinois Çeviklik Testi', 'sn', null, '10x5m''lik alanda, standart Illinois koni dizilimiyle (başta/sonda düz koşu, ortada 4 koni ile slalom) parkur koşulur; toplam süre ölçülür.'),
    ('ceviklik', 'test_505', '505 Agility Test', 'sn', null, 'Sporcu 15m''lik bir yaklaşım koşusuyla hız kazanır, 5m''lik dönüş noktasına ulaşıp 180° döner ve 5m geri koşar; yalnızca bu 10m''lik dönüş segmentinin süresi ölçülür.'),
    ('ceviklik', 'zigzag', 'Zigzag Testi', 'sn', null, 'Koniler çapraz açılarla 4-5 segment oluşturacak şekilde dizilir. Sporcu segmentler arasında yön değiştirerek zikzak çizip parkuru en hızlı şekilde tamamlar.'),
    ('ceviklik', 'arrowhead_agility', 'Arrowhead Çeviklik Testi', 'sn', null, 'Ok başı (arrowhead) şeklinde dizilmiş koniler arasında sporcu sağa ve sola yön değiştirerek parkuru en hızlı şekilde tamamlar.'),
    ('ceviklik', 'l_drill', 'L-Drill (3-Cone Drill)', 'sn', null, 'L şeklinde dizilmiş 3 koni etrafında belirli bir sırayla (düz koşu, dönüş, slalom) koşulup parkur tamamlanır; toplam süre ölçülür.'),
    ('sicrama', 'vertical_jump', 'Dikey Sıçrama (Sargent Jump)', 'cm', null, 'Sporcu duvara yakın durup kolunu tam uzatarak ulaşabildiği en yüksek noktayı işaretler. Ardından yardımsız (kol sallayarak) dikey sıçrayıp en yüksek noktaya tekrar dokunur. İki işaret arasındaki fark ölçülür.'),
    ('sicrama', 'squat_jump', 'Squat Jump (SJ)', 'cm', null, 'Sporcu diz açısı yaklaşık 90° olacak şekilde çömelik pozisyonda 2-3 saniye sabit bekler (karşı hareket olmadan), ardından doğrudan yukarı maksimum sıçrama yapar.'),
    ('sicrama', 'cmj', 'Countermovement Jump (CMJ)', 'cm', null, 'Sporcu ayakta dururken hızlıca çömelme (karşı hareket) yapıp, hemen ardından duraksamadan maksimum yükseklikte dikey sıçrar.'),
    ('sicrama', 'broad_jump', 'Broad Jump (Uzun Atlama)', 'cm', null, 'Sporcu çizginin gerisinde iki ayağı bitişik durur ve iki ayakla birden öne doğru maksimum mesafeye sıçrar. Çizgiden en yakın iniş noktasına (topuk) kadar olan mesafe ölçülür.'),
    ('sicrama', 'drop_jump', 'Reaktif Sıçrama (Drop Jump / RSI)', 'RSI', 'Sıçrama platformu gerekir', 'Sporcu belirli yükseklikteki bir kutudan aşağı iner, yere değer değmez mümkün olan en kısa temas süresiyle maksimum yükseklikte tekrar sıçrar. Temas süresi ve sıçrama yüksekliğinden Reaktif Kuvvet İndeksi (RSI) hesaplanır.'),
    ('sicrama', 'single_leg_hop', 'Tek Bacak Sıçrama Mesafesi (Single Leg Hop)', 'cm', null, 'Sporcu tek bacakla öne doğru maksimum mesafeye sıçrar, kontrollü iner. İniş noktasına kadar olan mesafe ölçülür — her iki bacak için ayrı ayrı yapılır.'),
    ('sicrama', 'triple_hop', 'Üçlü Sıçrama (Triple Hop)', 'cm', null, 'Sporcu aynı bacakla art arda üç sıçrama yapar, son inişteki toplam mesafe ölçülür — her iki bacak için ayrı ayrı yapılır.'),
    ('sicrama', 'lateral_jump', 'Yana Sıçrama (Lateral Jump)', 'cm', null, 'Sporcu iki ayakla yana doğru maksimum mesafeye sıçrar, kontrollü iniş yapar. Başlangıç çizgisinden iniş noktasına kadar olan mesafe ölçülür.'),
    ('kuvvet', 'pushup', 'Şınav Testi (1 dk, max tekrar)', 'tekrar', null, '1 dakika içinde, dirsekler tam açılıp göğüs neredeyse yere değecek şekilde doğru formda yapılabilen maksimum şınav tekrarı sayılır.'),
    ('kuvvet', 'situp', 'Mekik Testi (1 dk, max tekrar)', 'tekrar', null, 'Sporcu sırt üstü yatar, dizler bükülü, ayaklar sabitlenir. 1 dakika içinde doğru formda yapılabilen maksimum mekik tekrarı sayılır.'),
    ('kuvvet', 'grip_strength', 'El Kavrama Kuvveti', 'kg', 'Dinamometre gerekir', 'Sporcu el dinamometresini kolunu yana sarkıtarak maksimum güçle sıkar. Her el için 2-3 deneme yapılır ve en iyi/ortalama değer kaydedilir.'),
    ('kuvvet', 'one_rm', 'Squat / Bench Press 1RM', 'kg', 'Ekipman + gözetim gerekir', 'Isınma sonrası ağırlık kademeli olarak artırılarak sporcunun tek tekrarda doğru formda kaldırabildiği maksimum ağırlık belirlenir. Mutlaka gözetim/spot altında yapılmalıdır.'),
    ('kuvvet', 'med_ball_throw', 'Medicine Ball Throw', 'm', null, 'Sporcu sabit bir çizginin gerisinde durur ve sağlık topunu göğüs önünden (chest pass) iki elle maksimum kuvvetle öne fırlatır. Topun düştüğü noktaya kadar olan mesafe ölçülür.'),
    ('kuvvet', 'pullup_test', 'Barfiks Testi (Max Tekrar)', 'tekrar', null, 'Bar geniş tutuşla tutulur, çene barın üstüne çıkana kadar çekilir; doğru formda yapılabilen maksimum tekrar sayısı kaydedilir.'),
    ('kuvvet', 'plank_hold', 'Plank Tutma Süresi (Core Dayanıklılık)', 'sn', null, 'Sporcu doğru plank pozisyonunda (vücut düz bir hat halinde) formu bozmadan tutabildiği maksimum süre ölçülür.'),
    ('kuvvet', 'leg_press_1rm', 'Leg Press 1RM', 'kg', 'Ekipman + gözetim gerekir', 'Isınma sonrası ağırlık kademeli olarak artırılarak sporcunun leg press makinesinde tek tekrarda doğru formda itebildiği maksimum ağırlık belirlenir.'),
    ('dayaniklilik', 'cooper', 'Cooper Testi (12 dk Koşu Mesafesi)', 'm', null, 'Sporcu 12 dakika boyunca düzenli bir pist üzerinde mümkün olan en uzun mesafeyi koşmaya/yürümeye çalışır. Süre sonunda kat edilen toplam mesafe metre cinsinden kaydedilir.'),
    ('dayaniklilik', 'yoyo', 'Yo-Yo Intermittent Recovery Test', 'seviye', null, 'Sesli sinyallere göre giderek hızlanan 20m gidiş-dönüş koşuları arasında kısa aktif dinlenme (5-10m yürüyüş) yapılır. Sporcu art arda iki kez sinyale yetişemediğinde test biter, ulaşılan son seviye kaydedilir.'),
    ('dayaniklilik', 'beep_test', 'Beep Test (20m Shuttle Run / PACER)', 'seviye', null, '20m aralıkla konulan iki çizgi arasında, giderek hızlanan sesli sinyallere uyarak gidiş-dönüş koşusu yapılır. Sporcunun art arda iki sinyale yetişemediği an test biter, ulaştığı son seviye/shuttle kaydedilir.'),
    ('dayaniklilik', 'vo2max', 'VO2 Max', 'ml/kg/dk', 'Laboratuvar / maske gerekir', 'En doğru sonuç, laboratuvar ortamında maske takılarak egzersiz sırasında oksijen tüketiminin ölçülmesiyle elde edilir. Saha ortamında Cooper testi veya beep test sonuçlarından tahmini formüllerle de hesaplanabilir.'),
    ('dayaniklilik', 'resting_hr', 'Dinlenik Kalp Atım Hızı', 'atım/dk', null, 'Sporcu en az 5 dakika sakin şekilde dinlendikten sonra, otururken 1 dakika boyunca nabız sayılır (nabız/dinlenik kalp atım ölçer de kullanılabilir).'),
    ('dayaniklilik', 'hr_recovery', 'Kalp Atım Toparlanma Testi (HRR)', 'atım/dk', null, 'Standart bir efor testi (ör. beep test) bitiminde nabız ölçülür, 1 dakika sonra tekrar ölçülür; iki değer arasındaki fark kardiyovasküler toparlanma hızını gösterir.'),
    ('esneklik', 'sit_reach', 'Otur-Uzan Testi (Sit and Reach)', 'cm', null, 'Sporcu bacaklar düz uzatılmış, ayak tabanları ölçüm kutusuna dayalı şekilde yerde oturur. Dizleri kırmadan, elleriyle öne doğru maksimum uzanır; ulaşılan mesafe cm cinsinden okunur.'),
    ('esneklik', 'shoulder_flex', 'Omuz Esneklik Testi', 'cm', null, 'Sporcu bir elini omuz üzerinden aşağıya, diğer elini bel arkasından yukarıya uzatarak sırtında iki eli birbirine yaklaştırmaya/birleştirmeye çalışır. İki el arasındaki açıklık (veya örtüşme) cm cinsinden ölçülür; her iki taraf için ayrı ayrı yapılır.'),
    ('esneklik', 'hip_gonio', 'Kalça Fleksiyon / Ekstansiyon', 'derece', 'Gonyometre gerekir', 'Sporcu sırt üstü/yan yatar, gonyometre standart anatomik referans noktalarına (kalça ekleminin dönüş merkezi hizasına) yerleştirilerek kalçanın maksimum fleksiyon ve ekstansiyon açıları ölçülür.'),
    ('esneklik', 'ankle_dorsiflexion', 'Ayak Bileği Dorsifleksiyon Testi', 'cm', 'Duvar/cetvel gerekir', 'Sporcu duvara doğru diz duvara değecek şekilde öne eğilir, topuk yerden kalkmadan ayak parmak ucuyla duvar arasındaki maksimum mesafe ölçülür.'),
    ('esneklik', 'thomas_test', 'Thomas Testi (Kalça Fleksör Esnekliği)', 'derece', 'Muayene masası + gonyometre', 'Sporcu masada sırt üstü yatar, bir bacağı göğsüne doğru çeker; diğer bacağın masadan kalkma açısı gonyometre ile ölçülür — kalça fleksör kısalığını gösterir.'),
    ('denge', 'stork_balance', 'Stork Denge Testi', 'sn', null, 'Sporcu tek ayak üzerinde durur, diğer ayağın tabanını destek bacağın dizine yaslar, elleri belde. Dengeyi kaybedene (ayak yerden kalkana/eller belden ayrılana) kadar geçen süre ölçülür.'),
    ('denge', 'y_balance', 'Y Denge Testi (Y-Balance Test)', 'cm', null, 'Sporcu tek ayak üzerinde dengede durup diğer ayakla Y şeklinde üç yönde (ön, arka-iç, arka-dış) mümkün olduğunca uzanır; her yöndeki uzanma mesafesi ölçülür.'),
    ('denge', 'single_leg_balance_eyes_closed', 'Gözü Kapalı Tek Ayak Denge', 'sn', null, 'Sporcu gözleri kapalı, tek ayak üzerinde elleri belde dengede durmaya çalışır. Dengeyi kaybedene kadar geçen süre ölçülür.'),
    ('denge', 'flamingo_balance', 'Flamingo Denge Testi', 'düşme sayısı', null, 'Sporcu dar bir denge çıtasında tek ayak üzerinde durur, diğer ayağı arkadan elle tutar. 1 dakika içinde dengeyi kaybedip düşme (yeniden başlama) sayısı kaydedilir — az olması iyidir.')
    ) as t(category, old_key, name, unit, equipment, instructions)
  loop
    insert into public.performance_test_catalog (club_id, category, name, unit, equipment, instructions)
    values (null, rec.category, rec.name, rec.unit, rec.equipment, rec.instructions)
    returning id into new_id;

    update public.performance_measurements set test_key = 'custom:' || new_id::text where test_key = rec.old_key;
  end loop;
end $$;
