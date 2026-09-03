// Antrenörün fitness/kuvvet odasında sporculara uyguladığı yaygın
// egzersizler, vücut bölgesine göre kategorize edilmiş sabit bir katalog.
// Mobil uygulamadaki src/lib/fitnessExercises.ts ile birebir aynı veri —
// exercise "key" değerleri fitness_program_items / fitness_measurements
// tablolarında referans olarak kullanıldığı için mobil ile senkron kalmalı.

export type FitnessExercise = {
  key: string;
  name: string;
  bodyweight?: boolean; // true ise ağırlık alanı isteğe bağlıdır (ör. max tekrar testleri)
  instructions: string;
};

// Tailwind'in derleme zamanında sınıf adlarını tarayabilmesi için renkler
// sabit bir token adı (coral/teal/yellow/violet) olarak tutulur — asıl
// literal sınıf adları CATEGORY_COLOR_CLASSES içinde tanımlanır.
export type CategoryColorToken = "coral" | "teal" | "yellow" | "violet";

export type FitnessCategory = {
  key: string;
  label: string;
  icon: string;
  color: CategoryColorToken;
  exercises: FitnessExercise[];
};

export const CATEGORY_COLOR_CLASSES: Record<CategoryColorToken, { border: string; text: string; bg: string }> = {
  coral: { border: "border-coral", text: "text-coral", bg: "bg-coral/10" },
  teal: { border: "border-teal", text: "text-teal", bg: "bg-teal/10" },
  yellow: { border: "border-yellow", text: "text-yellow", bg: "bg-yellow/10" },
  violet: { border: "border-violet", text: "text-violet", bg: "bg-violet/10" },
};

