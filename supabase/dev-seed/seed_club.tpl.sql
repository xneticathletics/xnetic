set local statement_timeout = 0;
do $seed$
declare
  v_idx int := __IDX__;
  v_name text := '__NAME__';
  v_slug text := '__SLUG__';
  v_admin_pw text := '__ADMINPW__';
  v_admin_name text := '__ADMINNAME__';
  v_days int := __DAYS__;
  v_nath int := __NATH__;
  v_branches text[] := array[__BRANCHES__];
  v_nb int;
  v_club uuid := gen_random_uuid();
  v_admin uuid := gen_random_uuid();
  v_admin_auth uuid := gen_random_uuid();
  v_pw_common text := extensions.crypt('Deneme123', extensions.gen_salt('bf', 6));
  v_pw_admin text := extensions.crypt(v_admin_pw, extensions.gen_salt('bf', 6));
  v_today date := current_date;
  v_created timestamptz;
  v_start date;
  v_short text := split_part(v_name, ' ', 1);
  v_ncoach int;
  v_gpb int;
  v_ages int[];
  v_ngrp int;
  males text[] := array['Ahmet','Mehmet','Mustafa','Ali','Hüseyin','Emre','Burak','Caner','Kaan','Ege','Berk','Yusuf','Onur','Serkan','Tolga','Volkan','Barış','Cem','Eren','Gökhan','Arda','Efe','Kerem','Mert','Ozan','Umut','Yiğit','Alperen','Batuhan','Deniz','Furkan','Hakan','İbrahim','Kemal','Metehan','Oğuz','Poyraz','Rüzgar','Tuna','Utku'];
  females text[] := array['Ayşe','Fatma','Zeynep','Elif','Merve','Selin','Ece','Buse','Gizem','Aslı','Pınar','Ceren','İrem','Nazlı','Sude','Dilara','Melis','Sena','Yağmur','Beren','Defne','Ela','Nehir','Azra','Bengisu','Damla','Ecrin','Hazal','Ilgın','Lale','Miray','Naz','Özge','Rana','Simge','Tuğçe','Yasemin','Zehra','Asya','Duru'];
  lasts text[] := array['Yılmaz','Kaya','Demir','Çelik','Şahin','Yıldız','Aydın','Öztürk','Arslan','Doğan','Koç','Kurt','Özdemir','Aktaş','Polat','Şen','Güneş','Türk','Erdoğan','Bulut','Aslan','Yıldırım','Çetin','Kara','Koçak','Aksoy','Erdem','Güler','Özkan','Kılıç','Avcı','Bozkurt','Tekin','Acar','Uçar','Sarı','Ateş','Çakır','Duman','Ünal','Karaca','Işık','Bilgin','Ergün','Korkmaz','Yalçın','Keskin','Özcan','Turan','Şimşek','Demirci','Toprak','Aygün','Balcı','Vural','Uysal','Karataş','Kaplan','Yaman','Tunç','Bayram','Erol','Uzun','Genç','Yaşar','Yavuz','Yücel','Sever','Onat','Aktürk','Aral','Gündüz','Ilgaz','Beyaz','Ekinci','Kutlu','Alkan','Batur','Cengiz','Doğru','Dinç','Ergin','Esen','Güven','İnan','Kartal','Metin','Nalbant','Orhan','Pamuk','Sezer','Tuna','Uygun','Varol','Yurt','Zengin','Akman','Baykal','Coşkun','Deveci','Karadağ','Bektaş','Sağlam','Çevik','Yorulmaz','Yurtsever','Tokgöz','Sancak','Bilir','Erbil','Kahraman','Görgün','Tuncel','Şeker','Odabaşı','Gürbüz','Bostancı','Aybar','Baysal','Demirtaş','Aycan','Aydemir','Karabulut','Karagöz','Kandemir','Solmaz','Yurdakul','Tozlu','Yeşil','Kızılkaya','Morova','Tekinalp','Şentürk','Bozdağ','Aslantaş','Erkoç','Gökçe','Bulur','Sarıkaya','Kurttepe','Aktepe','Yalman','Baysan','Çakmak','Kutluk','Demirok','Yeter','Akgün','Bayraktar','Karaman','Alagöz','Boztepe','Çınar','Doruk','Elmas','Fidan','Gezer','Hasgül','İpek','Kaçar','Levent','Mercan','Nural','Onbaşı','Pekcan','Reis','Sipahi','Taşkın','Ulusoy','Vardar','Yorgun','Zaralı','Akbulut','Baştürk','Ciğerci','Değirmenci','Erkal','Fırat','Girgin','Halıcıoğlu','Işıklı','Kalkan','Manav','Necipoğlu','Oymak','Peker','Sunar','Tarhan','Uçkun','Yener'];
  clasts text[] := array['Yılmazer','Kayacan','Demiröz','Çelikbaş','Şahinkaya','Yıldıztepe','Aydınlı','Öztürkmen','Arslanoğlu','Doğançay','Koçyiğit','Kurtoğlu','Özdemirci','Aktaşoğlu','Polater','Erdoğmuş','Bulutcan','Aslanbey','Yıldırımer','Çetinkaya','Karakaş','Koçaklı','Aksoylu','Erdemli','Güleryüz','Özkanlı','Kılıçer','Avcıoğlu','Bozkurtlu','Tekinsoy','Acarlı','Uçarer','Sarıoğlu','Atalay','Çakıroğlu'];
  pm text[] := array['Merhaba hocam, yarınki antrenmana katılamayacağız.','Hocam antrenman saati değişti mi?','Bu haftaki antrenman ne zaman bitiyor?','Aidat ödemesini yaptım, kontrol edebilir misiniz?','Turnuva için hazırlanması gereken bir şey var mı?','Hocam çocuğum son antrenmanda nasıldı?','Teşekkürler hocam, iyi çalışmalar.','Formayı ne zaman alabiliriz?'];
  cm text[] := array['Merhaba, tamam not aldım, geçmiş olsun.','Saatte değişiklik yok, aynı saatte devam ediyoruz.','Antrenman 18:30 gibi bitiyor.','Ödemeniz görünüyor, teşekkürler.','Su ve havlu yeterli, başka bir şeye gerek yok.','Gayet iyi gidiyor, gelişim var.','Rica ederim, iyi günler.','Mağazadan sipariş verebilirsiniz.'];
  topics text[] := array['Isınma ve temel teknik','Kondisyon çalışması','Taktik antrenmanı','Küçük oyun uygulaması','Dayanıklılık çalışması','Sürat ve çeviklik','Esneklik ve toparlanma','Beceri geliştirme'];
  schools text[] := array['Atatürk İlkokulu','Cumhuriyet Ortaokulu','Gazi İlkokulu','Fatih Ortaokulu','Yıldız Anadolu Lisesi','Mimar Sinan İlkokulu','İnönü Ortaokulu','Barış İlkokulu','Zafer Ortaokulu','Şehit Öğretmen İlkokulu'];
