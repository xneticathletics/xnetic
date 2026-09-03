-- Sabit (koda gömülü) fitness egzersiz kataloğu artık tamamen veritabanında.
-- club_id NULL olan satırlar "global" kabul edilir — TÜM kulüpler görebilir,
-- ama sadece Süper Admin ekleyebilir/düzenleyebilir/silebilir. Kulüplerin
-- kendi eklediği (club_id dolu) hareketler eskisi gibi sadece o kulübe özel.

alter table public.fitness_exercises alter column club_id drop not null;

drop policy if exists "tenant_isolation_fitness_exercises" on public.fitness_exercises;

create policy "fitness_exercises_select" on public.fitness_exercises
  for select to PUBLIC
  using (club_id is null or club_id = public.current_club_id());

create policy "fitness_exercises_insert" on public.fitness_exercises
  for insert to PUBLIC
  with check (
    (club_id = public.current_club_id())
    or (club_id is null and public.is_super_admin())
  );

create policy "fitness_exercises_update" on public.fitness_exercises
  for update to PUBLIC
  using (
    (club_id = public.current_club_id())
    or (club_id is null and public.is_super_admin())
  )
  with check (
    (club_id = public.current_club_id())
    or (club_id is null and public.is_super_admin())
  );

create policy "fitness_exercises_delete" on public.fitness_exercises
  for delete to PUBLIC
  using (
    (club_id = public.current_club_id())
    or (club_id is null and public.is_super_admin())
  );

