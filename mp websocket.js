// ===== Multiplayer client (butuh server.js yang di-hosting) =====
const ghosts=()=>MP?Object.values(MP.players).filter(o=>o.id!=MP.id&&o.x!=null):[];
function multi(){show(`<h2>Multiplayer</h2><div class=nas>Pilih <b>Buat Room</b>, lalu bagikan kode 4 huruf ke temanmu. Teman membuka alamat game yang sama, memasukkan kode, dan menekan <b>Join Room</b>.</div><br>
 <button onclick="mpConnect('create')">Buat Room</button><br><br>
 <input id=rc maxlength=4 placeholder="KODE" style="font-size:20px;width:110px;text-align:center;text-transform:uppercase;padding:8px">
 <button onclick="mpConnect('join')">Join Room</button><br><br>${back}`)}
function mpConnect(kind){
  const code=kind=='join'?($('#rc').value||'').trim().toUpperCase():'';
  if(kind=='join'&&code.length!=4)return alert('Masukkan kode room (4 huruf).');
  if(location.protocol=='file:')return alert('Buka lewat alamat hosting, bukan lewat file.');
  const ws=new WebSocket((location.protocol=='https:'?'wss://':'ws://')+location.host);
  const me=MP={ws,id:null,hostId:null,host:false,code:'',players:{},starting:false,send:o=>ws.readyState==1&&ws.send(JSON.stringify(o))};
  ws.onopen=()=>me.send(kind=='join'?{t:'join',code}:{t:'create'});
  ws.onmessage=e=>onMsg(JSON.parse(e.data));
  ws.onerror=()=>{if(MP===me){MP=null;alert('Gagal terhubung ke server. Coba refresh halaman, server gratis kadang perlu waktu untuk bangun.');}};
  ws.onclose=()=>{if(MP===me){MP=null;alert('Koneksi terputus.');menu()}};
}
function mpReady(){Sfx.fx.click();MP.send({t:'ready'})}
function lobbyUI(){const ps=Object.values(MP.players);
  show(`<h2>Lobby</h2><div class=bar>Kode Room: <b style="font-size:34px;letter-spacing:8px">${MP.code}</b></div>
  <div class=card style="margin:auto">${ps.map(p=>`<p>${p.name}${p.id==MP.id?' (kamu)':''}${p.id==MP.hostId?' ★ host':''} — ${p.ready?'✅ Ready':'⏳ Belum'}</p>`).join('')}</div>
  <p class=sub>Semua pemain harus menekan Ready (maks 4 pemain).</p><button onclick=mpReady()>Ready</button><button onclick=menu()>Keluar</button>`)}
function roll(M,Lv){let n=0;const iv=setInterval(()=>{if(!MP)return clearInterval(iv);
  if(n++<18){const a=Math.floor(Math.random()*3),b=Math.floor(Math.random()*5);
   show(`<h2>Mengacak map & level...</h2><h1 style="font-size:28px;letter-spacing:2px;color:#eadfc8">${MAPS[a].name}<br>LVL ${b+1}: ${MAPS[a].levels[b].name}</h1>`);Sfx.fx.click()}
  else{clearInterval(iv);MP.starting=false;start(M,Lv)}},120)}
function onMsg(m){if(!MP)return;
  switch(m.t){
  case'err':alert(m.msg);MP.ws.onclose=null;MP.ws.close();MP=null;multi();break;
  case'room':MP.id=m.id;MP.code=m.code;break;
  case'lobby':{const old=MP.players,np={};MP.hostId=m.host;MP.host=m.host==MP.id;
    m.players.forEach((p,i)=>{const o=old[p.id]||{id:p.id,r:12};o.ready=p.ready;o.name='Pemain '+(i+1);np[p.id]=o});
    MP.players=np;if(!G&&!MP.starting)lobbyUI();break}
  case'go':{MP.starting=true;let c=3;const tick=()=>{if(!MP)return;
    if(c>0){show(`<h1>${c}</h1><p class=sub>Semua pemain siap!</p>`);Sfx.fx.click();c--;setTimeout(tick,1000)}else roll(m.m,m.l)};tick();break}
  case'closed':alert('Host keluar. Room ditutup.');menu();break;
  case'left':delete MP.players[m.from];break;
  }
  if(!G)return;
  switch(m.t){
  case'p':{const o=MP.players[m.from];if(o){o.x=m.x;o.y=m.y;o.ang=m.a;o.hp=m.hp;o.dead=m.d}break}
  case'e':if(!MP.host){G.en=m.en.map(a=>({x:a[0],y:a[1],ang:a[2],hp:a[3],state:a[4]?'alert':'patrol',det:a[5],stun:a[6]}));G.ebul=m.eb;
    if(m.mode=='barbar')enterBarbar();G.surv=m.surv}break;
  case'hit':if(MP.host)hitEnemy(m.i,m.d,m.s);break;
  case'n':if(MP.host)noise(m.x,m.y,m.r);break;
  case'fl':if(MP.host)stunAt(m.x,m.y);break;
  case'hurt':if(m.to==MP.id)hurt(m.d);break;
  case'it':{const i=G.items[m.i];if(i&&!i.got){i.got=1;G.got++;say(`${G.Lv.label}: ${G.got}/${G.Lv.n}`)}break}
  case'npc':{const n=G.npc[m.i];if(n)n.follow=m.from;break}
  case'dead':{const o=MP.players[m.from];if(o)o.dead=1;say((o?o.name:'Rekan')+' gugur!');break}
  case'b':G.bul.push({x:m.x,y:m.y,vx:m.vx,vy:m.vy,d:0,own:'o',life:.8});break;
  case'win':finish(true);break;
  case'lose':finish(false);break;
  }}