begin
  v_created := now() - make_interval(days => v_days);
  v_start := v_created::date;
  v_nb := array_length(v_branches, 1);
  v_ncoach := 3 + (v_idx % 2);
  v_gpb := case when v_nb <= 2 then 8 when v_nb = 3 then 6 else 4 end;
  v_ages := case v_gpb when 8 then array[10,12,14,16] when 6 then array[10,12,14] else array[12,14] end;

  -- ===== Kulüp =====
  insert into clubs (id, name, branch, plan, contact_email, contact_phone, created_at, updated_at, bank_info, bank_account_name, bank_iban)
  values (v_club, v_name, v_branches[1], 'pro', 'iletisim.' || v_slug || '@xnetic.local',
          '05' || lpad(((v_idx * 7919003) % 1000000000)::text, 9, '0'), v_created, v_created,
          'Aidat ödemelerinde açıklamaya sporcu adını yazınız.', v_name,
          'TR' || (select string_agg((floor(random() * 10))::int::text, '') from generate_series(1, 24)));
  insert into club_settings (club_id, standard_fee_try, membership_freeze_enabled) values (v_club, 1500, true);
  insert into club_subscriptions (club_id, billing_period, status, started_at, created_at, amount_try, current_period_end)
  values (v_club, 'yearly', 'active', v_created, v_created, 0, v_created + interval '1 year');
  insert into club_subscription_history (club_id, status, billing_period, amount_try, changed_at) values (v_club, 'active', 'yearly', 0, v_created);

  -- ===== Branşlar =====
  create temp table t_br on commit drop as
  select gen_random_uuid() as id, b as name, ord::int as ord,
         (b = any (array['Yüzme','Cimnastik','Atletizm','Tenis','Judo','Karate','Masa Tenisi'])) as is_ind,
         (1100 + ((ord * 250 + v_idx * 50) % 1500))::numeric as fee
  from unnest(v_branches) with ordinality as x(b, ord);
  insert into branches (id, club_id, name, created_at, is_individual, standard_fee_try)
  select id, v_club, name, v_created, is_ind, fee from t_br;

  -- ===== Salonlar =====
  create temp table t_ven on commit drop as
  select gen_random_uuid() as id, n, case n when 1 then 'Ana Spor Salonu' else 'Kapalı Spor Salonu' end as vname,
         case n
           when 1 then array(select id from t_br where ord <= ceil(v_nb / 2.0))
           else coalesce(nullif(array(select id from t_br where ord > ceil(v_nb / 2.0)), '{}'), array(select id from t_br))
         end as bids
  from generate_series(1, 2) n;
  insert into venues (id, club_id, name, address, capacity, created_at, branch_ids)
  select id, v_club, vname, 'Merkez Mah. Spor Cad. No:' || (v_idx + n), 150 + n * 50, v_created, bids from t_ven;

  -- ===== Antrenörler =====
  create temp table t_coach on commit drop as
  select gen_random_uuid() as uid, gen_random_uuid() as auth_id, br.id as branch_id, br.name as branch, br.ord as bord, c as cord,
         ((br.ord - 1) * v_ncoach + c)::int as seq,
         case when ((br.ord + c + v_idx) % 2) = 0 then 'erkek' else 'kadin' end as gender
  from t_br br cross join generate_series(1, v_ncoach) c;

  -- ===== Gruplar =====
  create temp table t_grp on commit drop as
  select gen_random_uuid() as id, br.id as branch_id, br.name as branch, br.ord as bord, a as age, g as gname_g,
         'U' || a || ' ' || g as gname,
         case when a <= 12 then 'spor_okulu'::athlete_type else 'musabik'::athlete_type end as atype,
         (row_number() over (partition by br.id order by a, g) - 1)::int as gord
  from t_br br cross join unnest(v_ages) a cross join unnest(array['Erkek','Kız']) g;
  alter table t_grp add column gseq int, add column head uuid, add column asst uuid, add column venue uuid, add column d1 int, add column d2 int, add column st time;
  update t_grp set gseq = s.rn from (select id, row_number() over (order by bord, gord)::int as rn from t_grp) s where s.id = t_grp.id;
  update t_grp g set
    head = (select c.uid from t_coach c where c.branch_id = g.branch_id and c.cord = (g.gord % v_ncoach) + 1),
    asst = (select c.uid from t_coach c where c.branch_id = g.branch_id and c.cord = ((g.gord + 1) % v_ncoach) + 1),
    venue = (select id from t_ven where n = case when g.bord <= ceil(v_nb / 2.0) then 1 else 2 end);
  update t_grp g set
    d1 = (array[0,1,4])[1 + (s.vord / 4) % 3],
    d2 = (array[2,3,6])[1 + (s.vord / 4) % 3],
    st = (array['15:30','17:00','18:30','20:00'])[1 + s.vord % 4]::time
  from (select id, (row_number() over (partition by venue order by gseq) - 1)::int as vord from t_grp) s where s.id = g.id;
  select count(*) into v_ngrp from t_grp;

  -- ===== Sporcular (sporcu + veli hesabı) =====
  create temp table t_ath on commit drop as
  select i, gen_random_uuid() as aid, gen_random_uuid() as a_uid, gen_random_uuid() as a_auth, gen_random_uuid() as p_uid, gen_random_uuid() as p_auth,
         t.id as gid, t.branch, t.bord, t.age, t.gname, t.atype, t.head,
         case when t.gname_g = 'Erkek' then 'erkek' else 'kadin' end as gender
  from generate_series(1, v_nath) i
  join t_grp t on t.gseq = ((i - 1) % v_ngrp) + 1;
  alter table t_ath add column fname text, add column lname text, add column pname text, add column pgender text, add column bdate date,
    add column reg date, add column h numeric, add column w numeric, add column tal numeric, add column prop numeric, add column ast text,
    add column m1 date, add column m2 date;
  update t_ath set
    fname = case gender when 'erkek' then males[(i * 3 + v_idx * 7) % 40 + 1] else females[(i * 3 + v_idx * 5) % 40 + 1] end,
    lname = lasts[(i * 7 + v_idx * 11) % 190 + 1],
    pgender = case when i % 2 = 0 then 'kadin' else 'erkek' end,
    bdate = make_date(extract(year from v_today)::int - (age - (i % 2)), 1 + (i * 5 + v_idx) % 12, 1 + (i * 11) % 28),
    reg = v_start + (power(random(), 2) * (v_today - v_start))::int,
    tal = 0.93 + random() * 0.14,
    prop = 0.62 + random() * 0.36,
    ast = case when random() < 0.04 then 'passive' else 'active' end;
  update t_ath set
    pname = case pgender when 'kadin' then females[(i * 11 + v_idx * 3) % 40 + 1] else males[(i * 11 + v_idx) % 40 + 1] end || ' ' || lname,
    h = round(((75 + 6.2 * age) * (case gender when 'kadin' then 0.985 else 1 end) * (0.96 + random() * 0.08))::numeric, 1),
    w = round(((2.7 * age + 5) * (0.9 + random() * 0.2))::numeric, 1),
    m1 = least(v_today, reg + 2);
  update t_ath set m2 = least(v_today, m1 + 14 + (i * 3) % 30);

  -- ===== Hesaplar (auth + users) =====
  create temp table t_acc on commit drop as
  select v_admin as uid, v_admin_auth as auth_id, 'club_admin'::user_role as role, 'usr' || v_slug || 'admin@xnetic.local' as email,
         v_admin_name as name, '05' || lpad(((v_idx * 1000003 + 1) % 1000000000)::text, 9, '0') as phone,
         'erkek' as gender, make_date(1978 + v_idx % 12, 1 + v_idx % 12, 1 + v_idx % 27) as bdate, v_pw_admin as pw, v_created as created
  union all
  select uid, auth_id, 'coach'::user_role, 'usr' || v_slug || case when cord = 1 then 'k' else 'a' end || seq || '@xnetic.local',
         case gender when 'erkek' then males[(seq * 5 + v_idx * 3) % 40 + 1] else females[(seq * 5 + v_idx * 3) % 40 + 1] end || ' ' || clasts[(seq * 3 + v_idx) % 35 + 1],
         '05' || lpad(((v_idx * 1000003 + 100 + seq * 7919) % 1000000000)::text, 9, '0'),
         gender, make_date(1979 + (seq * 3 + v_idx) % 18, 1 + seq % 12, 1 + (seq * 7) % 27), v_pw_common, v_created + interval '2 hours'
  from t_coach
  union all
  select a_uid, a_auth, 'athlete'::user_role, 'usr' || v_slug || 's' || i || '@xnetic.local', fname || ' ' || lname, null, gender, bdate, v_pw_common, reg::timestamptz
  from t_ath
  union all
  select p_uid, p_auth, 'parent'::user_role, 'usr' || v_slug || 'v' || i || '@xnetic.local', pname,
         '05' || lpad(((v_idx * 1000003 + 5000 + i * 104729) % 1000000000)::text, 9, '0'), pgender,
         make_date(1978 + i % 16, 1 + i % 12, 1 + (i * 3) % 27), v_pw_common, reg::timestamptz
  from t_ath;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                          created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change,
                          email_change_token_current, reauthentication_token, phone_change, phone_change_token, is_sso_user, is_anonymous)
  select '00000000-0000-0000-0000-000000000000', auth_id, 'authenticated', 'authenticated', email, pw, created,
         '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, created, created, '', '', '', '', '', '', '', '', false, false
  from t_acc;
  insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
  select auth_id::text, auth_id, jsonb_build_object('sub', auth_id::text, 'email', email, 'email_verified', true, 'phone_verified', false), 'email', created, created
  from t_acc;
  insert into users (id, club_id, auth_user_id, name, email, phone, role, is_active, created_at, updated_at, birth_date, onboarding_completed, must_change_password, gender)
  select uid, v_club, auth_id, name, email, phone, role, true, created, created, bdate, true, false, gender from t_acc;
  insert into user_consents (user_id, consent_type, accepted_at)
  select uid, ct, created from t_acc cross join unnest(array['kvkk','foto_video','sorumluluk']) ct;

  -- ===== Antrenör-branş, koordinatör, salon yetkilisi, gruplar =====
  insert into coach_branches (coach_id, branch_id, level, license_no, experience_years, hire_date)
  select uid, branch_id, case when cord = 1 then 3 when cord = 2 then 2 else 1 end, 'ANT-' || v_idx || '-' || seq,
         case when cord = 1 then 12 when cord = 2 then 8 else 2 + seq % 5 end, v_start - (30 + (seq * 37) % 400)
  from t_coach;
  update branches b set coordinator_user_id = c.uid from t_coach c where c.branch_id = b.id and c.cord = 1 and b.club_id = v_club;
  insert into venue_coaches (club_id, venue_id, coach_id, created_at)
  select distinct v_club, v.id, c.uid, v_created from t_ven v join t_coach c on c.cord = 2 and c.branch_id = any (v.bids);
  insert into groups (id, club_id, branch, name, head_coach_id, created_at, venue_id, athlete_type, fixed_schedule)
  select id, v_club, branch, gname, head, v_created, venue, atype, false from t_grp;
  insert into group_coaches (group_id, coach_id, permission_level)
  select id, asst, 'assistant_coach' from t_grp where asst is distinct from head;

  -- ===== Sporcu kayıtları =====
  insert into athletes (id, club_id, parent_user_id, group_id, full_name, birth_date, height_cm, weight_kg, license_no, school, jersey_size, status,
                        registered_at, created_at, updated_at, parent_name, parent_phone, athlete_type, jersey_number, branch, athlete_user_id, gender)
  select a.aid, v_club, a.p_uid, a.gid, a.fname || ' ' || a.lname, a.bdate, a.h, a.w,
         case when a.atype = 'musabik' then 'LSN-' || v_idx || '-' || lpad(a.i::text, 4, '0') end,
         schools[1 + (a.i * 3 + v_idx) % 10],
         case when a.atype = 'musabik' then (array['S','M','L','XL'])[1 + a.i % 4] end,
         a.ast::athlete_status, a.reg, a.reg::timestamptz, a.reg::timestamptz, a.pname,
         (select phone from t_acc where uid = a.p_uid), a.atype,
         case when a.atype = 'musabik' then (1 + (a.i * 7) % 98)::text end, a.branch, a.a_uid, a.gender
  from t_ath a;
  insert into athlete_groups (athlete_id, group_id) select aid, gid from t_ath;

  -- ===== Aidat planları ve ödemeleri =====
  create temp table t_plan on commit drop as
  select gen_random_uuid() as id, a.aid, a.reg, br.fee as amount, (1 + (a.i * 5 + v_idx) % 28)::int as dom,
         (case when make_date(extract(year from a.reg)::int, extract(month from a.reg)::int, 1 + (a.i * 5 + v_idx) % 28) < a.reg
               then make_date(extract(year from a.reg)::int, extract(month from a.reg)::int, 1 + (a.i * 5 + v_idx) % 28) + interval '1 month'
               else make_date(extract(year from a.reg)::int, extract(month from a.reg)::int, 1 + (a.i * 5 + v_idx) % 28) end)::date as first_due
  from t_ath a join t_br br on br.name = a.branch;
  insert into payment_plans (id, club_id, athlete_id, amount, day_of_month, active, created_at, first_payment_date)
  select id, v_club, aid, amount, dom, true, reg::timestamptz, first_due from t_plan;
  insert into payments (club_id, athlete_id, period, amount, due_date, paid_at, method, status, created_at, plan_id)
  select v_club, p.aid, 'monthly', p.amount, d.due,
         case when st.paid then d.due::timestamp + make_interval(days => (r.r1 * 6)::int - 2, hours => 11) end,
         case when st.paid then (array['bank_transfer','cash','credit_card'])[1 + floor(r.r2 * 3)::int]::payment_method end,
         case when st.paid then 'paid' else 'pending' end::payment_status,
         p.reg::timestamptz, p.id
  from t_plan p
  cross join generate_series(0, 6) m
  cross join lateral (select (p.first_due + make_interval(months => m))::date as due) d
  cross join lateral (select (abs(hashtext(p.id::text || d.due::text || 'a')) % 10000) / 10000.0 as r1, (abs(hashtext(p.id::text || d.due::text || 'b')) % 10000) / 10000.0 as r2, (abs(hashtext(p.id::text || d.due::text || 'c')) % 10000) / 10000.0 as r3) r
  cross join lateral (select (d.due < v_today and r.r3 < 0.88) as paid) st
  where d.due <= v_today + 62;

  -- ===== Antrenman şablonları, seanslar, yoklama =====
  insert into training_schedule_templates (club_id, group_id, day_of_week, start_time, end_time, venue_id, active, created_by, created_at)
  select v_club, id, d, st, (st + interval '90 minutes')::time, venue, true, v_admin, v_created
  from t_grp cross join lateral unnest(array[d1, d2]) d;
  create temp table t_sess on commit drop as
  select gen_random_uuid() as id, g.id as gid, g.head, g.venue, d::date as sdate, g.st, (g.st + interval '90 minutes')::time as et
  from t_grp g
  cross join generate_series((v_start + 3)::timestamp, (v_today + 7)::timestamp, interval '1 day') d
  where (extract(isodow from d)::int - 1) in (g.d1, g.d2);
  insert into training_sessions (id, club_id, group_id, venue_id, session_date, start_time, end_time, topic, status, completed_by, completed_at, created_by, created_at, rating, rating_note)
  select s.id, v_club, s.gid, s.venue, s.sdate, s.st, s.et, topics[1 + (extract(doy from s.sdate)::int + extract(hour from s.st)::int) % 8],
         case when s.sdate < v_today then 'completed' else 'planned' end::session_status,
         case when s.sdate < v_today then s.head end,
         case when s.sdate < v_today then ((s.sdate + s.et)::timestamp)::timestamptz end,
         v_admin, greatest(v_created, s.sdate::timestamp - interval '7 days'),
         case when s.sdate < v_today and r.r < 0.35 then 6 + (random() * 4)::int end,
         case when s.sdate < v_today and r.r < 0.12 then 'Grup çalışmaya iyi odaklandı.' end
  from t_sess s cross join lateral (select (abs(hashtext(s.id::text || 'r')) % 10000) / 10000.0 as r) r;
  insert into attendance (session_id, athlete_id, status, marked_by, marked_at)
  select s.id, a.aid,
         (case when r.r1 < a.prop * 0.93 then 'geldi'
               when r.r2 < 0.25 then 'gec_kaldi' when r.r2 < 0.55 then 'gelmedi' when r.r2 < 0.85 then 'izinli' else 'raporlu' end)::attendance_status,
         s.head, ((s.sdate + s.et)::timestamp)::timestamptz
  from t_sess s
  join t_ath a on a.gid = s.gid and a.reg <= s.sdate and a.ast = 'active'
  cross join lateral (select (abs(hashtext(s.id::text || a.aid::text || '1')) % 10000) / 10000.0 as r1, (abs(hashtext(s.id::text || a.aid::text || '2')) % 10000) / 10000.0 as r2) r
  where s.sdate < v_today;
  insert into session_excuses (club_id, session_id, athlete_id, reason, created_at, updated_at)
  select v_club, att.session_id, att.athlete_id, (array['Ailevi nedenler','Hastalık','Okul sınavı','Şehir dışında','Diş randevusu'])[1 + floor(random() * 5)::int], att.marked_at - interval '1 day', att.marked_at - interval '1 day'
  from attendance att join t_sess s on s.id = att.session_id
  where att.status = 'izinli' and random() < 0.6;
  insert into session_rpe (club_id, session_id, athlete_id, rpe, created_at)
  select v_club, att.session_id, att.athlete_id, 4 + (random() * 5)::int, att.marked_at
  from attendance att join t_sess s on s.id = att.session_id
  where att.status = 'geldi' and random() < 0.12;

  -- ===== Antrenör maaş planı, ödemeler, avans =====
  create temp table t_cpl on commit drop as
  select gen_random_uuid() as id, uid, seq, cord,
         case cord when 1 then 42000 when 2 then 34000 else 28000 + (seq % 4) * 1500 end::numeric as amount,
         (1 + seq % 5)::int as dom
  from t_coach;
  insert into coach_payment_plans (id, club_id, coach_id, amount, day_of_month, active, created_at)
  select id, v_club, uid, amount, dom, true, v_created from t_cpl;
  insert into coach_payments (club_id, coach_id, amount, due_date, paid_at, status, created_at, plan_id)
  select v_club, p.uid, p.amount, d.due, case when d.due < v_today then d.due::timestamp + interval '10 hours' end,
         case when d.due < v_today then 'paid' else 'pending' end, v_created, p.id
  from t_cpl p
  cross join generate_series(0, 4) m
  cross join lateral (select (date_trunc('month', v_start) + make_interval(months => m) + make_interval(days => p.dom - 1))::date as due) d
  where d.due <= v_today + 31 and d.due >= v_start - 5;
  create temp table t_adv on commit drop as
  select gen_random_uuid() as id, uid as coach, seq,
         (array[3000, 5000, 8000, 10000])[1 + seq % 4]::numeric as amt,
         greatest(v_start + 1, v_today - (4 + (seq * 7) % 40)) as gdate,
         (seq % 6 <> 0) as deduct
  from t_coach where seq % 3 = 0;
  insert into coach_advances (id, club_id, coach_id, amount, given_date, note, created_by, created_at)
  select id, v_club, coach, amt, gdate, 'Maaş avansı', v_admin, gdate::timestamptz from t_adv;
  create temp table t_ded on commit drop as
  select distinct on (a.id) a.id as adv, p.id as pay, a.amt, a.gdate
  from t_adv a join coach_payments p on p.coach_id = a.coach and p.status = 'pending' and p.due_date > a.gdate and p.club_id = v_club
  where a.deduct order by a.id, p.due_date;
  insert into coach_advance_deductions (club_id, advance_id, coach_payment_id, deducted_amount)
  select v_club, adv, pay, amt from t_ded;
  update coach_payments p set amount = p.amount - d.amt,
         notes = 'Avans kesintisi: -' || replace(to_char(d.amt, 'FM999,999'), ',', '.') || ' ₺ (' || d.gdate || ')'
  from t_ded d where p.id = d.pay;
  insert into coach_leaves (club_id, coach_id, start_date, end_date, reason, created_by, created_at)
  select v_club, uid, v_today - (12 + seq % 20), v_today - (9 + seq % 20), 'Yıllık izin', v_admin, v_created
  from t_coach where seq % 5 = 1 and v_today - (12 + seq % 20) > v_start;

  -- ===== Giderler, envanter, sakatlık, notlar =====
  insert into expenses (club_id, description, amount, expense_date, created_at)
  select v_club, e.descr, e.amt + (v_idx % 7) * 500, (date_trunc('month', v_start) + make_interval(months => m) + make_interval(days => e.dy))::date, v_created
  from generate_series(0, 3) m
  cross join (values ('Salon kirası', 18000, 4), ('Ekipman alımı', 5500, 11), ('Hakem ve organizasyon', 2800, 19)) e(descr, amt, dy)
  where (date_trunc('month', v_start) + make_interval(months => m) + make_interval(days => e.dy))::date between v_start and v_today;
  insert into inventory (club_id, item_name, quantity, condition, created_at)
  select v_club, x.n, x.q, x.c, v_created from (values ('Antrenman topu', 30, 'iyi'), ('Bariyer seti', 12, 'iyi'), ('Ağırlık plakası', 20, 'orta'), ('Pilates matı', 25, 'yeni'), ('Kronometre', 6, 'iyi'), ('Koni seti', 40, 'orta'), ('İlk yardım çantası', 3, 'yeni'), ('Atlama ipi', 35, 'iyi')) x(n, q, c);
  insert into injuries (club_id, athlete_id, injury_type, injury_date, expected_return, note, reported_by, created_at)
  select v_club, a.aid, (array['Bilek burkulması','Diz ağrısı','Kas zorlanması','Omuz zorlanması'])[1 + a.i % 4],
         v_today - (3 + a.i % 25), v_today + (a.i % 14) - 5, 'Antrenör kontrolünde dinlenme önerildi.', a.head, v_created
  from t_ath a where a.i % 19 = 3 and v_today - (3 + a.i % 25) >= a.reg;
  insert into athlete_notes (club_id, athlete_id, coach_id, note, created_at)
  select v_club, a.aid, a.head, (array['Derse katılımı çok iyi.','Tekniğini geliştirmesi gerekiyor.','Takım arkadaşlarıyla uyumu çok iyi.','Sürat çalışmasında gelişim var.'])[1 + a.i % 4],
         a.reg::timestamptz + interval '10 days'
  from t_ath a where a.i % 9 = 2 and a.reg + 10 <= v_today;

  -- ===== Etkinlikler =====
  create temp table t_ev on commit drop as
  select gen_random_uuid() as id, v.*
  from (values
    (1, 'kamp', 'Yaz Spor Kampı', 'Hafta sonu antrenman ve doğa kampı.', v_start + 8, v_start + 10, 1500::numeric, 60, 'Kamp alanı'),
    (2, 'turnuva', 'Dostluk Turnuvası', 'Kulüpler arası dostluk turnuvası.', v_today + 12, v_today + 13, 300::numeric, 80, 'Ana Spor Salonu'),
    (3, 'etkinlik', 'Sezon Şenliği', 'Sporcu ve velilerle sezon sonu şenliği.', v_today + 35, null::date, 0::numeric, null::int, 'Kulüp bahçesi')
  ) v(n, typ, title, descr, sd, ed, fee, cap, loc);
  insert into events (id, club_id, type, title, description, branch, location, start_date, end_date, fee_try, capacity, registration_deadline, status, created_by, created_at)
  select id, v_club, typ, title, descr, v_branches[1], loc, sd, ed, fee, cap, sd - 2, 'published', v_admin, v_start::timestamp + interval '4 days' from t_ev;
  insert into event_registrations (event_id, athlete_id, registered_by, amount_due, payment_method, note, status, created_at, reviewed_at, reviewed_by, club_id)
  select e.id, a.aid, a.p_uid, e.fee, case when e.fee > 0 then (array['havale','elden'])[1 + a.i % 2] end, null,
         case when e.n = 1 then case when r.r < 0.85 then 'approved' when r.r < 0.92 then 'rejected' else 'cancelled' end
              else case when r.r < 0.55 then 'approved' when r.r < 0.95 then 'pending' else 'cancelled' end end,
         v_start::timestamp + interval '5 days' + make_interval(hours => (a.i * 5) % 200),
         case when (case when e.n = 1 then r.r < 0.92 else r.r < 0.55 end) then v_start::timestamp + interval '6 days' end,
         case when (case when e.n = 1 then r.r < 0.92 else r.r < 0.55 end) then v_admin end,
         v_club
  from t_ev e join t_ath a on a.i % 4 = e.n % 4 and a.ast = 'active'
  cross join lateral (select (abs(hashtext(e.id::text || a.aid::text || 'r')) % 10000) / 10000.0 as r) r;
  insert into extra_income (club_id, description, amount, income_date, created_at, event_registration_id)
  select v_club, 'Etkinlik kaydı: ' || e.title || ' - ' || a.fname || ' ' || a.lname, er.amount_due, (v_start + 7), v_created, er.id
  from event_registrations er join t_ev e on e.id = er.event_id join t_ath a on a.aid = er.athlete_id
  where er.club_id = v_club and er.status = 'approved' and er.amount_due > 0 and e.n = 1;

  -- ===== Maçlar (takım branşları) =====
  create temp table t_match on commit drop as
  select gen_random_uuid() as id, g.id as gid, g.branch, k
  from t_grp g join t_br b on b.id = g.branch_id and not b.is_ind
  cross join generate_series(1, 3) k;
  insert into matches (id, club_id, group_id, opponent_name, match_date, start_time, location, notes, created_at, our_score, opponent_score, result_note)
  select m.id, v_club, m.gid,
         (array['Gençlerbirliği SK','Yeşilova Spor','Doğuş Gençlik','Atakent SK','Bahçelievler Spor','Çamlık Spor','Barış SK','Vadi Gençlik','Ulus Spor','Güneşli SK'])[1 + (m.k * 3 + v_idx + abs(hashtext(m.id::text))) % 10],
         case when m.k < 3 then greatest(v_start + 2, v_today - (5 + m.k * 9 + abs(hashtext(m.id::text)) % 6)) else v_today + 4 + abs(hashtext(m.id::text)) % 18 end,
         (array['11:00','12:30','14:00','15:30'])[1 + abs(hashtext(m.id::text)) % 4]::time,
         'Ana Spor Salonu', null, v_created,
         case when m.k < 3 then abs(hashtext(m.id::text)) % 5 + 1 end,
         case when m.k < 3 then abs(hashtext(m.id::text || 'x')) % 4 end,
         case when m.k < 3 then 'Maç tamamlandı.' end
  from t_match m;
  insert into match_roster (match_id, athlete_id)
  select m.id, a.aid from t_match m join lateral (select aid from t_ath where gid = m.gid and ast = 'active' order by md5(aid::text || m.id::text) limit 9) a on true;

  -- ===== Duyurular =====
  insert into announcements (club_id, author_id, title, body, created_at, target_types, is_important)
  select v_club, v_admin, x.title, x.body, v_start::timestamp + make_interval(days => (x.dd * (v_today - v_start) / 10.0)::int, hours => 10), array['club']::announcement_target[], x.imp
  from (values
    (1, 'Sezon Başlangıç Bilgilendirmesi', 'Yeni sezon antrenman programları yayınlandı. Grup saatlerinizi takvim bölümünden takip edebilirsiniz.', true),
    (3, 'Aidat Ödemeleri Hakkında', 'Aylık aidat ödemelerini ayın 10''una kadar yapmanızı rica ederiz.', false),
    (5, 'Forma Siparişleri Başladı', 'Kulüp formaları mağaza bölümünden sipariş verilebilir.', false),
    (7, 'Dostluk Turnuvası Kayıtları', 'Turnuva kayıtları etkinlikler bölümünden veliler tarafından yapılabilir.', true),
    (9, 'Hava Durumu Nedeniyle Program Değişikliği', 'Açık alan antrenmanları kapalı salonda yapılacaktır.', false)
  ) x(dd, title, body, imp);
  insert into announcement_reads (club_id, announcement_id, user_id, read_at)
  select v_club, an.id, a.p_uid, an.created_at + interval '5 hours'
  from announcements an join t_ath a on a.i % 3 = 0
  where an.club_id = v_club;

  -- ===== Mağaza =====
  create temp table t_prod on commit drop as
  select gen_random_uuid() as id, x.*
  from (values
    (1, 'Maç Forması', 'Forma', 'unisex', 550, array['128','140','152','164','S','M']),
    (2, 'Antrenman Tişörtü', 'Tişört', 'unisex', 300, array['128','140','152','164','S','M']),
    (3, 'Şort', 'Şort', 'erkek', 350, array['128','140','152','164','S']),
    (4, 'Eşofman Takımı', 'Eşofman', 'unisex', 750, array['140','152','164','S','M']),
    (5, 'Sırt Çantası', 'Çanta', 'unisex', 450, array['Tek Beden']),
    (6, 'Spor Çorap (3''lü)', 'Çorap', 'unisex', 120, array['31-35','36-40','41-45']),
    (7, 'Şapka', 'Şapka', 'unisex', 150, array['Tek Beden']),
    (8, 'Yağmurluk', 'Yağmurluk', 'kadin', 600, array['140','152','S','M'])
  ) x(n, title, cat, gender, price, sizes);
  insert into shop_products (id, club_id, title, description, price, photo_urls, is_active, created_by, created_at, category, gender, photo_thumb_urls)
  select id, v_club, v_short || ' SK ' || title, 'Kulübümüzün resmi ' || lower(title) || ' ürünü.', price, '{}', true, v_admin, v_start::timestamp + interval '3 days', cat, gender, '{}' from t_prod;
  create temp table t_var on commit drop as
  select gen_random_uuid() as id, p.id as pid, p.price, sz, p.title
  from t_prod p cross join lateral unnest(p.sizes) sz;
  insert into shop_product_variants (id, product_id, club_id, color, size, created_at)
  select id, pid, v_club, case when title = 'Maç Forması' then 'Lacivert' end, sz, v_start::timestamp + interval '3 days' from t_var;
  insert into shop_product_variant_stock (variant_id, club_id, stock, updated_at) select id, v_club, 40, v_created from t_var;
  create temp table t_ord on commit drop as
  select gen_random_uuid() as id, a.p_uid, v.id as vid, v.pid, v.price, (1 + k % 2) as qty,
         v_start::timestamp + interval '4 days' + make_interval(days => ((k * 5) % greatest(1, (v_today - v_start - 4))), hours => 9 + k % 8) as ts, k
  from generate_series(1, 30 + v_nath / 4) k
  join t_ath a on a.i = 1 + (k * 7) % v_nath
  cross join lateral (select * from t_var order by md5(k::text || v_slug) limit 1) v;
  insert into shop_orders (id, club_id, product_id, parent_user_id, quantity, unit_price, total_price, payment_method, note, status, created_at, variant_id)
  select o.id, v_club, o.pid, o.p_uid, o.qty, o.price, o.price * o.qty, (array['havale','elden'])[1 + o.k % 2],
         case when o.k % 11 = 0 then 'Beden değişimi olabilir mi?' end,
         case when now() - o.ts > interval '12 days' then (case when o.k % 6 = 0 then 'cancelled' else 'delivered' end)
              else (case when o.k % 3 = 0 then 'pending' else 'confirmed' end) end,
         least(o.ts, now() - interval '1 hour'), o.vid
  from t_ord o;
  update shop_product_variant_stock s set stock = greatest(0, 40 - coalesce((select sum(o.qty) from t_ord o join shop_orders so on so.id = o.id where o.vid = s.variant_id and so.status <> 'cancelled'), 0))
  where s.club_id = v_club;
  insert into extra_income (club_id, description, amount, income_date, created_at, order_id)
  select v_club, 'Mağaza satışı: ' || sp.title || ' x' || so.quantity, so.total_price, so.created_at::date + 2, so.created_at, so.id
  from shop_orders so join shop_products sp on sp.id = so.product_id
  where so.club_id = v_club and so.status = 'delivered';

  -- ===== Sosyal paylaşımlar =====
  insert into social_posts (club_id, branch, author_id, media_type, media_url, storage_path, caption, created_at)
  select v_club, v_branches[1 + n % v_nb],
         case when n <= 12 then (select uid from t_coach where seq = ((n - 1) % (v_nb * v_ncoach)) + 1) else (select p_uid from t_ath where i = n - 11) end,
         'photo', 'https://picsum.photos/seed/' || v_slug || n || '/800/800', 'seed/' || v_club || '/' || n || '.jpg',
         (array['Bugünkü antrenmandan kareler 💪','Maç günü heyecanı!','Takım ruhu 🔥','Kampımızdan bir anı','Şampiyonlar yetişiyor','Salon çalışmamız harika geçti','Teşekkürler velilerimize 🙏','Yeni sezon hazırlıkları','Gururla izliyoruz','Bir günün özeti','Disiplin ve emek','Sporcularımızla birlikte','Antrenman sonrası mutlu anlar','Ailemizle birlikte'])[n],
         least(now() - interval '2 hours', v_start::timestamp + make_interval(days => (n * (v_today - v_start) / 14.0)::int, hours => 12))
  from generate_series(1, 14) n;

  -- ===== Mesajlaşma =====
  insert into messages (club_id, sender_id, receiver_id, body, sent_at, read_at)
  select v_club, case when k % 2 = 1 then a.p_uid else a.head end, case when k % 2 = 1 then a.head else a.p_uid end,
         case when k % 2 = 1 then pm[1 + (a.i * 3 + k) % 8] else cm[1 + (a.i * 5 + k) % 8] end, t.ts,
         case when t.ts < now() - interval '3 days' or a.i % 4 = 0 then t.ts + interval '25 minutes' end
  from t_ath a
  cross join lateral generate_series(1, 2 + a.i % 4) k
  cross join lateral (select least(now() - interval '10 minutes', a.reg::timestamp + make_interval(days => ((a.i * 29) % greatest(1, v_today - a.reg)), hours => 9) + make_interval(mins => k * 9)) as ts) t
  where a.i % 2 = 0;
  insert into messages (club_id, sender_id, receiver_id, body, sent_at, read_at)
  select v_club, case when k % 2 = 1 then a.a_uid else b.a_uid end, case when k % 2 = 1 then b.a_uid else a.a_uid end,
         (array['Bugün antrenman var mı?','Evet, 17:30''da.','Tamam görüşürüz.','Formayı getirmeyi unutma.'])[k], t.ts, t.ts + interval '10 minutes'
  from t_ath a
  cross join lateral (select * from t_ath b where b.gid = a.gid and b.i > a.i order by b.i limit 1) b
  cross join lateral generate_series(1, 4) k
  cross join lateral (select least(now() - interval '10 minutes', greatest(a.reg, b.reg)::timestamp + make_interval(days => ((a.i * 13) % greatest(1, v_today - greatest(a.reg, b.reg))), hours => 15) + make_interval(mins => k * 4)) as ts) t
  where a.i % 5 = 0;
  insert into messages (club_id, sender_id, receiver_id, body, sent_at, read_at)
  select v_club, case when k % 2 = 1 then c.uid else v_admin end, case when k % 2 = 1 then v_admin else c.uid end,
         (array['Salon için yeni top talebimiz var, konuşabilir miyiz?','Tabii, yarın müsait misiniz?','Yarın 10:00 uygundur.'])[k], t.ts, t.ts + interval '15 minutes'
  from t_coach c cross join lateral generate_series(1, 3) k
  cross join lateral (select least(now() - interval '10 minutes', v_created + make_interval(days => 5 + (c.seq * 3) % 40, hours => 10) + make_interval(mins => k * 6)) as ts) t
  where c.seq % 2 = 0;

  -- ===== Performans ölçümleri (tüm testler, herkes, 2 ölçüm) =====
  create temp table t_spec on commit drop as
  select * from (values
    ('Bel-Kalça Oranı', 0.84, -0.002, 0.04), ('BKİ (Vücut Kitle İndeksi)', 18.5, 0.3, 0.08), ('Boy', 152, 5.8, 0.03),
    ('Deri Kıvrımı Toplamı (7 Bölge)', 85, 1.5, 0.2), ('Kilo', 40, 3.2, 0.1), ('Kol Açıklığı (Wingspan)', 153, 5.8, 0.03),
    ('Oturarak Boy (PHV için)', 79, 3, 0.03), ('Vücut Yağ Oranı', 17, 0.4, 0.2),
    ('5-10-5 Pro Agility Shuttle', 5.6, -0.11, 0.05), ('505 Agility Test', 2.7, -0.05, 0.05), ('Arrowhead Çeviklik Testi', 9.6, -0.15, 0.05),
    ('Illinois Çeviklik Testi', 18.6, -0.35, 0.05), ('L-Drill (3-Cone Drill)', 8.4, -0.15, 0.05), ('T-Testi', 11.2, -0.2, 0.05), ('Zigzag Testi', 6.5, -0.12, 0.05),
    ('Beep Test (20m Shuttle Run / PACER)', 7.5, 0.45, 0.18), ('Cooper Testi (12 dk Koşu Mesafesi)', 2100, 60, 0.1), ('Dinlenik Kalp Atım Hızı', 78, -1.2, 0.07),
    ('Kalp Atım Toparlanma Testi (HRR)', 28, 1.2, 0.2), ('Yo-Yo Intermittent Recovery Test', 12, 0.5, 0.12),
    ('Flamingo Denge Testi', 6, -0.5, 0.4), ('Gözü Kapalı Tek Ayak Denge', 12, 1.5, 0.3), ('Stork Denge Testi', 22, 2, 0.3), ('Y Denge Testi (Y-Balance Test)', 85, 2, 0.08),
    ('Ayak Bileği Dorsifleksiyon Testi', 9, 0.2, 0.2), ('Kalça Fleksiyon / Ekstansiyon', 115, 0, 0.06), ('Omuz Esneklik Testi', 12, -0.3, 0.3),
    ('Otur-Uzan Testi (Sit and Reach)', 26, 0.3, 0.2), ('Thomas Testi (Kalça Fleksör Esnekliği)', 8, -0.1, 0.4),
    ('Barfiks Testi (Max Tekrar)', 3, 0.8, 0.5), ('El Kavrama Kuvveti', 22, 3, 0.12), ('Leg Press 1RM', 95, 12, 0.15), ('Medicine Ball Throw', 4.6, 0.5, 0.1),
    ('Mekik Testi (1 dk, max tekrar)', 26, 1.5, 0.15), ('Plank Tutma Süresi (Core Dayanıklılık)', 55, 6, 0.3), ('Şınav Testi (1 dk, max tekrar)', 18, 1.6, 0.25), ('Squat / Bench Press 1RM', 45, 6, 0.2),
    ('Broad Jump (Uzun Atlama)', 165, 6, 0.07), ('Countermovement Jump (CMJ)', 27, 1.3, 0.1), ('Dikey Sıçrama (Sargent Jump)', 30, 1.3, 0.1), ('Reaktif Sıçrama (Drop Jump / RSI)', 1.2, 0.04, 0.12),
    ('Squat Jump (SJ)', 25, 1.2, 0.1), ('Tek Bacak Sıçrama Mesafesi (Single Leg Hop)', 140, 5, 0.08), ('Üçlü Sıçrama (Triple Hop)', 470, 15, 0.08), ('Yana Sıçrama (Lateral Jump)', 50, 1.5, 0.1),
    ('10m Sürat (Kalkış Hızı)', 2.1, -0.04, 0.05), ('20m Sürat', 3.9, -0.07, 0.05), ('30m Sürat', 5.3, -0.09, 0.05), ('40m Sürat', 6.8, -0.11, 0.05),
    ('Flying 10m Sürat', 1.6, -0.03, 0.05), ('Flying Sprint (20m, uçan start)', 2.9, -0.05, 0.05), ('Tekrarlı Sprint Testi (RSA)', 7.0, -0.1, 0.05)
  ) v(name, base, slope, noise);
  create temp table t_pm on commit drop as
  select a.aid, c.id as cid, c.unit, c.name, c.lower_is_better as lib, a.m1, a.m2,
         case
           when c.name = 'Boy' then a.h
           when c.name = 'Kilo' then a.w
           when c.name = 'BKİ (Vücut Kitle İndeksi)' then a.w / power(a.h / 100.0, 2)
           when c.name = 'Kol Açıklığı (Wingspan)' then a.h * 1.01 * (0.99 + random() * 0.02)
           when c.name = 'Oturarak Boy (PHV için)' then a.h * 0.52 * (0.99 + random() * 0.02)
           else (s.base + s.slope * (a.age - 12))
                * (case when c.category in ('kuvvet','sicrama','dayaniklilik') then (case a.gender when 'kadin' then 0.88 else 1 end)
                        when c.category = 'esneklik' then (case a.gender when 'kadin' then (case when c.lower_is_better is true then 0.94 else 1.08 end) else 1 end)
                        when c.category in ('surat','ceviklik') then (case a.gender when 'kadin' then 1.05 else 1 end)
                        else 1 end)
                * (case when c.lower_is_better is true then 1 / a.tal else a.tal end)
                * (1 + s.noise * (random() + random() + random() - 1.5) * 0.9)
         end::numeric as v0,
         (0.015 + random() * 0.045)::numeric as imp
  from t_ath a cross join performance_test_catalog c join t_spec s on s.name = c.name
  where c.club_id is null;
  insert into performance_measurements (club_id, athlete_id, test_key, value, measured_at, notes, created_at)
  select v_club, p.aid, 'custom:' || p.cid,
         greatest(0, round(p.v * 1::numeric, case when p.unit in ('tekrar','düşme sayısı','atım/dk') or p.name like 'Cooper%' then 0
                                                when p.unit in ('cm','kg','mm','%','derece','kg/m²','seviye') then 1 else 2 end)),
         case m when 1 then p.m1 else p.m2 end, null, (case m when 1 then p.m1 else p.m2 end)::timestamp + interval '11 hours'
  from (select t.*, 0::numeric as z from t_pm t) t0
  cross join generate_series(1, 2) m
  cross join lateral (select t0.aid, t0.cid, t0.unit, t0.name, t0.m1, t0.m2,
                             case when m = 1 then t0.v0
                                  when t0.lib is true then t0.v0 * (1 - t0.imp)
                                  when t0.lib is false then t0.v0 * (1 + t0.imp)
                                  else t0.v0 * 1.005 end as v) p
  where m = 1 or t0.m2 > t0.m1;
  insert into performance_test_groups (id, club_id, name, created_at) values (gen_random_uuid(), v_club, 'Sezon Başı Testleri', v_start::timestamp + interval '2 days'), (gen_random_uuid(), v_club, 'Çeviklik ve Sürat', v_start::timestamp + interval '2 days');
  insert into performance_test_group_tests (test_group_id, test_id)
  select tg.id, c.id from performance_test_groups tg join performance_test_catalog c on c.club_id is null
   and ((tg.name = 'Sezon Başı Testleri' and c.name in ('Boy','Kilo','Dikey Sıçrama (Sargent Jump)','20m Sürat','Otur-Uzan Testi (Sit and Reach)','Şınav Testi (1 dk, max tekrar)'))
     or (tg.name = 'Çeviklik ve Sürat' and c.category in ('ceviklik','surat')))
  where tg.club_id = v_club;
  insert into performance_test_group_athletes (test_group_id, athlete_id)
  select tg.id, a.aid from performance_test_groups tg join t_ath a on (tg.name = 'Sezon Başı Testleri' or a.bord = 1) where tg.club_id = v_club;

  -- ===== Fitness (bireysel fitness yapanlar) =====
  create temp table t_fitg on commit drop as
  select gen_random_uuid() as id, n, case n when 1 then 'Fitness Grubu A' else 'Fitness Grubu B' end as gname
  from generate_series(1, 2) n;
  insert into fitness_groups (id, club_id, name, branch, created_by, created_at)
  select id, v_club, gname, coalesce((select name from t_br where is_ind order by ord limit 1), v_branches[1]), v_admin, v_start::timestamp + interval '5 days' from t_fitg;
  create temp table t_fm on commit drop as
  select a.aid, a.i, a.fname, a.reg, a.age, a.tal, f.id as fgid, gen_random_uuid() as prog
  from t_ath a join t_fitg f on f.n = case when a.i % 8 = 0 then 1 when a.i % 8 = 4 then 2 end
  where a.age >= 12 and a.ast = 'active';
  insert into fitness_group_members (fitness_group_id, athlete_id) select fgid, aid from t_fm;
  insert into individual_fitness_programs (id, club_id, athlete_id, name, created_at)
  select prog, v_club, aid, 'Bireysel Program - ' || fname, reg::timestamptz + interval '3 days' from t_fm;
  create temp table t_fi on commit drop as
  select m.prog, m.aid, m.age, m.reg, cat.ord, e.id as exid, e.name as exname, e.category, coalesce(e.bodyweight, false) as bw
  from t_fm m
  cross join (values (1, 'bacak'), (2, 'gogus'), (3, 'sirt'), (4, 'omuz'), (5, 'karin')) cat(ord, category)
  cross join lateral (select * from fitness_exercises fe where fe.club_id is null and fe.category = cat.category order by md5(fe.id::text || m.aid::text) limit 1) e;
  insert into individual_fitness_program_items (club_id, program_id, category, exercise_key, exercise_name, sets, reps, sort_order)
  select v_club, prog, category, 'custom:' || exid, exname, 3, 10, ord from t_fi;
  insert into fitness_measurements (club_id, athlete_id, exercise_key, weight_kg, sets, reps, measured_at, individual_program_id, created_at)
  select v_club, i.aid, 'custom:' || i.exid,
         case when i.bw then 0 else round(((10 + (abs(hashtext(i.exid::text)) % 40)) * (0.5 + i.age / 24.0) * (1 + 0.04 * (5 - k)) / 2.5))::numeric * 2.5 end,
         3, case when i.bw then 12 + (5 - k) else 10 end, dt.d, i.prog, dt.d::timestamp + interval '18 hours'
  from t_fi i cross join generate_series(0, 5) k
  cross join lateral (select v_today - 7 * k as d) dt
  where dt.d >= i.reg + 3;
  insert into fitness_programs (id, club_id, name, fitness_group_id, created_by, created_at)
  select gen_random_uuid(), v_club, 'Haftalık Güç Programı - ' || gname, id, v_admin, v_start::timestamp + interval '6 days' from t_fitg;
  insert into fitness_program_items (club_id, program_id, category, exercise_key, exercise_name, sets, reps, sort_order)
  select v_club, p.id, e.category, 'custom:' || e.id, e.name, 3, 12, e.rn
  from fitness_programs p
  cross join lateral (select fe.*, row_number() over (order by md5(fe.id::text || p.id::text)) as rn from fitness_exercises fe where fe.club_id is null order by md5(fe.id::text || p.id::text) limit 6) e
  where p.club_id = v_club;
  insert into fitness_program_completions (club_id, program_id, athlete_id, completed_at, note, difficulty, duration_minutes, created_at)
  select v_club, p.id, m.aid, dt.d::timestamp + interval '18 hours', null, 4 + (m.i + k) % 6, 40 + (m.i * 3 + k) % 30, dt.d::timestamp + interval '18 hours'
  from t_fm m join fitness_programs p on p.fitness_group_id = m.fgid and p.club_id = v_club
  cross join generate_series(0, 0) k
  cross join lateral (select v_today - 7 * k - (m.i % 3) as d) dt
  where dt.d >= m.reg + 3;

  -- ===== Wellness =====
  insert into wellness_checkins (club_id, athlete_id, checkin_date, sleep_hours, sleep_quality, soreness, energy, mood, resting_hr, created_at, entered_by_role)
  select v_club, a.aid, v_today - k, round((7 + random() * 2.5)::numeric, 1), 3 + (random() * 2)::int, 1 + (random() * 3)::int, 3 + (random() * 2)::int, 3 + (random() * 2)::int, 60 + (random() * 20)::int, (v_today - k)::timestamp + interval '8 hours', 'athlete'
  from t_ath a cross join generate_series(0, 6) k
  where a.i % 8 = 1 and a.ast = 'active' and v_today - k >= a.reg;
end
$seed$;