-- Video depolama: Süper Admin'in global hareketler için yüklediği videolar
-- "global/" klasörüne gider (club_id'si olmadığı için kulüp klasörü kullanamaz).
-- Ayrıca standart bir üst boyut sınırı (50 MB) — "1GB'lık video olmaz" —
-- hem bucket seviyesinde (gerçek/tamper-proof zorunluluk) hem istemci
-- tarafında (hızlı geri bildirim için, kodda ayrıca kontrol ediliyor).
update storage.buckets set file_size_limit = 52428800 where id = 'fitness-exercise-videos';

drop policy if exists "fitness_exercise_videos_coach_insert" on storage.objects;
create policy "fitness_exercise_videos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fitness-exercise-videos'
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

drop policy if exists "fitness_exercise_videos_coach_update" on storage.objects;
create policy "fitness_exercise_videos_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'fitness-exercise-videos'
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

drop policy if exists "fitness_exercise_videos_coach_delete" on storage.objects;
create policy "fitness_exercise_videos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fitness-exercise-videos'
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

-- Önceden koda gömülü (sabit) fitness egzersiz kataloğu artık veritabanına
-- taşınıyor — tüm kulüpler tarafından görülebilen, club_id = NULL "global"
-- kayıtlar olarak. Her satır için önce yeni bir satır ekleniyor, ardından
-- o eski (bare) exercise_key'e referans veren TÜM geçmiş
-- fitness_program_items ve fitness_measurements kayıtları yeni
-- "custom:<uuid>" formatına güncelleniyor — böylece geçmiş veriler bozulmadan
-- tamamen veritabanı tabanlı yeni sisteme geçiliyor.
do $$
declare
  rec record;
  new_id uuid;
begin
  for rec in
    select * from (values
    ('gogus', 'bench_press', 'Bench Press', false, 'Düz bench''te sırt üstü yatarak bar omuz genişliğinden biraz geniş tutulur, göğüse değecek şekilde indirilip kontrollü olarak yukarı itilir.'),
    ('gogus', 'incline_bench_press', 'Eğik Bench Press (Incline)', false, '30-45° eğimli bench''te aynı bench press hareketi yapılır — üst göğüs kaslarını daha çok çalıştırır.'),
    ('gogus', 'decline_bench_press', 'Alçak Bench Press (Decline)', false, 'Baş aşağı eğimli bench''te yapılan bench press — alt göğüs bölgesini hedefler.'),
    ('gogus', 'dumbbell_bench_press', 'Dambıl Bench Press', false, 'Düz bench''te sırt üstü yatarak iki elde dambıl ile bench press yapılır, hareket genişliği barbelden fazladır.'),
    ('gogus', 'incline_dumbbell_press', 'Eğik Dambıl Press', false, 'Eğimli bench''te dambıllarla yapılan press hareketi, üst göğüs ve ön omuzu hedefler.'),
    ('gogus', 'chest_fly', 'Chest Fly (Dumbbell)', false, 'Düz bench''te sırt üstü yatarak dambıllar hafif bükülü kollarla yanlara açılır, göğüs hizasında birleştirilir.'),
    ('gogus', 'cable_crossover', 'Kablo Çapraz Çekiş (Cable Crossover)', false, 'Kablo istasyonunda iki taraftan tutulup kollar öne doğru çapraz şekilde birleştirilir, göğüs sıkıştırılır.'),
    ('gogus', 'pec_deck', 'Kelebek Makinesi (Pec Deck)', false, 'Makinede oturarak, kollar öne doğru kapatılıp göğüs kasları sıkıştırılır.'),
    ('gogus', 'machine_chest_press', 'Göğüs Presi Makinesi', false, 'Makinede oturarak, tutamaklar öne doğru itilir — bench press''e benzer sabit bir hareket yolu sağlar.'),
    ('gogus', 'close_grip_bench_press', 'Dar Tutuş Bench Press', false, 'Bench press''e benzer, ancak eller omuz genişliğinden dar tutularak yapılır — triceps katılımı artar.'),
    ('gogus', 'floor_press', 'Floor Press', false, 'Yerde sırt üstü yatarak yapılan bench press — hareket genişliği dirsekler yere değene kadardır.'),
    ('gogus', 'landmine_press', 'Landmine Press', false, 'Bir ucu sabitlenmiş bar, tek elle omuz hizasından çapraz şekilde yukarı ve öne itilir.'),
    ('gogus', 'svend_press', 'Svend Press', false, 'İki disk göğüs önünde birbirine bastırılarak öne doğru itilir ve geri çekilir — sıkıştırma odaklı bir hareket.'),
    ('gogus', 'pushup_max', 'Şınav (Max Tekrar)', true, 'Eller omuz genişliğinde yerde, vücut düz bir hat halinde tutularak göğüs yere yaklaşana kadar inilip itilir; 1 dakikada yapılabilen maksimum tekrar sayılır.'),
    ('gogus', 'incline_pushup', 'Yüksekten Şınav (Incline Push-up)', true, 'Eller yüksek bir yüzeye (sehpa/bench) konularak yapılan şınav — normal şınavdan daha kolaydır.'),
    ('gogus', 'decline_pushup', 'Ayak Yüksekte Şınav (Decline Push-up)', true, 'Ayaklar yüksek bir yüzeye konularak yapılan şınav — üst göğüs ve omuz katılımı artar.'),
    ('gogus', 'chest_dips', 'Paralelde Şınav (Göğüs Ağırlıklı Dips)', true, 'Paralel barlarda gövde öne eğik tutularak inip çıkılır — gövde öne eğildikçe göğüs katılımı artar.'),
    ('gogus', 'cable_fly_low_to_high', 'Alt Kablo Çapraz (Low-to-High Cable Fly)', false, 'Kablo alt makaradan tutulup üst göğüse doğru çapraz şekilde yukarı-içe çekilir — üst göğüs lifini hedefler.'),
    ('gogus', 'cable_fly_high_to_low', 'Üst Kablo Çapraz (High-to-Low Cable Fly)', false, 'Kablo üst makaradan tutulup alt göğüse doğru çapraz şekilde aşağı-içe çekilir — alt göğüs lifini hedefler.'),
    ('gogus', 'guillotine_press', 'Guillotine Press', false, 'Bar boyun/üst göğüs hizasına indirilerek yapılan bench press varyasyonu — dikkatli kontrol gerektirir.'),
    ('gogus', 'smith_bench_press', 'Smith Machine Bench Press', false, 'Sabit rayla hareket eden Smith makinesinde yapılan bench press — denge ihtiyacını azaltır.'),
    ('gogus', 'plyo_pushup', 'Patlayıcı Şınav (Plyometric Push-up)', true, 'Şınav sırasında eller yerden kalkacak kadar patlayıcı şekilde itilir — güç ve hız gelişimini hedefler.'),
    ('gogus', 'around_the_world', 'Around the World (Dambıl)', false, 'İki dambıl gövde önünde geniş bir daire çizecek şekilde aşağıdan yukarı döndürülür — göğüs ve omuz esnekliğini çalıştırır.'),
    ('gogus', 'wide_grip_pushup', 'Geniş Tutuş Şınav (Wide Push-up)', true, 'Eller omuz genişliğinden daha geniş yerleştirilerek yapılan şınav — dış göğüs kaslarını hedefler.'),
    ('gogus', 'single_arm_dumbbell_press', 'Tek Kol Dambıl Press', false, 'Sırt üstü yatarak tek elde dambıl ile bench press yapılır — gövde stabilizasyonu ekstra gerektirir.'),
    ('sirt', 'deadlift', 'Deadlift', false, 'Bar yerden, sırt düz tutularak ve kalça geriye itilerek kaldırılır — tüm arka zincir kasları çalışır.'),
    ('sirt', 'romanian_deadlift', 'Romanian Deadlift (RDL)', false, 'Dizler hafif bükülü tutularak bar kalçadan aşağı sarkıtılır, hamstring geriminde kontrollü inilip kalkılır.'),
    ('sirt', 'sumo_deadlift', 'Sumo Deadlift', false, 'Ayaklar geniş, ayak uçları dışa dönük şekilde yapılan deadlift — kalça ve iç bacak katılımı artar.'),
    ('sirt', 'bent_over_row', 'Bent-Over Row', false, 'Gövde öne eğik, sırt düz tutularak bar karın bölgesine doğru çekilir.'),
    ('sirt', 't_bar_row', 'T-Bar Row', false, 'T-bar sehpasında gövde öne eğik durularak bar göğüs/karın hizasına çekilir.'),
    ('sirt', 'seated_cable_row', 'Oturarak Kablo Çekişi (Seated Cable Row)', false, 'Kablo makinesinde oturarak sırt dik tutulur, tutamak karın bölgesine doğru çekilir.'),
    ('sirt', 'lat_pulldown', 'Lat Pulldown', false, 'Oturarak, geniş tutuşla bar göğüs üst hizasına doğru aşağı çekilir.'),
    ('sirt', 'wide_grip_lat_pulldown', 'Geniş Tutuş Lat Pulldown', false, 'Lat pulldown''ın geniş tutuşlu versiyonu — sırt genişliğini hedefler.'),
    ('sirt', 'close_grip_lat_pulldown', 'Dar Tutuş Lat Pulldown', false, 'Lat pulldown''ın dar/paralel tutuşlu versiyonu — sırt kalınlığını hedefler.'),
    ('sirt', 'single_arm_dumbbell_row', 'Tek Kol Dambıl Row', false, 'Tek diz ve el bench üzerinde desteklenerek, diğer elde dambıl belden yukarı çekilir.'),
    ('sirt', 'face_pull', 'Face Pull', false, 'Kablo yüz hizasında, iki elle dışa doğru çekilerek arka omuz ve üst sırt çalıştırılır.'),
    ('sirt', 'hyperextension', 'Sırt Ekstansiyonu (Hyperextension)', false, 'Hyperextension sehpasında gövde öne eğilip sırt/kalça kaslarıyla yukarı kaldırılır.'),
    ('sirt', 'good_morning', 'Good Morning', false, 'Bar omuzda, dizler hafif bükülü şekilde gövde öne eğilip kalça menteşesiyle yukarı doğrulunur.'),
    ('sirt', 'shrugs', 'Trapez Çekişi (Shrugs)', false, 'Ellerde ağırlıkla omuzlar kulaklara doğru yukarı kaldırılıp indirilir — trapezi hedefler.'),
    ('sirt', 'straight_arm_pulldown', 'Düz Kol Pulldown (Cable Pullover)', false, 'Kollar düz tutularak kablo yukarıdan aşağı, uyluğa doğru çekilir — lat izolasyonu sağlar.'),
    ('sirt', 'pullup_max', 'Barfiks (Max Tekrar)', true, 'Bar geniş tutuşla tutulup çene barın üstüne çıkana kadar çekilir; yapılabilen maksimum tekrar sayılır.'),
    ('sirt', 'chinup_max', 'Ters Kavrama Barfiks (Chin-up)', true, 'Bar ters (avuç içi kendine bakacak) tutuşla tutulup çekilir — biceps katılımı daha fazladır.'),
    ('sirt', 'assisted_pullup', 'Destekli Barfiks (Assisted Pull-up)', true, 'Destek makinesi ya da bant yardımıyla ağırlığın bir kısmı azaltılarak barfiks hareketi tekrar edilir.'),
    ('sirt', 'meadows_row', 'Meadows Row', false, 'Landmine bara yan durularak tek elle çekiş yapılır — sırt kalınlığını hedefler.'),
    ('sirt', 'pendlay_row', 'Pendlay Row', false, 'Her tekrarda bar yere değecek şekilde, gövde yere paralele yakın tutularak patlayıcı bir çekiş yapılır.'),
    ('sirt', 'machine_row', 'Row Makinesi (Machine Row)', false, 'Göğüs destekli row makinesinde tutamaklar vücuda doğru çekilir.'),
    ('sirt', 'inverted_row', 'Ters Row (Inverted Row)', true, 'Alçak bir bara sırt üstü asılı pozisyonda, vücut düz tutularak göğüs bara doğru çekilir.'),
    ('sirt', 'kroc_row', 'Kroc Row', false, 'Ağır bir dambılla, hafif momentum kullanılarak yapılan yüksek tekrarlı tek kol row.'),
    ('sirt', 'rack_pull', 'Rack Pull', false, 'Bar diz altı yerine raf üzerinden başlatılarak yapılan kısmi deadlift — üst sırt ve tutuş gücünü hedefler.'),
    ('sirt', 'landmine_row', 'Landmine Row', false, 'Bir ucu sabitlenmiş bar iki elle ya da tek elle karın hizasına doğru çekilir.'),
    ('sirt', 'band_pull_apart', 'Bant ile Pull-Apart (Band Pull-Apart)', true, 'Direnç bandı iki elle omuz hizasında tutulup gövde önünde yanlara doğru çekilerek açılır — üst sırt ve arka omuzu hedefler.'),
    ('bacak', 'squat', 'Squat (Back Squat)', false, 'Bar sırt üstünde, ayaklar omuz genişliğinde açık şekilde kalça geriye ve aşağı itilerek çömelinir, sonra yukarı kalkılır.'),
    ('bacak', 'front_squat', 'Front Squat', false, 'Bar ön omuzlarda tutularak yapılan squat — gövdeyi daha dik tutar, quadriceps katılımı artar.'),
    ('bacak', 'goblet_squat', 'Goblet Squat', false, 'Tek bir dambıl/kettlebell göğüs önünde iki elle tutularak yapılan squat — başlangıç seviyesi için idealdir.'),
    ('bacak', 'hack_squat', 'Hack Squat', false, 'Hack squat makinesinde sırt yaslanarak, bacaklarla itip çömelme hareketi yapılır.'),
    ('bacak', 'leg_press', 'Leg Press', false, 'Leg press makinesinde sırt yaslanarak, platform bacaklarla itilir.'),
    ('bacak', 'bulgarian_split_squat', 'Bulgar Squat (Bulgarian Split Squat)', false, 'Arka ayak yüksek bir yüzeye konularak, ön bacakla tek taraflı squat yapılır.'),
    ('bacak', 'walking_lunge', 'Yürüyerek Lunge (Walking Lunge)', false, 'İleri adım atılarak çömelinir, sonra diğer bacakla ileri adımla devam edilir.'),
    ('bacak', 'reverse_lunge', 'Geri Adım Lunge (Reverse Lunge)', false, 'Geriye doğru adım atılarak çömelme yapılır — dize daha az yük biner.'),
    ('bacak', 'lunge', 'Lunge (Dumbbell)', false, 'Bir bacakla öne adım atılıp iki diz de 90°''ye yakın açılana kadar inilir, sonra başlangıca dönülür.'),
    ('bacak', 'leg_extension', 'Bacak Açma Makinesi (Leg Extension)', false, 'Makinede oturarak, dizler düzleşene kadar bacaklar öne doğru kaldırılır.'),
    ('bacak', 'leg_curl', 'Bacak Çekme Makinesi (Leg Curl)', false, 'Makinede yüzüstü ya da oturarak, topuklar kalçaya doğru bükülür.'),
    ('bacak', 'calf_raise', 'Calf Raise', false, 'Ayakta durarak topuklar yerden kaldırılıp parmak uçlarında yükselinir.'),
    ('bacak', 'seated_calf_raise', 'Oturarak Calf Raise', false, 'Oturarak yapılan calf raise — soleus kasını daha çok hedefler.'),
    ('bacak', 'hip_thrust', 'Hip Thrust', false, 'Sırt bench''e yaslanarak, bar kalça üzerindeyken kalça yukarı itilir.'),
    ('bacak', 'glute_bridge', 'Glute Bridge', true, 'Sırt üstü yatarak, ayaklar yerdeyken kalça yukarı kaldırılır.'),
    ('bacak', 'step_up', 'Sehpaya Çıkma (Step-up)', false, 'Bir bacakla yüksek bir sehpaya çıkılıp diğer bacak yukarı taşınır, sonra kontrollü şekilde inilir.'),
    ('bacak', 'box_jump', 'Kutuya Sıçrama (Box Jump)', true, 'Çömelme pozisyonundan patlayıcı şekilde yukarı sıçrayıp bir kutunun üzerine iki ayakla iniş yapılır.'),
    ('bacak', 'wall_sit', 'Duvarda Oturma (Wall Sit)', true, 'Sırt duvara yaslı, dizler 90° açıda, sanki sandalyede oturur gibi pozisyon süre boyunca korunur.'),
    ('bacak', 'sissy_squat', 'Sissy Squat', false, 'Topuklar yerden kalkacak şekilde geriye doğru eğilerek sadece dizlerden çömelinir — quadriceps izolasyonu sağlar.'),
    ('bacak', 'nordic_curl', 'Nordic Hamstring Curl', true, 'Ayaklar sabitlenip diz üstü pozisyonda gövde kontrollü şekilde öne doğru indirilir — hamstring gücünü hedefler.'),
    ('bacak', 'pistol_squat', 'Tek Bacak Squat (Pistol Squat)', true, 'Bir bacak öne uzatılarak diğer bacakla tam çömelme yapılır — denge ve bacak gücü gerektirir.'),
    ('bacak', 'curtsy_lunge', 'Curtsy Lunge', false, 'Bir bacak diğerinin arkasından çapraz şekilde geriye adım atılarak çömelinir — kalça yan kaslarını hedefler.'),
    ('bacak', 'cable_kickback', 'Kablo Kickback (Glute Kickback)', false, 'Ayak bileğine bağlı kablo ile bacak geriye doğru itilir — kalça kasını izole eder.'),
    ('bacak', 'hip_adduction', 'İç Bacak Makinesi (Hip Adduction)', false, 'Makinede oturarak bacaklar içe doğru sıkıştırılır — iç bacak kaslarını hedefler.'),
    ('bacak', 'hip_abduction', 'Dış Bacak Makinesi (Hip Abduction)', false, 'Makinede oturarak bacaklar dışa doğru açılır — kalça yan kaslarını hedefler.'),
    ('bacak', 'jump_squat', 'Sıçramalı Squat (Jump Squat)', true, 'Squat pozisyonundan patlayıcı şekilde yukarı sıçranır, yumuşak inişle tekrar çömelinir.'),
    ('bacak', 'hip_thrust_single_leg', 'Tek Bacak Hip Thrust', false, 'Hip thrust hareketinin tek bacakla yapılan versiyonu — kalça asimetrisini giderir, denge gerektirir.'),
    ('bacak', 'copenhagen_plank', 'Copenhagen Plank (Adduktor)', true, 'Üst bacak bench üzerinde yan durularak yapılan plank varyasyonu — iç bacak (adduktor) kaslarını hedefler.'),
    ('kol', 'barbell_curl', 'Barbell Curl', false, 'Bar avuç içi yukarı bakacak şekilde tutulup dirsekler sabit tutularak yukarı kıvrılır.'),
    ('kol', 'bicep_curl', 'Bicep Curl (Dumbbell)', false, 'İki elde dambıl ile avuç içi yukarı bakacak şekilde curl hareketi yapılır.'),
    ('kol', 'hammer_curl', 'Hammer Curl', false, 'Dambıl çekiç tutuşuyla (avuç içleri birbirine bakar) kıvrılır — brakiyalis kasını hedefler.'),
    ('kol', 'concentration_curl', 'Konsantrasyon Curl', false, 'Oturarak, dirsek uyluğa yaslanıp tek kolla dambıl kıvrılır — tam izolasyon sağlar.'),
    ('kol', 'preacher_curl', 'Preacher Curl', false, 'Preacher sehpasında kol tam desteklenerek curl hareketi yapılır — sallanmayı engeller.'),
    ('kol', 'cable_curl', 'Kablo Curl (Cable Curl)', false, 'Kablo makinesinde alt makaradan tutamakla curl hareketi yapılır — sürekli gerginlik sağlar.'),
    ('kol', 'ez_bar_curl', 'EZ Bar Curl', false, 'Dalgalı EZ bar ile yapılan curl — bilek üzerindeki baskıyı azaltır.'),
    ('kol', 'reverse_curl', 'Ters Kavrama Curl (Reverse Curl)', false, 'Bar avuç içi aşağı bakacak şekilde tutulup kıvrılır — ön kol ve brakiyalis çalışır.'),
    ('kol', 'wrist_curl', 'Bilek Kıvırma (Wrist Curl)', false, 'Ön kol bir yüzeye yaslanarak bilek yukarı-aşağı kıvrılır — ön kol kaslarını hedefler.'),
    ('kol', 'tricep_extension', 'Triceps Extension (Overhead)', false, 'Dambıl baş üzerinde iki elle tutularak dirsekler bükülüp geri düzleştirilir.'),
    ('kol', 'skull_crusher', 'Skull Crusher (Lying Triceps Extension)', false, 'Sırt üstü yatarak bar/dambıl alına doğru indirilip dirsekler düzleştirilerek yukarı kaldırılır.'),
    ('kol', 'tricep_pushdown', 'Triceps Pushdown (Kablo)', false, 'Kablo üst makaradan tutamakla tutulup dirsekler sabit tutularak aşağı doğru itilir.'),
    ('kol', 'triceps_dips', 'Triceps Dips (Bench)', true, 'Bench kenarına eller dayanarak, gövde dik tutulup dirsekler bükülerek inilip çıkılır.'),
    ('kol', 'diamond_pushup', 'Elmas Şınav (Diamond Push-up)', true, 'Eller göğüs altında elmas şekli oluşturacak şekilde birleştirilerek şınav çekilir — triceps katılımı yüksektir.'),
    ('kol', 'zottman_curl', 'Zottman Curl', false, 'Curl yukarı avuç içi yukarı bakarak, aşağı avuç içi aşağı bakarak yapılır — hem biceps hem ön kolu hedefler.'),
    ('kol', 'drag_curl', 'Drag Curl', false, 'Bar gövdeye sürtünerek dirsekler geriye doğru hareket ettirilerek kıvrılır — biceps tepesini hedefler.'),
    ('kol', 'curl_21s', '21''ler Curl (21s)', false, 'Hareketin alt yarısında 7, üst yarısında 7, tam hareket genişliğinde 7 tekrar art arda yapılır.'),
    ('kol', 'rope_pushdown', 'İp ile Pushdown (Rope Pushdown)', false, 'Kablo ipiyle dirsekler sabit tutularak aşağı itilir, alt noktada ip uçları dışa açılır — triceps dış başını hedefler.'),
    ('kol', 'jm_press', 'JM Press', false, 'Close-grip bench press ile skull crusher arası bir hareket — bar çene hizasına doğru indirilir.'),
    ('kol', 'overhead_cable_extension', 'Kablo ile Baş Üzeri Extension', false, 'Kablo alt makaradan sırt dönük şekilde baş üzerinden tutulup dirsekler düzleştirilerek öne itilir.'),
    ('kol', 'spider_curl', 'Spider Curl', false, 'Eğik bench''e yüzükoyun uzanarak kollar aşağı sarkıtılıp curl hareketi yapılır — tam izolasyon sağlar.'),
    ('kol', 'close_grip_pushup', 'Dar Tutuş Şınav (Close-Grip Push-up)', true, 'Eller göğüs altında yakın tutularak yapılan şınav — triceps katılımı yüksektir.'),
    ('omuz', 'shoulder_press', 'Shoulder Press (Overhead Press)', false, 'Bar omuz hizasından baş üzerine doğru itilir.'),
    ('omuz', 'dumbbell_shoulder_press', 'Dambıl Shoulder Press', false, 'İki elde dambıl ile omuz hizasından baş üzerine itilir.'),
    ('omuz', 'arnold_press', 'Arnold Press', false, 'Dambıllar göğüs önünde avuç içi kendine bakacak şekilde başlanır; yukarı itilirken avuçlar dışa döner.'),
    ('omuz', 'military_press', 'Military Press (Ayakta Barbell Press)', false, 'Ayakta, bar göğüs hizasından baş üzerine doğru dik bir şekilde itilir.'),
    ('omuz', 'lateral_raise', 'Lateral Raise (Dumbbell)', false, 'Dambıllar yanlara doğru omuz hizasına kadar kaldırılır.'),
    ('omuz', 'cable_lateral_raise', 'Kablo Lateral Raise', false, 'Kablo alt makaradan, kol yana doğru omuz hizasına kadar kaldırılır — sürekli gerginlik sağlar.'),
    ('omuz', 'front_raise', 'Front Raise', false, 'Dambıl ya da bar öne doğru omuz hizasına kadar kaldırılır.'),
    ('omuz', 'plate_front_raise', 'Disk ile Front Raise', false, 'Bir disk iki elle tutularak öne doğru omuz hizasına kaldırılır.'),
    ('omuz', 'rear_delt_fly', 'Arka Omuz Kelebek (Rear Delt Fly)', false, 'Gövde öne eğik, dambıllar yanlara doğru açılarak arka omuz kasları çalıştırılır.'),
    ('omuz', 'upright_row', 'Upright Row', false, 'Bar/dambıl vücuda yakın tutularak çene hizasına kadar dikey olarak yukarı çekilir.'),
    ('omuz', 'cuban_press', 'Cuban Press', false, 'Lateral raise ile dış rotasyon ve press hareketi birleştirilir — omuz sağlığı için sıkça kullanılır.'),
    ('omuz', 'pike_pushup', 'Omuz Ağırlıklı Şınav (Pike Push-up)', true, 'Kalça yukarıda, vücut ters V şeklinde tutularak baş yere doğru indirilip itilir.'),
    ('omuz', 'handstand_pushup', 'Amuda Kalkarak Şınav (Handstand Push-up)', true, 'Duvara yaslanarak amuda kalkılır, kollar bükülüp baş yere yaklaştırılarak tekrar itilir.'),
    ('omuz', 'machine_shoulder_press', 'Omuz Presi Makinesi (Machine Shoulder Press)', false, 'Makinede oturarak tutamaklar baş üzerine doğru itilir — sabit bir hareket yolu sağlar.'),
    ('omuz', 'reverse_pec_deck', 'Ters Kelebek (Reverse Pec Deck)', false, 'Kelebek makinesinde ters yönde oturularak kollar arkaya doğru açılır — arka omuzu hedefler.'),
    ('omuz', 'landmine_lateral_raise', 'Landmine Lateral Raise', false, 'Bir ucu sabitlenmiş bar tek elle yana doğru omuz hizasına kaldırılır.'),
    ('omuz', 'kettlebell_push_press', 'Kettlebell Push Press', false, 'Hafif bir diz kırma-açma momentumuyla kettlebell omuzdan baş üzerine itilir.'),
    ('omuz', 'battle_ropes', 'Battle Ropes', true, 'İki ucu tutulan kalın halatlar art arda yukarı-aşağı dalgalandırılır — omuz dayanıklılığını hedefler.'),
    ('omuz', 'y_raise', 'Y Raise', false, 'Gövde öne eğik, dambıllar Y harfi çizecek şekilde çapraz yukarı kaldırılır — alt trapez ve omuzu hedefler.'),
    ('omuz', 'egyptian_lateral_raise', 'Egyptian Lateral Raise', false, 'Gövde yana eğik durularak yapılan tek kol lateral raise — hareket genişliğini artırır.'),
    ('omuz', 'seated_dumbbell_press', 'Oturarak Dambıl Press (Seated Dumbbell Press)', false, 'Dik sırt destekli bench''te oturarak iki elde dambıl omuz hizasından baş üzerine itilir.'),
    ('karin', 'plank', 'Plank', true, 'Önkollar ve ayak uçları yerde, vücut düz bir hat halinde tutularak süre boyunca pozisyon korunur.'),
    ('karin', 'side_plank', 'Yan Plank (Side Plank)', true, 'Tek önkol ve ayak yan yatarak yerde, vücut düz bir hat halinde tutularak süre boyunca pozisyon korunur.'),
    ('karin', 'crunch', 'Crunch', true, 'Sırt üstü yatarak dizler bükülü, omuzlar yerden hafifçe kaldırılıp karın sıkıştırılır.'),
    ('karin', 'bicycle_crunch', 'Bisiklet Crunch (Bicycle Crunch)', true, 'Sırt üstü yatarak dirsek karşı dize değecek şekilde bisiklet çevirir gibi dönüşümlü kıvrılır.'),
    ('karin', 'leg_raise', 'Bacak Kaldırma (Leg Raise)', true, 'Sırt üstü yatarak bacaklar düz tutulup yukarı kaldırılıp kontrollü indirilir.'),
    ('karin', 'hanging_leg_raise', 'Barda Asılı Bacak Kaldırma (Hanging Leg Raise)', true, 'Bara asılı pozisyonda bacaklar düz ya da dizden bükülü şekilde yukarı kaldırılır.'),
    ('karin', 'russian_twist', 'Russian Twist', true, 'Yerde yarı oturur pozisyonda gövde sağa-sola döndürülerek karın yan kasları çalıştırılır.'),
    ('karin', 'cable_woodchop', 'Kablo ile Woodchop (Cable Woodchop)', false, 'Kablo yüksek/alçak noktadan tutulup gövde döndürülerek çapraz şekilde çekilir — rotasyonel karın gücünü hedefler.'),
    ('karin', 'ab_wheel_rollout', 'Karın Tekerleği (Ab Wheel Rollout)', true, 'Diz üstü pozisyonda tekerlek öne doğru yuvarlanıp karın gerdirilir, sonra başlangıca dönülür.'),
    ('karin', 'situp', 'Mekik (Sit-up)', true, 'Sırt üstü yatarak dizler bükülü, gövde tamamen oturur pozisyona kadar kaldırılır.'),
    ('karin', 'vup', 'V-up', true, 'Sırt üstü yatarak kollar ve bacaklar aynı anda kaldırılıp vücut V harfi şeklini alır.'),
    ('karin', 'mountain_climber', 'Mountain Climber', true, 'Şınav pozisyonunda dizler dönüşümlü olarak göğse doğru hızlıca çekilir.'),
    ('karin', 'flutter_kicks', 'Flutter Kicks', true, 'Sırt üstü yatarak bacaklar düz tutulup küçük, hızlı yukarı-aşağı vuruşlar yapılır.'),
    ('karin', 'dead_bug', 'Dead Bug', true, 'Sırt üstü yatarak karşılıklı kol-bacak (sağ kol-sol bacak / sol kol-sağ bacak) kontrollü şekilde uzatılıp geri çekilir — kor stabilitesini hedefler.'),
    ('karin', 'pallof_press', 'Pallof Press', false, 'Kablo göğüs hizasında iki elle tutulup öne doğru itilir, gövdenin dönmesine karşı direnç gösterilir — rotasyonel stabiliteyi hedefler.'),
    ('karin', 'hollow_body_hold', 'Hollow Body Hold', true, 'Sırt üstü yatarak omuzlar ve bacaklar yerden kaldırılıp vücut hafif kavisli (hollow) pozisyonda tutulur.')
    ) as t(category, old_key, name, bodyweight, instructions)
  loop
    insert into public.fitness_exercises (club_id, category, name, bodyweight, description)
    values (null, rec.category, rec.name, rec.bodyweight, rec.instructions)
    returning id into new_id;

    update public.fitness_program_items set exercise_key = 'custom:' || new_id::text where exercise_key = rec.old_key;
    update public.fitness_measurements set exercise_key = 'custom:' || new_id::text where exercise_key = rec.old_key;
  end loop;
end $$;