export const FITNESS_CATEGORIES: FitnessCategory[] = [
  {
    key: "gogus",
    label: "Göğüs",
    icon: "🏋️",
    color: "coral",
    exercises: [
      { key: "bench_press", name: "Bench Press", instructions: "Düz bench'te sırt üstü yatarak bar omuz genişliğinden biraz geniş tutulur, göğüse değecek şekilde indirilip kontrollü olarak yukarı itilir." },
      { key: "incline_bench_press", name: "Eğik Bench Press (Incline)", instructions: "30-45° eğimli bench'te aynı bench press hareketi yapılır — üst göğüs kaslarını daha çok çalıştırır." },
      { key: "decline_bench_press", name: "Alçak Bench Press (Decline)", instructions: "Baş aşağı eğimli bench'te yapılan bench press — alt göğüs bölgesini hedefler." },
      { key: "dumbbell_bench_press", name: "Dambıl Bench Press", instructions: "Düz bench'te sırt üstü yatarak iki elde dambıl ile bench press yapılır, hareket genişliği barbelden fazladır." },
      { key: "incline_dumbbell_press", name: "Eğik Dambıl Press", instructions: "Eğimli bench'te dambıllarla yapılan press hareketi, üst göğüs ve ön omuzu hedefler." },
      { key: "chest_fly", name: "Chest Fly (Dumbbell)", instructions: "Düz bench'te sırt üstü yatarak dambıllar hafif bükülü kollarla yanlara açılır, göğüs hizasında birleştirilir." },
      { key: "cable_crossover", name: "Kablo Çapraz Çekiş (Cable Crossover)", instructions: "Kablo istasyonunda iki taraftan tutulup kollar öne doğru çapraz şekilde birleştirilir, göğüs sıkıştırılır." },
      { key: "pec_deck", name: "Kelebek Makinesi (Pec Deck)", instructions: "Makinede oturarak, kollar öne doğru kapatılıp göğüs kasları sıkıştırılır." },
      { key: "machine_chest_press", name: "Göğüs Presi Makinesi", instructions: "Makinede oturarak, tutamaklar öne doğru itilir — bench press'e benzer sabit bir hareket yolu sağlar." },
      { key: "close_grip_bench_press", name: "Dar Tutuş Bench Press", instructions: "Bench press'e benzer, ancak eller omuz genişliğinden dar tutularak yapılır — triceps katılımı artar." },
      { key: "floor_press", name: "Floor Press", instructions: "Yerde sırt üstü yatarak yapılan bench press — hareket genişliği dirsekler yere değene kadardır." },
      { key: "landmine_press", name: "Landmine Press", instructions: "Bir ucu sabitlenmiş bar, tek elle omuz hizasından çapraz şekilde yukarı ve öne itilir." },
      { key: "svend_press", name: "Svend Press", instructions: "İki disk göğüs önünde birbirine bastırılarak öne doğru itilir ve geri çekilir — sıkıştırma odaklı bir hareket." },
      { key: "pushup_max", name: "Şınav (Max Tekrar)", bodyweight: true, instructions: "Eller omuz genişliğinde yerde, vücut düz bir hat halinde tutularak göğüs yere yaklaşana kadar inilip itilir; 1 dakikada yapılabilen maksimum tekrar sayılır." },
      { key: "incline_pushup", name: "Yüksekten Şınav (Incline Push-up)", bodyweight: true, instructions: "Eller yüksek bir yüzeye (sehpa/bench) konularak yapılan şınav — normal şınavdan daha kolaydır." },
      { key: "decline_pushup", name: "Ayak Yüksekte Şınav (Decline Push-up)", bodyweight: true, instructions: "Ayaklar yüksek bir yüzeye konularak yapılan şınav — üst göğüs ve omuz katılımı artar." },
      { key: "chest_dips", name: "Paralelde Şınav (Göğüs Ağırlıklı Dips)", bodyweight: true, instructions: "Paralel barlarda gövde öne eğik tutularak inip çıkılır — gövde öne eğildikçe göğüs katılımı artar." },
      { key: "cable_fly_low_to_high", name: "Alt Kablo Çapraz (Low-to-High Cable Fly)", instructions: "Kablo alt makaradan tutulup üst göğüse doğru çapraz şekilde yukarı-içe çekilir — üst göğüs lifini hedefler." },
      { key: "cable_fly_high_to_low", name: "Üst Kablo Çapraz (High-to-Low Cable Fly)", instructions: "Kablo üst makaradan tutulup alt göğüse doğru çapraz şekilde aşağı-içe çekilir — alt göğüs lifini hedefler." },
      { key: "guillotine_press", name: "Guillotine Press", instructions: "Bar boyun/üst göğüs hizasına indirilerek yapılan bench press varyasyonu — dikkatli kontrol gerektirir." },
      { key: "smith_bench_press", name: "Smith Machine Bench Press", instructions: "Sabit rayla hareket eden Smith makinesinde yapılan bench press — denge ihtiyacını azaltır." },
      { key: "plyo_pushup", name: "Patlayıcı Şınav (Plyometric Push-up)", bodyweight: true, instructions: "Şınav sırasında eller yerden kalkacak kadar patlayıcı şekilde itilir — güç ve hız gelişimini hedefler." },
      { key: "around_the_world", name: "Around the World (Dambıl)", instructions: "İki dambıl gövde önünde geniş bir daire çizecek şekilde aşağıdan yukarı döndürülür — göğüs ve omuz esnekliğini çalıştırır." },
    ],
  },
  {
    key: "sirt",
    label: "Sırt",
    icon: "🧗",
    color: "teal",
    exercises: [
      { key: "deadlift", name: "Deadlift", instructions: "Bar yerden, sırt düz tutularak ve kalça geriye itilerek kaldırılır — tüm arka zincir kasları çalışır." },
      { key: "romanian_deadlift", name: "Romanian Deadlift (RDL)", instructions: "Dizler hafif bükülü tutularak bar kalçadan aşağı sarkıtılır, hamstring geriminde kontrollü inilip kalkılır." },
      { key: "sumo_deadlift", name: "Sumo Deadlift", instructions: "Ayaklar geniş, ayak uçları dışa dönük şekilde yapılan deadlift — kalça ve iç bacak katılımı artar." },
      { key: "bent_over_row", name: "Bent-Over Row", instructions: "Gövde öne eğik, sırt düz tutularak bar karın bölgesine doğru çekilir." },
      { key: "t_bar_row", name: "T-Bar Row", instructions: "T-bar sehpasında gövde öne eğik durularak bar göğüs/karın hizasına çekilir." },
      { key: "seated_cable_row", name: "Oturarak Kablo Çekişi (Seated Cable Row)", instructions: "Kablo makinesinde oturarak sırt dik tutulur, tutamak karın bölgesine doğru çekilir." },
      { key: "lat_pulldown", name: "Lat Pulldown", instructions: "Oturarak, geniş tutuşla bar göğüs üst hizasına doğru aşağı çekilir." },
      { key: "wide_grip_lat_pulldown", name: "Geniş Tutuş Lat Pulldown", instructions: "Lat pulldown'ın geniş tutuşlu versiyonu — sırt genişliğini hedefler." },
      { key: "close_grip_lat_pulldown", name: "Dar Tutuş Lat Pulldown", instructions: "Lat pulldown'ın dar/paralel tutuşlu versiyonu — sırt kalınlığını hedefler." },
      { key: "single_arm_dumbbell_row", name: "Tek Kol Dambıl Row", instructions: "Tek diz ve el bench üzerinde desteklenerek, diğer elde dambıl belden yukarı çekilir." },
      { key: "face_pull", name: "Face Pull", instructions: "Kablo yüz hizasında, iki elle dışa doğru çekilerek arka omuz ve üst sırt çalıştırılır." },
      { key: "hyperextension", name: "Sırt Ekstansiyonu (Hyperextension)", instructions: "Hyperextension sehpasında gövde öne eğilip sırt/kalça kaslarıyla yukarı kaldırılır." },
      { key: "good_morning", name: "Good Morning", instructions: "Bar omuzda, dizler hafif bükülü şekilde gövde öne eğilip kalça menteşesiyle yukarı doğrulunur." },
      { key: "shrugs", name: "Trapez Çekişi (Shrugs)", instructions: "Ellerde ağırlıkla omuzlar kulaklara doğru yukarı kaldırılıp indirilir — trapezi hedefler." },
      { key: "straight_arm_pulldown", name: "Düz Kol Pulldown (Cable Pullover)", instructions: "Kollar düz tutularak kablo yukarıdan aşağı, uyluğa doğru çekilir — lat izolasyonu sağlar." },
      { key: "pullup_max", name: "Barfiks (Max Tekrar)", bodyweight: true, instructions: "Bar geniş tutuşla tutulup çene barın üstüne çıkana kadar çekilir; yapılabilen maksimum tekrar sayılır." },
      { key: "chinup_max", name: "Ters Kavrama Barfiks (Chin-up)", bodyweight: true, instructions: "Bar ters (avuç içi kendine bakacak) tutuşla tutulup çekilir — biceps katılımı daha fazladır." },
      { key: "assisted_pullup", name: "Destekli Barfiks (Assisted Pull-up)", bodyweight: true, instructions: "Destek makinesi ya da bant yardımıyla ağırlığın bir kısmı azaltılarak barfiks hareketi tekrar edilir." },
      { key: "meadows_row", name: "Meadows Row", instructions: "Landmine bara yan durularak tek elle çekiş yapılır — sırt kalınlığını hedefler." },
      { key: "pendlay_row", name: "Pendlay Row", instructions: "Her tekrarda bar yere değecek şekilde, gövde yere paralele yakın tutularak patlayıcı bir çekiş yapılır." },
      { key: "machine_row", name: "Row Makinesi (Machine Row)", instructions: "Göğüs destekli row makinesinde tutamaklar vücuda doğru çekilir." },
      { key: "inverted_row", name: "Ters Row (Inverted Row)", bodyweight: true, instructions: "Alçak bir bara sırt üstü asılı pozisyonda, vücut düz tutularak göğüs bara doğru çekilir." },
      { key: "kroc_row", name: "Kroc Row", instructions: "Ağır bir dambılla, hafif momentum kullanılarak yapılan yüksek tekrarlı tek kol row." },
      { key: "rack_pull", name: "Rack Pull", instructions: "Bar diz altı yerine raf üzerinden başlatılarak yapılan kısmi deadlift — üst sırt ve tutuş gücünü hedefler." },
    ],
  },
  {
    key: "bacak",
    label: "Bacak",
    icon: "🦵",
    color: "yellow",
    exercises: [
      { key: "squat", name: "Squat (Back Squat)", instructions: "Bar sırt üstünde, ayaklar omuz genişliğinde açık şekilde kalça geriye ve aşağı itilerek çömelinir, sonra yukarı kalkılır." },
      { key: "front_squat", name: "Front Squat", instructions: "Bar ön omuzlarda tutularak yapılan squat — gövdeyi daha dik tutar, quadriceps katılımı artar." },
      { key: "goblet_squat", name: "Goblet Squat", instructions: "Tek bir dambıl/kettlebell göğüs önünde iki elle tutularak yapılan squat — başlangıç seviyesi için idealdir." },
      { key: "hack_squat", name: "Hack Squat", instructions: "Hack squat makinesinde sırt yaslanarak, bacaklarla itip çömelme hareketi yapılır." },
      { key: "leg_press", name: "Leg Press", instructions: "Leg press makinesinde sırt yaslanarak, platform bacaklarla itilir." },
      { key: "bulgarian_split_squat", name: "Bulgar Squat (Bulgarian Split Squat)", instructions: "Arka ayak yüksek bir yüzeye konularak, ön bacakla tek taraflı squat yapılır." },
      { key: "walking_lunge", name: "Yürüyerek Lunge (Walking Lunge)", instructions: "İleri adım atılarak çömelinir, sonra diğer bacakla ileri adımla devam edilir." },
      { key: "reverse_lunge", name: "Geri Adım Lunge (Reverse Lunge)", instructions: "Geriye doğru adım atılarak çömelme yapılır — dize daha az yük biner." },
      { key: "lunge", name: "Lunge (Dumbbell)", instructions: "Bir bacakla öne adım atılıp iki diz de 90°'ye yakın açılana kadar inilir, sonra başlangıca dönülür." },
      { key: "leg_extension", name: "Bacak Açma Makinesi (Leg Extension)", instructions: "Makinede oturarak, dizler düzleşene kadar bacaklar öne doğru kaldırılır." },
      { key: "leg_curl", name: "Bacak Çekme Makinesi (Leg Curl)", instructions: "Makinede yüzüstü ya da oturarak, topuklar kalçaya doğru bükülür." },
      { key: "calf_raise", name: "Calf Raise", instructions: "Ayakta durarak topuklar yerden kaldırılıp parmak uçlarında yükselinir." },
      { key: "seated_calf_raise", name: "Oturarak Calf Raise", instructions: "Oturarak yapılan calf raise — soleus kasını daha çok hedefler." },
      { key: "hip_thrust", name: "Hip Thrust", instructions: "Sırt bench'e yaslanarak, bar kalça üzerindeyken kalça yukarı itilir." },
      { key: "glute_bridge", name: "Glute Bridge", bodyweight: true, instructions: "Sırt üstü yatarak, ayaklar yerdeyken kalça yukarı kaldırılır." },
      { key: "step_up", name: "Sehpaya Çıkma (Step-up)", instructions: "Bir bacakla yüksek bir sehpaya çıkılıp diğer bacak yukarı taşınır, sonra kontrollü şekilde inilir." },
      { key: "box_jump", name: "Kutuya Sıçrama (Box Jump)", bodyweight: true, instructions: "Çömelme pozisyonundan patlayıcı şekilde yukarı sıçrayıp bir kutunun üzerine iki ayakla iniş yapılır." },
      { key: "wall_sit", name: "Duvarda Oturma (Wall Sit)", bodyweight: true, instructions: "Sırt duvara yaslı, dizler 90° açıda, sanki sandalyede oturur gibi pozisyon süre boyunca korunur." },
      { key: "sissy_squat", name: "Sissy Squat", instructions: "Topuklar yerden kalkacak şekilde geriye doğru eğilerek sadece dizlerden çömelinir — quadriceps izolasyonu sağlar." },
      { key: "nordic_curl", name: "Nordic Hamstring Curl", bodyweight: true, instructions: "Ayaklar sabitlenip diz üstü pozisyonda gövde kontrollü şekilde öne doğru indirilir — hamstring gücünü hedefler." },
      { key: "pistol_squat", name: "Tek Bacak Squat (Pistol Squat)", bodyweight: true, instructions: "Bir bacak öne uzatılarak diğer bacakla tam çömelme yapılır — denge ve bacak gücü gerektirir." },
      { key: "curtsy_lunge", name: "Curtsy Lunge", instructions: "Bir bacak diğerinin arkasından çapraz şekilde geriye adım atılarak çömelinir — kalça yan kaslarını hedefler." },
      { key: "cable_kickback", name: "Kablo Kickback (Glute Kickback)", instructions: "Ayak bileğine bağlı kablo ile bacak geriye doğru itilir — kalça kasını izole eder." },
      { key: "hip_adduction", name: "İç Bacak Makinesi (Hip Adduction)", instructions: "Makinede oturarak bacaklar içe doğru sıkıştırılır — iç bacak kaslarını hedefler." },
      { key: "hip_abduction", name: "Dış Bacak Makinesi (Hip Abduction)", instructions: "Makinede oturarak bacaklar dışa doğru açılır — kalça yan kaslarını hedefler." },
      { key: "jump_squat", name: "Sıçramalı Squat (Jump Squat)", bodyweight: true, instructions: "Squat pozisyonundan patlayıcı şekilde yukarı sıçranır, yumuşak inişle tekrar çömelinir." },
    ],
  },
  {
    key: "kol",
    label: "Kol",
    icon: "💪",
    color: "violet",
    exercises: [
      { key: "barbell_curl", name: "Barbell Curl", instructions: "Bar avuç içi yukarı bakacak şekilde tutulup dirsekler sabit tutularak yukarı kıvrılır." },
      { key: "bicep_curl", name: "Bicep Curl (Dumbbell)", instructions: "İki elde dambıl ile avuç içi yukarı bakacak şekilde curl hareketi yapılır." },
      { key: "hammer_curl", name: "Hammer Curl", instructions: "Dambıl çekiç tutuşuyla (avuç içleri birbirine bakar) kıvrılır — brakiyalis kasını hedefler." },
      { key: "concentration_curl", name: "Konsantrasyon Curl", instructions: "Oturarak, dirsek uyluğa yaslanıp tek kolla dambıl kıvrılır — tam izolasyon sağlar." },
      { key: "preacher_curl", name: "Preacher Curl", instructions: "Preacher sehpasında kol tam desteklenerek curl hareketi yapılır — sallanmayı engeller." },
      { key: "cable_curl", name: "Kablo Curl (Cable Curl)", instructions: "Kablo makinesinde alt makaradan tutamakla curl hareketi yapılır — sürekli gerginlik sağlar." },
      { key: "ez_bar_curl", name: "EZ Bar Curl", instructions: "Dalgalı EZ bar ile yapılan curl — bilek üzerindeki baskıyı azaltır." },
      { key: "reverse_curl", name: "Ters Kavrama Curl (Reverse Curl)", instructions: "Bar avuç içi aşağı bakacak şekilde tutulup kıvrılır — ön kol ve brakiyalis çalışır." },
      { key: "wrist_curl", name: "Bilek Kıvırma (Wrist Curl)", instructions: "Ön kol bir yüzeye yaslanarak bilek yukarı-aşağı kıvrılır — ön kol kaslarını hedefler." },
      { key: "tricep_extension", name: "Triceps Extension (Overhead)", instructions: "Dambıl baş üzerinde iki elle tutularak dirsekler bükülüp geri düzleştirilir." },
      { key: "skull_crusher", name: "Skull Crusher (Lying Triceps Extension)", instructions: "Sırt üstü yatarak bar/dambıl alına doğru indirilip dirsekler düzleştirilerek yukarı kaldırılır." },
      { key: "tricep_pushdown", name: "Triceps Pushdown (Kablo)", instructions: "Kablo üst makaradan tutamakla tutulup dirsekler sabit tutularak aşağı doğru itilir." },
      { key: "triceps_dips", name: "Triceps Dips (Bench)", bodyweight: true, instructions: "Bench kenarına eller dayanarak, gövde dik tutulup dirsekler bükülerek inilip çıkılır." },
      { key: "diamond_pushup", name: "Elmas Şınav (Diamond Push-up)", bodyweight: true, instructions: "Eller göğüs altında elmas şekli oluşturacak şekilde birleştirilerek şınav çekilir — triceps katılımı yüksektir." },
      { key: "zottman_curl", name: "Zottman Curl", instructions: "Curl yukarı avuç içi yukarı bakarak, aşağı avuç içi aşağı bakarak yapılır — hem biceps hem ön kolu hedefler." },
      { key: "drag_curl", name: "Drag Curl", instructions: "Bar gövdeye sürtünerek dirsekler geriye doğru hareket ettirilerek kıvrılır — biceps tepesini hedefler." },
      { key: "curl_21s", name: "21'ler Curl (21s)", instructions: "Hareketin alt yarısında 7, üst yarısında 7, tam hareket genişliğinde 7 tekrar art arda yapılır." },
      { key: "rope_pushdown", name: "İp ile Pushdown (Rope Pushdown)", instructions: "Kablo ipiyle dirsekler sabit tutularak aşağı itilir, alt noktada ip uçları dışa açılır — triceps dış başını hedefler." },
      { key: "jm_press", name: "JM Press", instructions: "Close-grip bench press ile skull crusher arası bir hareket — bar çene hizasına doğru indirilir." },
      { key: "overhead_cable_extension", name: "Kablo ile Baş Üzeri Extension", instructions: "Kablo alt makaradan sırt dönük şekilde baş üzerinden tutulup dirsekler düzleştirilerek öne itilir." },
    ],
  },
  {
    key: "omuz",
    label: "Omuz",
    icon: "🤸",
    color: "coral",
    exercises: [
      { key: "shoulder_press", name: "Shoulder Press (Overhead Press)", instructions: "Bar omuz hizasından baş üzerine doğru itilir." },
      { key: "dumbbell_shoulder_press", name: "Dambıl Shoulder Press", instructions: "İki elde dambıl ile omuz hizasından baş üzerine itilir." },
      { key: "arnold_press", name: "Arnold Press", instructions: "Dambıllar göğüs önünde avuç içi kendine bakacak şekilde başlanır; yukarı itilirken avuçlar dışa döner." },
      { key: "military_press", name: "Military Press (Ayakta Barbell Press)", instructions: "Ayakta, bar göğüs hizasından baş üzerine doğru dik bir şekilde itilir." },
      { key: "lateral_raise", name: "Lateral Raise (Dumbbell)", instructions: "Dambıllar yanlara doğru omuz hizasına kadar kaldırılır." },
      { key: "cable_lateral_raise", name: "Kablo Lateral Raise", instructions: "Kablo alt makaradan, kol yana doğru omuz hizasına kadar kaldırılır — sürekli gerginlik sağlar." },
      { key: "front_raise", name: "Front Raise", instructions: "Dambıl ya da bar öne doğru omuz hizasına kadar kaldırılır." },
      { key: "plate_front_raise", name: "Disk ile Front Raise", instructions: "Bir disk iki elle tutularak öne doğru omuz hizasına kaldırılır." },
      { key: "rear_delt_fly", name: "Arka Omuz Kelebek (Rear Delt Fly)", instructions: "Gövde öne eğik, dambıllar yanlara doğru açılarak arka omuz kasları çalıştırılır." },
      { key: "upright_row", name: "Upright Row", instructions: "Bar/dambıl vücuda yakın tutularak çene hizasına kadar dikey olarak yukarı çekilir." },
      { key: "cuban_press", name: "Cuban Press", instructions: "Lateral raise ile dış rotasyon ve press hareketi birleştirilir — omuz sağlığı için sıkça kullanılır." },
      { key: "pike_pushup", name: "Omuz Ağırlıklı Şınav (Pike Push-up)", bodyweight: true, instructions: "Kalça yukarıda, vücut ters V şeklinde tutularak baş yere doğru indirilip itilir." },
      { key: "handstand_pushup", name: "Amuda Kalkarak Şınav (Handstand Push-up)", bodyweight: true, instructions: "Duvara yaslanarak amuda kalkılır, kollar bükülüp baş yere yaklaştırılarak tekrar itilir." },
      { key: "machine_shoulder_press", name: "Omuz Presi Makinesi (Machine Shoulder Press)", instructions: "Makinede oturarak tutamaklar baş üzerine doğru itilir — sabit bir hareket yolu sağlar." },
      { key: "reverse_pec_deck", name: "Ters Kelebek (Reverse Pec Deck)", instructions: "Kelebek makinesinde ters yönde oturularak kollar arkaya doğru açılır — arka omuzu hedefler." },
      { key: "landmine_lateral_raise", name: "Landmine Lateral Raise", instructions: "Bir ucu sabitlenmiş bar tek elle yana doğru omuz hizasına kaldırılır." },
      { key: "kettlebell_push_press", name: "Kettlebell Push Press", instructions: "Hafif bir diz kırma-açma momentumuyla kettlebell omuzdan baş üzerine itilir." },
      { key: "battle_ropes", name: "Battle Ropes", bodyweight: true, instructions: "İki ucu tutulan kalın halatlar art arda yukarı-aşağı dalgalandırılır — omuz dayanıklılığını hedefler." },
      { key: "y_raise", name: "Y Raise", instructions: "Gövde öne eğik, dambıllar Y harfi çizecek şekilde çapraz yukarı kaldırılır — alt trapez ve omuzu hedefler." },
    ],
  },
  {
    key: "karin",
    label: "Karın",
    icon: "🔥",
    color: "teal",
    exercises: [
      { key: "plank", name: "Plank", bodyweight: true, instructions: "Önkollar ve ayak uçları yerde, vücut düz bir hat halinde tutularak süre boyunca pozisyon korunur." },
      { key: "side_plank", name: "Yan Plank (Side Plank)", bodyweight: true, instructions: "Tek önkol ve ayak yan yatarak yerde, vücut düz bir hat halinde tutularak süre boyunca pozisyon korunur." },
      { key: "crunch", name: "Crunch", bodyweight: true, instructions: "Sırt üstü yatarak dizler bükülü, omuzlar yerden hafifçe kaldırılıp karın sıkıştırılır." },
      { key: "bicycle_crunch", name: "Bisiklet Crunch (Bicycle Crunch)", bodyweight: true, instructions: "Sırt üstü yatarak dirsek karşı dize değecek şekilde bisiklet çevirir gibi dönüşümlü kıvrılır." },
      { key: "leg_raise", name: "Bacak Kaldırma (Leg Raise)", bodyweight: true, instructions: "Sırt üstü yatarak bacaklar düz tutulup yukarı kaldırılıp kontrollü indirilir." },
      { key: "hanging_leg_raise", name: "Barda Asılı Bacak Kaldırma (Hanging Leg Raise)", bodyweight: true, instructions: "Bara asılı pozisyonda bacaklar düz ya da dizden bükülü şekilde yukarı kaldırılır." },
      { key: "russian_twist", name: "Russian Twist", bodyweight: true, instructions: "Yerde yarı oturur pozisyonda gövde sağa-sola döndürülerek karın yan kasları çalıştırılır." },
      { key: "cable_woodchop", name: "Kablo ile Woodchop (Cable Woodchop)", instructions: "Kablo yüksek/alçak noktadan tutulup gövde döndürülerek çapraz şekilde çekilir — rotasyonel karın gücünü hedefler." },
      { key: "ab_wheel_rollout", name: "Karın Tekerleği (Ab Wheel Rollout)", bodyweight: true, instructions: "Diz üstü pozisyonda tekerlek öne doğru yuvarlanıp karın gerdirilir, sonra başlangıca dönülür." },
      { key: "situp", name: "Mekik (Sit-up)", bodyweight: true, instructions: "Sırt üstü yatarak dizler bükülü, gövde tamamen oturur pozisyona kadar kaldırılır." },
      { key: "vup", name: "V-up", bodyweight: true, instructions: "Sırt üstü yatarak kollar ve bacaklar aynı anda kaldırılıp vücut V harfi şeklini alır." },
      { key: "mountain_climber", name: "Mountain Climber", bodyweight: true, instructions: "Şınav pozisyonunda dizler dönüşümlü olarak göğse doğru hızlıca çekilir." },
      { key: "flutter_kicks", name: "Flutter Kicks", bodyweight: true, instructions: "Sırt üstü yatarak bacaklar düz tutulup küçük, hızlı yukarı-aşağı vuruşlar yapılır." },
      { key: "dead_bug", name: "Dead Bug", bodyweight: true, instructions: "Sırt üstü yatarak karşılıklı kol-bacak (sağ kol-sol bacak / sol kol-sağ bacak) kontrollü şekilde uzatılıp geri çekilir — kor stabilitesini hedefler." },
    ],
  },
];

export function getFitnessCategory(key: string): FitnessCategory | undefined {
  return FITNESS_CATEGORIES.find((c) => c.key === key);
}

export function getFitnessExercise(exerciseKey: string): { exercise: FitnessExercise; category: FitnessCategory } | undefined {
  for (const category of FITNESS_CATEGORIES) {
    const exercise = category.exercises.find((e) => e.key === exerciseKey);
    if (exercise) return { exercise, category };
  }
  return undefined;
}
