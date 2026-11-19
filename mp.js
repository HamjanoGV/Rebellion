// ===== Multiplayer client (peer-to-peer via PeerJS, tanpa server.js) =====
// Host = pemain yang membuat room. Pemain lain terhubung langsung ke host.
const PEER_PREFIX='rebellion-game-';
const CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ';
const newCode=()=>Array.from({length:4},()=>CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]).join('');
const ROOM_ERR='Room tidak ditemukan, sudah mulai, atau penuh.';
// TURN bawaan PeerJS sudah mati sejak Des 2023, jadi kita beri server sendiri.
// Server TURN publik di bawah ini gratis tapi tanpa jaminan. Kalau tidak jalan,
// buat akun gratis di metered.ca (Open Relay) lalu ganti username & credential.
const PEER_OPTS={debug:1,config:{iceServers:[
  {urls:'stun:stun.l.google.com:19302'},
  {urls:'stun:stun1.l.google.com:19302'},
  {urls:'stun:global.stun.twilio.com:3478'},
  {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'}
]}};
const mpLog=(...a)=>console.log('[MP]',...a);

const ghosts=()=>MP?Object.values(MP.players).filter(o=>o.id!=MP.id&&o.x!=null):[];
function multi(){show(`<h2>Multiplayer</h2><div class=nas>Pilih <b>Buat Room</b>, lalu bagikan kode 4 huruf ke temanmu. Teman membuka alamat game yang sama, memasukkan kode, dan menekan <b>Join Room</b>. Tidak perlu satu WiFi. Host (pembuat room) jangan keluar selama bermain.</div><br>
 <button onclick="mpConnect('create')">Buat Room</button><br><br>
 <input id=rc maxlength=4 placeholder="KODE" style="font-size:20px;width:110px;text-align:center;text-transform:uppercase;padding:8px">
 <button onclick="mpConnect('join')">Join Room</button><br><br>${back}`)}

function mpConnect(kind){
  const code=kind=='join'?($('#rc').value||'').trim().toUpperCase():'';
  if(kind=='join'&&code.length!=4)return alert('Masukkan kode room (4 huruf).');
  if(typeof Peer=='undefined')return alert('Library PeerJS gagal dimuat. Periksa internet lalu refresh halaman.');
  if(MP){const old=MP;MP=null;try{old.ws.close()}catch(e){}}
  kind=='join'?mpJoin(code):mpHost(0);
}

// ---------- HOST: menjalankan logika room (pengganti server.js) ----------
function mpHost(tries){
  const code=newCode();
  const peer=new Peer(PEER_PREFIX+code,PEER_OPTS);
  const conns=new Map(),order=[],ready={};
  mpLog('host membuat room',code);
  let started=false,opened=false;

  const send=(c,o)=>{try{if(c.open)c.send(o)}catch(e){}};
  const toAll=(o,except)=>conns.forEach((c,id)=>{if(id!=except)send(c,o)});
  const local=o=>{if(MP===me)onMsg(o)};
  const lobby=()=>{const o={t:'lobby',host:peer.id,players:order.map(id=>({id,ready:!!ready[id]}))};toAll(o);local(o)};
  const handle=(id,m)=>{
    if(!m||typeof m!='object')return;
    if(m.t=='ready'){
      if(started)return;
      ready[id]=!ready[id];lobby();
      if(order.every(i=>ready[i])){
        started=true;
        const go={t:'go',m:Math.floor(Math.random()*3),l:Math.floor(Math.random()*5)};
        toAll(go);local(go);
      }
      return;
    }
    m.from=id;toAll(m,id);local(m); // pesan lain diteruskan ke pemain lain + diproses host
  };

  const ws={readyState:0,onclose:null,close(){
    if(ws.readyState==3)return;ws.readyState=3;
    toAll({t:'closed'});
    setTimeout(()=>{try{peer.destroy()}catch(e){}},300);
  }};
  const me=MP={ws,id:null,hostId:null,host:false,code:'',players:{},starting:false,
    send:o=>{
      if(ws.readyState!=1||!o)return;
      if(o.t=='ready')return handle(peer.id,o);
      toAll(Object.assign({},o,{from:peer.id}));
    }};

  peer.on('open',()=>{
    opened=true;ws.readyState=1;order.push(peer.id);
    mpLog('room siap, menunggu pemain. Kode:',code);
    local({t:'room',id:peer.id,code});
    lobby();
  });

  peer.on('connection',c=>{
    mpLog('ada pemain mencoba join:',c.peer);
    c.on('open',()=>{
      mpLog('koneksi ke pemain terbuka:',c.peer);
      if(started||order.length>=4){send(c,{t:'err',msg:ROOM_ERR});setTimeout(()=>{try{c.close()}catch(e){}},400);return}
      conns.set(c.peer,c);order.push(c.peer);
      send(c,{t:'room',id:c.peer,code});
      lobby();
    });
    c.on('data',m=>{if(conns.get(c.peer)===c)handle(c.peer,m)});
    const gone=()=>{
      if(conns.get(c.peer)!==c)return;
      conns.delete(c.peer);
      const i=order.indexOf(c.peer);if(i>=0)order.splice(i,1);
      delete ready[c.peer];
      const l={t:'left',from:c.peer};toAll(l);local(l);
      lobby();
    };
    c.on('close',gone);c.on('error',gone);
  });

  peer.on('disconnected',()=>{try{if(ws.readyState==1&&!peer.destroyed)peer.reconnect()}catch(e){}});

  peer.on('error',e=>{
    if(e.type=='unavailable-id'&&!opened&&tries<5){ // kode room bentrok, coba kode lain
      ws.readyState=3;try{peer.destroy()}catch(x){}
      if(MP===me)MP=null;
      return mpHost(tries+1);
    }
    if(!opened&&MP===me){
      ws.readyState=3;try{peer.destroy()}catch(x){}
      MP=null;alert('Gagal membuat room ('+e.type+'). Periksa koneksi internet.');multi();
    }else console.warn('PeerJS:',e);
  });
}

// ---------- PEMAIN: terhubung ke host ----------
function mpJoin(code){
  const peer=new Peer(PEER_OPTS);
  let conn=null,ended=false,joined=false,timer=null;
  mpLog('mencoba join room',code);

  const ws={readyState:0,onclose:null,close(){
    if(ws.readyState==3)return;ws.readyState=3;
    clearTimeout(timer);
    try{peer.destroy()}catch(e){}
  }};
  const me=MP={ws,id:null,hostId:null,host:false,code:'',players:{},starting:false,
    send:o=>{try{if(conn&&conn.open)conn.send(o)}catch(e){}}};

  const fail=msg=>{if(MP===me)onMsg({t:'err',msg})};
  timer=setTimeout(()=>{if(!joined)fail('Gagal terhubung ke room (waktu habis). Kemungkinan jaringan kalian tidak bisa saling terhubung langsung. Coba WiFi yang sama atau hotspot, lalu coba lagi.')},25000);

  peer.on('open',id=>{
    mpLog('terhubung ke server perantara, id saya:',id);
    conn=peer.connect(PEER_PREFIX+code,{reliable:true,serialization:'json'});
    conn.on('open',()=>{ws.readyState=1;mpLog('koneksi ke host terbuka')});
    conn.on('data',m=>{
      if(!m||MP!==me)return;
      if(m.t=='room'){joined=true;clearTimeout(timer)}
      if(m.t=='err')clearTimeout(timer);
      if(m.t=='closed'){ended=true;onMsg(m);ws.close();return}
      onMsg(m);
    });
    conn.on('close',()=>{
      clearTimeout(timer);
      if(ended||MP!==me)return;
      ended=true;
      if(joined)onMsg({t:'closed'});else fail(ROOM_ERR);
    });
    conn.on('error',()=>{if(!joined)fail('Gagal terhubung ke room.')});
  });

  peer.on('error',e=>{
    clearTimeout(timer);
    mpLog('error PeerJS (pemain):',e.type,e);
    if(MP!==me)return;
    if(e.type=='peer-unavailable')fail(ROOM_ERR);
    else if(!joined)fail('Gagal terhubung ('+e.type+'). Coba lagi.');
    else console.warn('PeerJS:',e);
  });
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