// Data game: senjata, map, level, naskah. Edit di sini untuk menambah konten.
const WEAPONS={
  ak:{name:'AK47',type:'gun',dmg:18,rate:.11,spread:.09,mag:30,reload:1.6,noise:600,price:0},
  beretta:{name:'Beretta',type:'gun',dmg:24,rate:.3,spread:.04,mag:12,reload:1.1,noise:450,price:400},
  ump:{name:'UMP',type:'gun',dmg:13,rate:.075,spread:.11,mag:25,reload:1.4,noise:500,price:700},
  bambu:{name:'Bambu Runcing',type:'melee',dmg:38,range:62,rate:.5,noise:90,price:250},
  dagger:{name:'Dagger',type:'melee',dmg:26,range:42,rate:.28,noise:60,price:0}
};
const MODS={silencer:'Silencer',stock:'Stock',scope:'Scope',magazine:'Magazine'};
const ITEMS={medkit:{name:'Medkit',key:'Z',price:80},grenade:{name:'Granat',key:'X',price:120},flash:{name:'Flashbang',key:'C',price:100}};
// L(nama, tempat, objektif, jumlahItem, labelItem, jumlahNPC, jumlahMusuh, batasWaktu(detik), reward, teksAkhir)
const L=(name,place,obj,n,label,rescue,en,time=0,reward=150,end='')=>({name,place,obj,n,label,rescue,en,time,reward,end});
const MAPS=[
 {name:'Bara Perlawanan Blitar',theme:'Perlawanan rakyat, komunikasi, dan mempertahankan kemerdekaan.',floor:'#2c3a24',
  naskah:'Jepang menduduki Indonesia sejak 1942. Rakyat menderita, termasuk kerja paksa romusha. Pada 14 Februari 1945 tentara PETA di Blitar di bawah pimpinan Supriyadi memberontak. Pemberontakan itu gagal dan sejumlah anggota PETA ditangkap, sedangkan nasib Supriyadi tidak diketahui secara pasti. Catatan: sebagian misi dalam game adalah rekonstruksi fiktif untuk gameplay.',
  levels:[
   L('Di Bawah Pendudukan','Permukiman Blitar','Kumpulkan informasi kondisi rakyat dan bantu warga.',3,'Informasi',1,3),
   L('Penderitaan Romusha','Area kerja paksa','Bantu pekerja sakit dan antarkan kebutuhan medis.',3,'Obat',2,4),
   L('Prajurit yang Terbangun','Markas PETA Blitar','Kumpulkan kesaksian dan informasi perlakuan Jepang.',4,'Kesaksian',0,5),
   L('Bara Perlawanan','Kawasan Blitar','Hubungkan kelompok masyarakat dan sampaikan rencana perlawanan.',3,'Pesan',3,5),
   L('Pemberontakan PETA','Blitar, 14 Februari 1945','Ikuti pemberontakan, bantu rekan, bawa informasi ke tempat aman.',4,'Informasi',2,7,0,400,
     'Pemberontakan PETA berakhir gagal. Banyak anggota ditangkap, nasib Supriyadi tak pernah diketahui pasti. Namun bara itu belum padam.')]},
 {name:'Bandung Lautan Api (1946)',theme:'Evakuasi rakyat, gerilya, dan pengorbanan.',floor:'#3a2a24',
  naskah:'Pada 23-24 Maret 1946 para pejuang dan penduduk mengosongkan Bandung bagian selatan disertai pembumihangusan agar fasilitas kota tidak dimanfaatkan lawan. Peristiwa ini dikenal sebagai Bandung Lautan Api.',
  levels:[
   L('Ultimatum Bandung','Bandung Utara','Cari informasi perintah pengosongan kota dan sampaikan ke pimpinan.',3,'Informasi',0,4),
   L('Misi Penyelamatan','Permukiman Bandung','Temukan warga dan kawal ke titik evakuasi.',0,'',4,4),
   L('Arsip yang Tertinggal','Gedung pemerintahan','Amankan arsip dan dokumen penting.',5,'Arsip',0,5),
   L('Jalan Menuju Selatan','Jalan Raya Bandung Selatan','Antar makanan dan obat ke pengungsi. Waktu terbatas!',4,'Persediaan',1,5,150),
   L('Bandung Lautan Api','Bandung Selatan','Selesaikan evakuasi terakhir dan capai titik aman.',3,'Titik Api',4,7,0,500,
     'Bandung terbakar, namun rakyatnya selamat. Pengorbanan itu menjadi simbol keteguhan.')]},
 {name:'Yogyakarta (1948-1949)',theme:'Mempertahankan eksistensi Republik lewat perlawanan dan diplomasi.',floor:'#2a3040',
  naskah:'Setelah Agresi Militer Belanda II (19 Desember 1948) Yogyakarta diduduki. Perjuangan dilanjutkan lewat gerilya dan komunikasi. Pada 1 Maret 1949 pasukan Indonesia menguasai Yogyakarta sekitar enam jam, membuktikan kepada dunia bahwa Republik Indonesia masih ada.',
  levels:[
   L('Ibu Kota yang Diduduki','Pusat Kota Yogyakarta','Ambil dokumen Republik dan bawa ke tempat aman.',3,'Dokumen',0,6),
   L('Pesan dari Luar Kota','Pinggiran Yogyakarta','Antar pesan gerilya ke tokoh di dalam kota. Sneaky!',2,'Pesan',0,6),
   L('Suara Republik','Jaringan radio','Pastikan informasi keberadaan Republik diteruskan lewat radio.',3,'Pemancar',1,6),
   L('Persiapan Serangan Umum','Kawasan Yogyakarta','Hubungkan kelompok, kumpulkan informasi, siapkan medis dan logistik.',6,'Logistik',2,7,240),
   L('Serangan Umum 1 Maret','Pusat Kota Yogyakarta','Koordinasi selama Serangan Umum, sampaikan kabar, capai titik evakuasi.',5,'Kabar',3,9,0,700,
     'Enam jam yang mengubah segalanya: dunia tahu Republik Indonesia masih berdiri.')]}
];