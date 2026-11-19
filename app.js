const cfg=window.APP_CONFIG, live=!!(cfg.supabaseUrl&&cfg.publishableKey), view=document.querySelector('#view');
let session=JSON.parse(sessionStorage.getItem('session')||'null'),page='learn',materials=[],records=[],teacher=false;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notice(s){document.querySelector('#notice').textContent=s}
async function request(path,method='GET',body,extra={}){if(!live)throw Error('Hubungkan Supabase melalui config.js terlebih dahulu.');if(session?.expires_at<Date.now()/1000+60){const r=await fetch(cfg.supabaseUrl+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:cfg.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});const d=await r.json();if(!r.ok){session=null;sessionStorage.removeItem('session');throw Error('Sesi berakhir. Silakan masuk kembali.')}session=d;sessionStorage.setItem('session',JSON.stringify(d))}const r=await fetch(cfg.supabaseUrl+path,{method,headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+(session?.access_token||cfg.publishableKey),...(body instanceof File?{}:{'Content-Type':'application/json'}),...extra},body:body?(body instanceof File?body:JSON.stringify(body)):undefined});const t=await r.text();let d;try{d=JSON.parse(t)}catch{d=t}if(!r.ok)throw Error(d.message||d.msg||d.error_description||'Permintaan gagal');return d}
async function load(){teacher=false;if(live&&session){const roles=await request('/rest/v1/teachers?select=user_id');teacher=roles.some(x=>x.user_id===session.user.id);materials=await request('/rest/v1/materials?select=*&order=created_at.desc');records=await request('/rest/v1/progress?select=*')}else{materials=demo;records=JSON.parse(localStorage.getItem('demo-progress')||'[]')}document.querySelector('#account').textContent=session?'Keluar':'Masuk';return render()}
const catalog = {grade: '', query: ''};
const gradeOptions = [['', 'Semua kelas'], ['VII', 'Kelas VII'], ['VIII', 'Kelas VIII'], ['IX', 'Kelas IX']];

function currentRecord(materialId) {
  return records.find(row => row.student_id === (session?.user.id || 'demo') && row.material_id === materialId);
}

