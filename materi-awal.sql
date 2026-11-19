-- Ubah email ini menjadi email akun guru yang sudah terdaftar di public.teachers.
-- Jalankan melalui SQL Editor Supabase. Modul memakai ID tetap agar tidak diduplikasi.
begin;
do $arabiyah$
declare
  guru_email constant text := 'GANTI_EMAIL_GURU';
  guru_id uuid;
begin
  select u.id into guru_id
  from auth.users u join public.teachers t on t.user_id = u.id
  where lower(u.email) = lower(guru_email);
  if guru_id is null then
    raise exception 'Email tidak ditemukan di daftar guru. Ubah guru_email terlebih dahulu.';
  end if;
  insert into public.materials (id, teacher_id, title, grade, body, question, options, answer)
  select m.id, guru_id, m.title, m.grade, m.body, m.question, m.options, m.answer
  from (values
  ('97d75ede-5f45-5f54-93d1-3064e2eff86e'::uuid, 'Ayo berkenalan!', 'VII', 'Tujuan: membuka percakapan dan menyebutkan nama.

السَّلَامُ عَلَيْكُمْ
Semoga keselamatan tercurah kepada kalian.

مَا اسْمُكَ؟ / مَا اسْمُكِ؟
Siapa namamu? Gunakan bentuk pertama kepada laki-laki dan bentuk kedua kepada perempuan.

اِسْمِي أَحْمَدُ.
Nama saya Ahmad.

Praktik: bergantian menanyakan nama dengan teman sebangkumu.', 'Apa arti اِسْمِي أَحْمَدُ؟', '["Nama saya Ahmad", "Siapa namamu?", "Selamat pagi"]'::jsonb, 0),
  ('c230fbfb-b648-5a11-838a-76a4f7c1e5a4'::uuid, 'Di dalam kelas', 'VII', 'Tujuan: menyebutkan benda yang ada di kelas.

كِتَابٌ — قَلَمٌ — سَبُّورَةٌ — كُرْسِيٌّ
Buku, pena, papan tulis, dan kursi.

هٰذَا كِتَابٌ.
Ini sebuah buku. Gunakan هٰذَا untuk kata benda maskulin tunggal seperti كِتَابٌ.

هٰذِهِ سَبُّورَةٌ.
Ini sebuah papan tulis. Gunakan هٰذِهِ untuk kata benda feminin tunggal seperti سَبُّورَةٌ.

Praktik: tunjuk dan sebutkan dua benda di kelas.', 'Apa arti قَلَمٌ؟', '["Buku", "Pena", "Kursi"]'::jsonb, 1),
  ('abff78eb-becc-55c0-8f08-5b617201651b'::uuid, 'Keluarga saya', 'VII', 'Tujuan: memperkenalkan anggota keluarga.

أَبٌ — أُمٌّ — أَخٌ — أُخْتٌ
Ayah, ibu, saudara laki-laki, dan saudara perempuan.

هٰذَا أَبِي. وَهٰذِهِ أُمِّي.
Ini ayah saya. Dan ini ibu saya. Akhiran ـِي menandai kepemilikan orang pertama tunggal.

Praktik: buat dua kalimat untuk memperkenalkan anggota keluarga.', 'Manakah yang berarti “saudara perempuan saya”?', '["أَخِي", "أَبِي", "أُخْتِي"]'::jsonb, 2),
  ('954449b7-dae7-5cfe-b3d5-0e51ee5be4f1'::uuid, 'Rutinitas harian', 'VIII', 'Tujuan: menceritakan kebiasaan dengan fi‘il muḍāri‘.

أَسْتَيْقِظُ مُبَكِّرًا.
Saya bangun pagi.

أَتَنَاوَلُ الْفَطُورَ، ثُمَّ أَذْهَبُ إِلَى الْمَدْرَسَةِ.
Saya sarapan, kemudian pergi ke sekolah. ثُمَّ berarti “kemudian”.

Praktik: ceritakan dua kegiatan pagimu dengan penghubung ثُمَّ.', 'Apa arti أَذْهَبُ إِلَى الْمَدْرَسَةِ؟', '["Saya belajar di sekolah", "Saya pergi ke sekolah", "Saya pulang dari sekolah"]'::jsonb, 1),
  ('5d19c4de-7df5-50e7-a428-cb3cd9f497d2'::uuid, 'Hobi saya', 'VIII', 'Tujuan: menyampaikan kesukaan tentang suatu kegiatan.

الْقِرَاءَةُ — الرَّسْمُ — السِّبَاحَةُ
Membaca, menggambar, dan berenang.

مَا هِوَايَتُكَ؟ / مَا هِوَايَتُكِ؟
Apa hobimu? Bentuk pertama untuk laki-laki dan bentuk kedua untuk perempuan.

أُحِبُّ الْقِرَاءَةَ.
Saya suka membaca.

Praktik: tanyakan hobi teman dan jawab menggunakan أُحِبُّ.', 'Apa arti أُحِبُّ الرَّسْمَ؟', '["Saya suka menggambar", "Saya suka membaca", "Saya suka berenang"]'::jsonb, 0),
  ('ffc23f05-0fa6-5815-9cef-9b4092aec5d2'::uuid, 'Jam berapa?', 'VIII', 'Tujuan: menanyakan dan menjawab pertanyaan tentang jam.

كَمِ السَّاعَةُ الْآنَ؟
Sekarang pukul berapa?

السَّاعَةُ السَّابِعَةُ.
Pukul tujuh tepat.

السَّاعَةُ الثَّامِنَةُ وَالنِّصْفُ.
Pukul delapan lewat tiga puluh menit (08.30).

Praktik: gambar jarum jam untuk dua waktu, lalu ucapkan masing-masing dalam bahasa Arab.', 'Manakah yang menunjukkan pukul 07.00?', '["السَّاعَةُ السَّادِسَةُ", "السَّاعَةُ الثَّامِنَةُ", "السَّاعَةُ السَّابِعَةُ"]'::jsonb, 2),
  ('34c29d8d-92ee-57e2-9039-4608f38365de'::uuid, 'Berbelanja di pasar', 'IX', 'Tujuan: menanyakan harga barang dalam percakapan sederhana.

بِكَمْ هٰذَا الْكِتَابُ؟
Berapa harga buku ini?

بِعَشْرَةِ آلَافِ رُوبِيَّةٍ.
Harganya sepuluh ribu rupiah.

أُرِيدُ هٰذَا الْكِتَابَ، مِنْ فَضْلِكَ.
Saya ingin buku ini, tolong. Ungkapan مِنْ فَضْلِكَ ditujukan kepada laki-laki. Untuk perempuan, gunakan مِنْ فَضْلِكِ.

Praktik: mainkan peran penjual dan pembeli dengan dua benda di kelas.', 'Ungkapan mana yang dipakai untuk bertanya harga?', '["أَيْنَ …؟", "بِكَمْ …؟", "مَتَى …؟"]'::jsonb, 1),
  ('d75ee632-4e7e-50dd-8aa7-02b4d3e18b53'::uuid, 'Bertanya arah', 'IX', 'Tujuan: menanyakan letak suatu tempat dan memahami arah.

أَيْنَ الْمَكْتَبَةُ؟
Di mana perpustakaan?

اِذْهَبْ مُسْتَقِيمًا، ثُمَّ اِنْعَطِفْ يَمِينًا.
Jalan lurus, lalu belok kanan. Perintah ini ditujukan kepada satu laki-laki.

يَمِينًا — يَسَارًا
Ke kanan, ke kiri.

Praktik: buat denah sederhana lalu minta teman mengikuti petunjukmu.', 'Apa arti يَسَارًا؟', '["Lurus", "Ke kanan", "Ke kiri"]'::jsonb, 2),
  ('34b6f3c0-5112-595b-895f-a07af0f985d7'::uuid, 'Akhir pekan yang lalu', 'IX', 'Tujuan: menceritakan kegiatan yang sudah terjadi.

ذَهَبْتُ إِلَى الْحَدِيقَةِ أَمْسِ.
Saya pergi ke taman kemarin.

قَرَأْتُ كِتَابًا فِي الْبَيْتِ.
Saya membaca buku di rumah. Pada dua contoh ini, akhiran ـْتُ menandai pelaku “saya” pada fi‘il māḍī.

Praktik: tulis dua kalimat tentang kegiatanmu kemarin. Gunakan أَمْسِ pada salah satu kalimat.', 'Manakah kalimat yang berarti “Saya pergi ke taman kemarin”?', '["ذَهَبْتُ إِلَى الْحَدِيقَةِ أَمْسِ.", "أَذْهَبُ إِلَى الْحَدِيقَةِ كُلَّ يَوْمٍ.", "قَرَأْتُ كِتَابًا فِي الْبَيْتِ."]'::jsonb, 0)
  ) as m(id, title, grade, body, question, options, answer)
  on conflict (id) do nothing;
end
$arabiyah$;
commit;
