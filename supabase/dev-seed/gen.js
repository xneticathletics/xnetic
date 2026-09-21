// Kullanım: node gen.js <1-20>  ->  out_seed_<n>.sql üretir; sonra:
//   npx supabase db query --linked -f supabase/dev-seed/out_seed_<n>.sql
// creds.local.json (yönetici şifreleri) ve out_seed_*.sql git'e EKLENMEMELİ (yerelde kalsın).
// usage: node gen.js <idx> -> writes seed_<idx>.sql ; prints credentials json line
const fs=require("fs"), crypto=require("crypto");
const D=__dirname.split("\\").join("/")+"/";
const clubs=[
["Anadolu Genç Spor Kulübü","anadolu","Kemal Yılmaz"],["Ege Yıldızları Spor Kulübü","ege","Hakan Demirtaş"],["Marmara Atılım Spor Kulübü","marmara","Selim Aksoy"],
["Karadeniz Fırtına Spor Akademisi","karadeniz","Murat Çelik"],["Trakya Gençlik Spor Kulübü","trakya","Erkan Koç"],["Akdeniz Sporcu Fabrikası","akdeniz","Levent Şahin"],
["Boğaziçi Spor Akademisi","bogazici","Tuncay Özkan"],["Uludağ Kartalları Spor Kulübü","uludag","Sinan Arslan"],["Erciyes Şampiyonlar Spor Kulübü","erciyes","Volkan Erdem"],
["Çukurova Gelecek Spor Kulübü","cukurova","Ercan Polat"],["Kapadokya Spor Akademisi","kapadokya","Barış Güneş"],["Toros Spor Kulübü","toros","Orhan Yıldırım"],
["Fırat Genç Sporcular Kulübü","firat","Metin Kaplan"],["Kızılırmak Spor Kulübü","kizilirmak","Cengiz Aydın"],["Salda Gençlik Spor Kulübü","salda","Fikret Doğan"],
["Munzur Spor Kulübü","munzur","Hasan Kurt"],["Meram Yıldızlar Spor Kulübü","meram","Nihat Tekin"],["Nemrut Spor Akademisi","nemrut","Recep Bulut"],
["Pamukkale Atletik Spor Kulübü","pamukkale","Zafer Uçar"],["Kaçkar Spor Kulübü","kackar","İsmail Çakır"],
["X-NETIC Demo Kulübü","demo","Demo Yönetici"]];
const master=["Futbol","Basketbol","Voleybol","Yüzme","Cimnastik","Atletizm","Tenis","Judo","Karate","Masa Tenisi"];
const idx=parseInt(process.argv[2],10);
const [name,slug,admin]=clubs[idx-1];
const nb=idx===21?2:1+(idx%5), start=idx===21?0:(idx*3)%10;
const br=[];for(let k=0;k<nb;k++)br.push(master[(start+k)%10]);
const alpha="abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
let pw="";const buf=crypto.randomBytes(10);for(const b of buf)pw+=alpha[b%alpha.length];
const cfgFile=D+"creds.local.json";let creds={};try{creds=JSON.parse(fs.readFileSync(cfgFile,"utf8"))}catch(e){}
if(!creds[idx])creds[idx]={club:name,user:slug+"admin",pw};
pw=creds[idx].pw;
fs.writeFileSync(cfgFile,JSON.stringify(creds,null,1));
let t=fs.readFileSync(D+"seed_club.tpl.sql","utf8");
t=t.replace("__IDX__",idx).replace("__NAME__",name).replace("__SLUG__",slug).replace("__ADMINPW__",pw).replace("__ADMINNAME__",admin)
 .replace("__DAYS__",idx===21?75:92-(idx-1)*4).replace("__NATH__",idx===21?60:100+(idx*23)%90).replace("__BRANCHES__",br.map(b=>"'"+b+"'").join(","));
fs.writeFileSync(D+"out_seed_"+idx+".sql",t);
console.log(name,slug,br.join("/"),100+(idx*23)%90,"gün:",92-(idx-1)*4);