function render() {
  for (const button of document.querySelectorAll('[data-page]')) {
    if (button.dataset.page === page) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  if (page === 'teacher') return renderTeacher();
  if (page === 'progress') {
    const complete = materials.filter(m => currentRecord(m.id)?.completed).length;
    view.innerHTML = `<h1>Progres saya</h1>
      <p class="muted">${complete} dari ${materials.length} materi selesai. Nilai menunjukkan hasil percobaan terakhir.${!session ? ' Progres latihan tersimpan di peramban ini.' : ''}</p>
      <div class="grid">${materials.map(m => {
        const row = currentRecord(m.id);
        return `<article class="card"><span class="tag">Kelas ${esc(m.grade)}</span><h3>${esc(m.title)}</h3>
          <progress max="100" value="${row?.completed ? 100 : 0}" aria-label="Progres ${esc(m.title)}"></progress>
          <p>${row?.completed ? 'Selesai' : 'Belum selesai'} · Nilai latihan: ${row?.score ?? 'Belum ada'}</p>
          <button class="secondary" data-open="${esc(m.id)}">Buka materi</button></article>`;
      }).join('') || '<p class="empty">Belum ada materi untuk dipelajari.</p>'}</div>`;
    return;
  }

  const mode = live && session ? 'Materi sekolah · Supabase terhubung'
    : 'Modul contoh · progres tersimpan di peramban ini';
  view.innerHTML = `<section class="hero">
    <div><span class="eyebrow">BAHASA ARAB UNTUK MTS</span>
      <h1>Mulai dari satu kata.<br><em>Berani berbicara.</em></h1>
      <p>Pelajari kosakata dan percakapan sehari-hari, lalu uji pemahamanmu lewat latihan singkat.</p>
      <a class="button" href="#materi">Jelajahi materi ↓</a>
      <p class="mode">${mode}</p>
    </div>
    <div class="hero-art"><div><strong lang="ar" dir="rtl">مَرْحَبًا</strong><span>Halo, selamat datang!</span></div></div>
  </section>
  <section id="materi" aria-labelledby="materi-title">
    <div class="catalog-head"><div><h2 id="materi-title">Materi belajar</h2><p class="muted" id="count" role="status"></p></div>
      <input id="search" type="search" aria-label="Cari materi" placeholder="Cari materi…" value="${esc(catalog.query)}">
    </div>
    <div class="row filters" role="group" aria-label="Filter kelas">${gradeOptions.map(([value, label]) =>
      `<button type="button" class="secondary" data-grade-filter="${value}" aria-pressed="${value === catalog.grade}">${label}</button>`
    ).join('')}</div>
    <div id="cards" class="grid"></div>
  </section>`;
  view.querySelector('#search').oninput = event => {
    catalog.query = event.target.value;
    drawCards();
  };
  for (const button of view.querySelectorAll('[data-grade-filter]')) {
    button.onclick = () => {
      catalog.grade = button.dataset.gradeFilter;
      for (const other of view.querySelectorAll('[data-grade-filter]')) {
        other.setAttribute('aria-pressed', String(other === button));
      }
      drawCards();
    };
  }
  drawCards();
}

function drawCards() {
  const query = catalog.query.trim().toLocaleLowerCase('id');
  const matches = materials.filter(m => {
    const details = lessonDetails.get(m.id);
    const keywords = [m.title, details?.arabic, details?.summary].join(' ').toLocaleLowerCase('id');
    return (!catalog.grade || m.grade === catalog.grade) && keywords.includes(query);
  });
  view.querySelector('#count').textContent = `${matches.length} materi tersedia`;
  view.querySelector('#cards').innerHTML = matches.map(m => {
    const details = lessonDetails.get(m.id);
    const done = currentRecord(m.id)?.completed;
    return `<article class="card lesson-card" data-grade="${esc(m.grade)}">
      <div class="lesson-cover"><span class="tag">Kelas ${esc(m.grade)}</span>
        <span class="arabic" lang="ar" dir="rtl">${esc(details?.arabic ?? 'الْعَرَبِيَّةُ')}</span></div>
      <h3>${esc(m.title)}</h3>
      ${details ? `<p class="muted">${esc(details.summary)}</p>` : ''}
      <button type="button" class="secondary" data-open="${esc(m.id)}">${done ? 'Pelajari ulang' : 'Buka materi'} →</button>
    </article>`;
  }).join('') || '<p class="empty">Materi belum tersedia untuk pilihan ini.</p>';
}

function readingMarkup(body) {
  return body.split(/\r?\n/).filter(line => line.trim()).map(line => {
    const arabic = /\p{Script=Arabic}/u.test(line) && !/\p{Script=Latin}/u.test(line);
    return `<p ${arabic ? 'class="arabic" lang="ar" dir="rtl"' : ''}>${esc(line)}</p>`;
  }).join('');
}

async function openMaterial(id) {
  const material = materials.find(m => m.id === id);
  if (!material) return;
  const hasQuiz = material.question && Array.isArray(material.options);
  view.innerHTML = `<button type="button" data-back class="secondary">← Kembali</button>
    <article class="card material"><span class="tag">Kelas ${esc(material.grade)}</span>
      <h1 tabindex="-1">${esc(material.title)}</h1>
      <div class="reading">${readingMarkup(material.body)}</div><div id="attachment"></div><hr>
      ${hasQuiz ? `<section aria-label="Latihan pemahaman"><h2>Latihan singkat</h2>
        <p dir="auto">${esc(material.question)}</p>${material.options.map((option, index) =>
          `<button class="choice secondary" dir="auto" data-choice="${index}">${esc(option)}</button>`
        ).join('')}</section>` : ''}
      <button type="button" id="complete">${currentRecord(id)?.completed ? 'Sudah selesai' : 'Tandai selesai'}</button>
      <p id="result" role="status"></p>
    </article>`;
  const article = view.querySelector('.material');
  article.querySelector('h1').focus();
  const result = article.querySelector('#result');
  const complete = article.querySelector('#complete');
  const choices = Array.from(article.querySelectorAll('[data-choice]'));
  complete.disabled = Boolean(currentRecord(id)?.completed);

  async function update(values, message) {
    const buttons = [complete, ...choices];
    buttons.forEach(button => { button.disabled = true; });
    try {
      await saveProgress(material, values);
      result.textContent = message;
    } catch (error) {
      result.textContent = error.message;
    } finally {
      buttons.forEach(button => { button.disabled = false; });
      if (currentRecord(id)?.completed) {
        complete.textContent = 'Sudah selesai';
        complete.disabled = true;
      }
    }
  }

  complete.onclick = () => update({completed: true}, 'Materi ditandai selesai.');
  for (const button of choices) {
    button.onclick = () => {
      const correct = Number(button.dataset.choice) === material.answer;
      return update({score: correct ? 100 : 0}, correct ? 'Benar! Jawabanmu tepat.'
        : 'Belum tepat. Jawaban yang benar: ' + material.options[material.answer]);
    };
  }
  if (material.file_path) {
    try {
      const signed = await request('/storage/v1/object/sign/materials/' + material.file_path, 'POST', {expiresIn: 600});
      const link = document.createElement('a');
      link.textContent = 'Buka lampiran materi ↗';
      link.href = cfg.supabaseUrl + '/storage/v1' + signed.signedURL;
      link.target = '_blank';
      link.rel = 'noopener';
      link.className = 'button secondary';
      article.querySelector('#attachment').append(link);
    } catch (error) {
      if (article.isConnected) notice(error.message);
    }
  }
}

async function saveProgress(m,values){const student_id=session?.user.id||'demo',old=records.find(x=>x.student_id===student_id&&x.material_id===m.id);const row={student_id,material_id:m.id,completed:old?.completed||false,score:old?.score??null,...values,updated_at:new Date().toISOString()};if(live&&session)await request('/rest/v1/progress?on_conflict=student_id,material_id','POST',row,{Prefer:'resolution=merge-duplicates'});records=records.filter(x=>!(x.student_id===student_id&&x.material_id===m.id)).concat(row);if(!session)localStorage.setItem('demo-progress',JSON.stringify(records))}
async function renderTeacher(){if(!session||!teacher){view.innerHTML='<section class="card"><h1>Ruang guru</h1><p>Guru dapat menambahkan materi, mengunggah lampiran, melihat progres siswa, dan mengunduh laporan CSV.</p><p>Masuk dengan akun guru yang telah administrator daftarkan. Lihat README untuk mengaktifkan backend dan akun guru.</p><button id="teacherlogin">Masuk</button></section>';document.querySelector('#teacherlogin').onclick=()=>document.querySelector('#auth').showModal();return}const profiles=await request('/rest/v1/profiles?select=*');if(page!=='teacher'||!session||!teacher)return;const students=profiles.filter(p=>p.id!==session.user.id);view.innerHTML=`<h1>Ruang guru</h1><p class="muted">Lingkup aplikasi: satu madrasah. Guru yang terdaftar dapat melihat seluruh siswa di aplikasi ini.</p><div class="grid"><div class="card"><span>Materi tersedia</span><div class="stats">${materials.length}</div></div><div class="card"><span>Akun siswa terpantau</span><div class="stats">${students.length}</div></div><div class="card"><span>Catatan penyelesaian</span><div class="stats">${records.filter(r=>r.completed).length}</div></div></div><h2>Tambah materi</h2><form id="upload" class="card"><label>Judul<input name="title" required maxlength="160"></label><label>Kelas<select name="grade"><option>VII</option><option>VIII</option><option>IX</option></select></label><label>Isi materi<textarea name="body" required></textarea></label><label>Lampiran opsional (PDF, gambar, MP3 atau MP4, maksimal 10 MB)<input name="file" type="file" accept="application/pdf,image/png,image/jpeg,audio/mpeg,video/mp4"></label><label>Pertanyaan latihan opsional<input name="question"></label><label>Tiga pilihan jawaban, satu per baris<textarea name="options"></textarea></label><label>Jawaban benar<select name="answer"><option value="0">Pilihan 1</option><option value="1">Pilihan 2</option><option value="2">Pilihan 3</option></select></label><button>Simpan materi</button></form><h2>Monitoring progres</h2><p>Persentase = materi kelas siswa yang selesai / seluruh materi kelas tersebut. Nilai menampilkan percobaan terakhir. Data ini membantu pemantauan belajar, bukan ujian berpengawasan.</p><div class="row"><select id="filter" style="width:auto"><option value="">Semua kelas</option><option>VII</option><option>VIII</option><option>IX</option></select><button id="refresh">Perbarui data</button><button id="csv" class="secondary">Unduh CSV</button></div><div class="scroll"><table><thead><tr><th>Siswa</th><th>Kelas</th><th>Selesai</th><th>Progres</th><th>Rerata nilai latihan</th><th>Aktivitas terakhir</th></tr></thead><tbody id="rows"></tbody></table></div>`;let exportRows=[];function rows(){exportRows=students.filter(s=>!document.querySelector('#filter').value||s.grade===document.querySelector('#filter').value).map(s=>{const ms=materials.filter(m=>m.grade===s.grade),rs=records.filter(r=>r.student_id===s.id&&ms.some(m=>m.id===r.material_id)),done=rs.filter(r=>r.completed).length,scores=rs.filter(r=>r.score!==null),last=rs.map(r=>r.updated_at).sort().at(-1);return [s.name,s.grade,done+'/'+ms.length,ms.length?Math.round(done/ms.length*100)+'%':'0%',scores.length?Math.round(scores.reduce((a,r)=>a+r.score,0)/scores.length):'Belum ada',last?new Date(last).toLocaleString('id-ID'):'Belum ada']});document.querySelector('#rows').innerHTML=exportRows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')}rows();document.querySelector('#filter').onchange=rows;document.querySelector('#refresh').onclick=()=>load().catch(e=>notice(e.message));
if (!live) {
  document.querySelector('#auth-note').textContent = 'Penyimpanan akun tersedia setelah sekolah menghubungkan Supabase. Modul dan progres lokal dapat digunakan sekarang.';
  for (const control of document.querySelectorAll('#authform input, #authform button[name="action"]')) control.disabled = true;
}document.querySelector('#csv').onclick=()=>{const cell=x=>'"'+String(x).replace(/^[=+@\-]/,"'$&").replaceAll('"','""')+'"';const data=[['Nama','Kelas','Selesai','Progres','Rerata nilai','Aktivitas terakhir'],...exportRows].map(r=>r.map(cell).join(',')).join('\r\n');const u=URL.createObjectURL(new Blob(['\uFEFF'+data],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='progres-siswa.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};document.querySelector('#upload').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;let file_path=null;try{const f=new FormData(e.target),file=f.get('file'),question=f.get('question').trim(),options=f.get('options').split('\n').map(x=>x.trim()).filter(Boolean);if(question&&options.length!==3)throw Error('Isi tepat tiga pilihan jawaban.');if(file.size){if(file.size>10485760||!['application/pdf','image/png','image/jpeg','audio/mpeg','video/mp4'].includes(file.type))throw Error('Format atau ukuran lampiran tidak sesuai.');file_path=session.user.id+'/'+crypto.randomUUID()+'.'+({ 'application/pdf':'pdf','image/png':'png','image/jpeg':'jpg','audio/mpeg':'mp3','video/mp4':'mp4'}[file.type]);await request('/storage/v1/object/materials/'+file_path,'POST',file,{'Content-Type':file.type})}await request('/rest/v1/materials','POST',{title:f.get('title').trim(),grade:f.get('grade'),body:f.get('body'),question:question||null,options:question?options:null,answer:question?Number(f.get('answer')):null,file_path,teacher_id:session.user.id});notice('Materi berhasil ditambahkan.');await load()}catch(err){if(file_path)await request('/storage/v1/object/materials','DELETE',{prefixes:[file_path]}).catch(()=>{});notice(err.message)}finally{b.disabled=false}}}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{page=b.dataset.page;Promise.resolve(render()).catch(e=>notice(e.message))});document.addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b)openMaterial(b.dataset.open).catch(x=>notice(x.message));if(e.target.closest('[data-back]')){Promise.resolve(render()).catch(x=>notice(x.message));view.querySelector('#search, h1')?.focus()}});document.querySelector('#account').onclick=async()=>{if(session){try{await request('/auth/v1/logout','POST')}catch{}session=null;sessionStorage.removeItem('session');page='learn';load().catch(e=>notice(e.message))}else document.querySelector('#auth').showModal()};document.querySelector('#closeauth').onclick=()=>document.querySelector('#auth').close();document.querySelector('#authform').onsubmit=async e=>{e.preventDefault();try{const f=new FormData(e.target),signup=e.submitter.value==='signup',data=await request(signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password','POST',{email:f.get('email'),password:f.get('password')});if(signup&&!data.access_token){notice('Periksa email konfirmasi, lalu masuk.');document.querySelector('#auth').close();return}session=data;sessionStorage.setItem('session',JSON.stringify(data));const exists=await request('/rest/v1/profiles?id=eq.'+session.user.id+'&select=id');if(!exists.length){const name=prompt('Nama lengkap siswa/guru:')?.trim()||'Pengguna';const grade=prompt('Kelas: VII, VIII, atau IX','VII');await request('/rest/v1/profiles','POST',{id:session.user.id,name,grade:['VII','VIII','IX'].includes(grade)?grade:'VII'})}document.querySelector('#auth').close();notice('Berhasil masuk.');await load()}catch(err){notice(err.message);document.querySelector('#auth').close()}};load().catch(e=>notice(e.message));
if (!live) {
  document.querySelector('#auth-note').textContent = 'Penyimpanan akun tersedia setelah sekolah menghubungkan Supabase. Modul dan progres lokal dapat digunakan sekarang.';
  for (const control of document.querySelectorAll('#authform input, #authform button[name="action"]')) control.disabled = true;
}
