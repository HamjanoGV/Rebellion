// ===== Rebellion: engine game top-down (Sneaky / Barbar) =====
const $=s=>document.querySelector(s),cv=$('#game'),cx=cv.getContext('2d'),ui=$('#ui');
const W=1800,H=1200;let G=null,MP=null;
function fit(){cv.width=innerWidth;cv.height=innerHeight}addEventListener('resize',fit);fit();
// --- Save ---
const defSave=()=>({money:500,parts:2,owned:{ak:1,dagger:1},gun:'ak',melee:'dagger',up:{},mods:{},items:{medkit:2,grenade:1,flash:1},done:0,naskah:[0,0,0]});
let save=(()=>{try{return Object.assign(defSave(),JSON.parse(localStorage.getItem('rebellion')))}catch(e){return defSave()}})();
const store=()=>localStorage.setItem('rebellion',JSON.stringify(save));
// --- Aset opsional: taruh PNG di folder assets/ (player.png, enemy.png, npc.png, item.png, map0.png, ...) ---
const IMG={};function img(n){if(!(n in IMG)){IMG[n]=null;const i=new Image();i.onload=()=>IMG[n]=i;i.src='assets/'+n+'.png'}return IMG[n]}
// --- Util ---
let seed=1;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angd=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
// --- Statistik senjata (upgrade + modifier) ---
function wstat(id){const b=WEAPONS[id],s={...b},up=save.up[id]||0,m=save.mods[id]||{};
  s.dmg*=1+.2*up;if(m.silencer)s.noise*=.25;if(m.stock)s.spread*=.5;
  if(m.magazine){s.mag=Math.round(s.mag*1.5);s.reload*=.7}s.scope=!!m.scope;return s}
// ================= UI / Markas =================
function show(html,hud){ui.className=hud?'hud':'';ui.innerHTML=html;ui.style.display='block'}
function hide(){ui.style.display='none'}
const bar=()=>`<div class=bar>💰 ${save.money} &nbsp; ⚙ Spare Part: ${save.parts}</div>`;
const back=`<button onclick="menu()">← Markas</button>`;
function menu(){if(MP){MP.ws.onclose=null;MP.ws.close();MP=null}G=null;Sfx.music('menu');Sfx.fx.click();
 show(`<h1>REBELLION</h1><div class=sub>Perjuangan kemerdekaan Indonesia</div>${bar()}<div class=col>
 <button onclick=mapSel()>▶ Play</button><button onclick=weaponary()>🔫 Weaponary</button>
 <button onclick=shop()>🛒 Shop</button><button onclick=naskah()>📜 Naskah (${save.naskah.filter(x=>x).length}/3)</button>
 <button onclick=multi()>👥 Multiplayer</button><button onclick=settings()>🔊 Setting Suara</button></div>`)}
function mapSel(){let h=`<h2>Pilih Map & Level</h2>${bar()}<div class=row>`;
 MAPS.forEach((m,i)=>{h+=`<div class=card><h2>Map ${i+1}: ${m.name}</h2><p>${m.theme}</p>`;
  m.levels.forEach((l,j)=>{const idx=i*5+j,ok=idx<=save.done;
   h+=`<button class=lv ${ok?'':'disabled'} onclick="start(${i},${j})">${ok?'':'🔒 '}LVL ${j+1}: ${l.name}${idx<save.done?' ✓':''}</button>`});h+='</div>'});
 show(h+`</div><br>${back}`)}
function weaponary(){let h=`<h2>Weaponary</h2>${bar()}<div class=row>`;
 for(const id in WEAPONS){if(!save.owned[id])continue;const w=WEAPONS[id],up=save.up[id]||0,eq=save[w.type=='gun'?'gun':'melee']==id,m=save.mods[id]||{};
  h+=`<div class=card><h2>${w.name}</h2><p>Damage ${wstat(id).dmg.toFixed(0)} • Upgrade ${up}/5</p>
  <button ${eq?'disabled':''} onclick="equip('${id}')">${eq?'Terpasang':'Pasang'}</button>
  <button ${up>=5?'disabled':''} onclick="upgrade('${id}')">Upgrade (💰${150*(up+1)} ⚙${up+1})</button>`;
  if(w.type=='gun')for(const k in MODS)h+=`<button ${m[k]?'disabled':''} onclick="buyMod('${id}','${k}')">${MODS[k]}${m[k]?' ✓':' (💰200 ⚙2)'}</button>`;
  h+='</div>'}
 show(h+`</div><p class=sub>Silencer: suara kecil • Stock: akurasi • Scope: pandangan luas • Magazine: peluru+reload cepat</p>${back}`)}
function equip(id){save[WEAPONS[id].type=='gun'?'gun':'melee']=id;store();Sfx.fx.click();weaponary()}
function pay(m,p){if(save.money<m||save.parts<p){Sfx.fx.hurt();return false}save.money-=m;save.parts-=p;store();Sfx.fx.pickup();return true}
function upgrade(id){const u=save.up[id]||0;if(u<5&&pay(150*(u+1),u+1))save.up[id]=u+1;store();weaponary()}
function buyMod(id,k){if(pay(200,2)){(save.mods[id]=save.mods[id]||{})[k]=1;store()}weaponary()}
function shop(){let h=`<h2>Shop</h2>${bar()}<div class=row><div class=card><h2>Item</h2>`;
 for(const k in ITEMS)h+=`<button class=lv onclick="buy('i','${k}')">${ITEMS[k].name} [${ITEMS[k].key}] x${save.items[k]} — 💰${ITEMS[k].price}</button>`;
 h+=`</div><div class=card><h2>Senjata</h2>`;
 for(const k in WEAPONS)if(WEAPONS[k].price)h+=`<button class=lv ${save.owned[k]?'disabled':''} onclick="buy('w','${k}')">${WEAPONS[k].name} — ${save.owned[k]?'dimiliki':'💰'+WEAPONS[k].price}</button>`;
 h+=`</div><div class=card><h2>Spare Part</h2><button class=lv onclick="buy('p')">Beli 1 (💰250)</button><button class=lv onclick="buy('s')" ${save.parts?'':'disabled'}>Jual 1 (💰60)</button></div></div><br>${back}`;show(h)}
function buy(t,k){if(t=='i'){if(pay(ITEMS[k].price,0))save.items[k]++}
 else if(t=='w'){if(!save.owned[k]&&pay(WEAPONS[k].price,0))save.owned[k]=1}
 else if(t=='p')pay(250,0)&&save.parts++;else if(save.parts>0){save.parts--;save.money+=60;Sfx.fx.pickup()}
 store();shop()}
function naskah(){let h=`<h2>Naskah Sejarah</h2>`;
 MAPS.forEach((m,i)=>h+=`<div class=nas><h2>${m.name}</h2>${save.naskah[i]?m.naskah:'🔒 Tamatkan 5 level map ini untuk membuka naskah.'}</div><br>`);show(h+back)}
function settings(){show(`<h2>Setting Suara</h2><p>Musik</p><input type=range min=0 max=100 value=${Sfx.vol.m*100} oninput="Sfx.setVol(this.value/100)"><p>SFX</p><input type=range min=0 max=100 value=${Sfx.vol.s*100} oninput="Sfx.setVol(null,this.value/100)" onchange="Sfx.fx.shoot()"><br><br>
 <button class=red onclick="if(confirm('Hapus semua progress?')){save=defSave();store();menu()}">Reset Progress</button><br>${back}`)}
// ================= Mulai Level =================
function wallAt(x,y,r=0){for(const w of G.walls)if(x>w.x-r&&x<w.x+w.w+r&&y>w.y-r&&y<w.y+w.h+r)return true;return false}
function freePos(x0,x1,y0,y1){for(let i=0;i<200;i++){const x=x0+rnd()*(x1-x0),y=y0+rnd()*(y1-y0);if(!wallAt(x,y,24))return{x,y}}return{x:(x0+x1)/2,y:(y0+y1)/2}}
function start(m,l){const Lv=MAPS[m].levels[l];seed=m*10+l+7;Sfx.fx.click();
 const gs=wstat(save.gun);
 G={m,l,Lv,t:0,mode:'sneaky',walls:[{x:-40,y:-40,w:W+80,h:40},{x:-40,y:H,w:W+80,h:40},{x:-40,y:0,w:40,h:H},{x:W,y:0,w:40,h:H}],
  en:[],npc:[],items:[],drops:[],bul:[],nades:[],got:0,surv:0,waveT:6,loot:{money:0,parts:0},time:Lv.time,paused:false,inv:false,over:false,msg:'',msgT:0,kills:0,
  p:{x:100,y:600,r:12,hp:100,ang:0,slot:'gun',cd:0,rel:0,ammo:gs.mag,hurt:0},exit:{x:1700,y:600,r:55},cam:{x:100,y:600},mouse:{x:0,y:0,down:false}};
 for(let i=0;i<16;i++){const w=60+rnd()*160,h=40+rnd()*140,x=rnd()*(W-w),y=rnd()*(H-h);
  if(x<260&&y>400&&y<800||x+w>1500&&y+h>400&&y<800)continue;G.walls.push({x,y,w,h})}
 for(let i=0;i<Lv.n;i++){const p=freePos(350,1500,60,1140);G.items.push({...p,got:0})}
 for(let i=0;i<Lv.rescue;i++){const p=freePos(350,1500,60,1140);G.npc.push({...p,r:11,follow:0})}
 for(let i=0;i<Lv.en;i++)spawnEnemy(false);
 if(MP)for(const o of Object.values(MP.players)){o.x=null;o.dead=0;o.hp=100}
 Sfx.music('sneaky');hide();say(Lv.name+' — '+Lv.obj,4)}
function spawnEnemy(alert){let p,a=freePos(450,1650,40,1160);
 if(alert){const s=Math.floor(rnd()*4);p=[{x:900,y:30},{x:900,y:1170},{x:1770,y:300+rnd()*600},{x:1770,y:700}][s]}else p=a;
 const q=freePos(p.x-150,p.x+150,p.y-150,p.y+150);
 G.en.push({x:p.x,y:p.y,r:12,hp:50+G.m*10,ang:rnd()*6.28,state:alert?'alert':'patrol',det:alert?1:0,cd:1,stun:0,wp:[{x:p.x,y:p.y},q],wi:1})}
function say(t,s=2.5){G.msg=t;G.msgT=s}
// ================= Logika =================
function los(a,b){const n=Math.ceil(dist(a,b)/16);for(let i=1;i<n;i++)if(wallAt(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;return true}
function move(o,dx,dy){if(!wallAt(o.x+dx,o.y,o.r))o.x+=dx;if(!wallAt(o.x,o.y+dy,o.r))o.y+=dy}
function noise(x,y,r){if(MP&&!MP.host){MP.send({t:'n',x,y,r});return}let any=false;for(const e of G.en)if(e.hp>0&&e.state!='alert'&&dist(e,{x,y})<r){e.state='alert';e.det=1;any=true}if(any)barbar()}
function barbar(){if(MP&&!MP.host)return;enterBarbar()}
function enterBarbar(){if(G.mode=='sneaky'){G.mode='barbar';G.waveT=8;Sfx.fx.alert();Sfx.music('barbar');say('TERDETEKSI! Bertahan sampai jalur keluar terbuka.',4)}}
function hurt(d){const p=G.p;if(p.dead)return;p.hp-=d;p.hurt=.2;Sfx.fx.hurt();if(p.hp<=0){if(MP){p.dead=true;say('Kamu gugur. Tunggu rekanmu...',4);MP.send({t:'dead'})}else finish(false)}}
function killEnemy(e){e.hp=0;G.kills++;const r=rnd();
 if(r<.5){G.drops.push({x:e.x,y:e.y,t:'money',v:10+Math.floor(rnd()*20)})}if(rnd()<.15)G.drops.push({x:e.x+10,y:e.y,t:'part',v:1})}
function dmgEnemy(e,d){if(e.hp<=0)return;e.hp-=d;Sfx.fx.hit();if(e.state!='alert'){e.state='alert';e.det=1;barbar()}if(e.hp<=0)killEnemy(e)}
function hitEnemy(i,d,s){const e=G.en[i];if(!e||e.hp<=0)return;
 if(MP&&!MP.host){MP.send({t:'hit',i,d,s:s?1:0});Sfx.fx.hit();return}
 if(s){killEnemy(e);Sfx.fx.hit()}else dmgEnemy(e,d)}
function stunAt(x,y){if(MP&&!MP.host){MP.send({t:'fl',x,y});return}for(const e of G.en)if(dist(e,{x,y})<240)e.stun=4}
function fire(){const p=G.p,w=wstat(save[p.slot]);if(p.cd>0||p.rel>0)return;p.cd=w.rate;
 if(w.type=='melee'){Sfx.fx.melee();noise(p.x,p.y,w.noise);
  G.en.forEach((e,i)=>{if(e.hp>0&&dist(e,p)<w.range+12&&angd(Math.atan2(e.y-p.y,e.x-p.x),p.ang)<.9){
   if(e.state!='alert'&&e.det<.6&&angd(e.ang,p.ang)<1.2){hitEnemy(i,999,1);say('Stealth kill!',1)}else hitEnemy(i,w.dmg)}});
  return}
 const a=p.ang+(Math.random()-.5)*w.spread*2;Sfx.fx.shoot(w.noise<200);noise(p.x,p.y,w.noise);
 G.bul.push({x:p.x,y:p.y,vx:Math.cos(a)*720,vy:Math.sin(a)*720,d:w.dmg,own:'p',life:.8});
 if(MP)MP.send({t:'b',x:p.x,y:p.y,vx:Math.cos(a)*720,vy:Math.sin(a)*720});
 if(--p.ammo<=0){p.rel=w.reload;Sfx.fx.reload();p.ammo=w.mag}}
function useItem(k){const it=G.p,n=save.items[k];if(!n||it.dead)return;
 if(k=='medkit'){if(it.hp>=100)return;it.hp=Math.min(100,it.hp+40);Sfx.fx.medkit()}
 else{const m=G.mouse,d=Math.min(260,dist(it,m));G.nades.push({x:it.x+Math.cos(it.ang)*d,y:it.y+Math.sin(it.ang)*d,t:.8,k})}
 save.items[k]--;store()}
function interact(){const p=G.p;if(p.dead)return;
 for(const [k,i] of G.items.entries())if(!i.got&&dist(i,p)<38){i.got=1;G.got++;if(MP)MP.send({t:'it',i:k});Sfx.fx.pickup();say(`${G.Lv.label}: ${G.got}/${G.Lv.n}`);return}
 for(const [k,n] of G.npc.entries())if(!n.follow&&dist(n,p)<44){n.follow=MP?MP.id:1;if(MP)MP.send({t:'npc',i:k});Sfx.fx.interact();say('Warga mengikutimu. Antar ke titik aman!');return}}
function update(dt){const g=G,p=g.p;g.t+=dt;
 let mx=(K.d?1:0)-(K.a?1:0),my=(K.s?1:0)-(K.w?1:0);
 const live=!p.dead&&!g.paused;if(live&&(mx||my)){const l=Math.hypot(mx,my);move(p,mx/l*165*dt,my/l*165*dt)}
 const sc=wstat(save.gun).scope?.8:1;g.sc=sc;
 g.cam.x+=(p.x-g.cam.x)*.12;g.cam.y+=(p.y-g.cam.y)*.12;
 g.mouse.wx=(g.mouse.x-cv.width/2)/sc+g.cam.x;g.mouse.wy=(g.mouse.y-cv.height/2)/sc+g.cam.y;
 p.ang=Math.atan2(g.mouse.wy-p.y,g.mouse.wx-p.x);p.cd-=dt;p.rel-=dt;p.hurt-=dt;
 if(live&&g.mouse.down)fire();
 // musuh (di multiplayer hanya host yang mensimulasikan)
 const T=[p,...ghosts()].filter(o=>o.hp>0&&!o.dead);
 if(!MP||MP.host)for(const e of g.en){if(e.hp<=0)continue;e.stun-=dt;if(e.stun>0)continue;
  let t=p,bd=1e9;for(const o of T){const dd=dist(e,o);if(dd<bd){bd=dd;t=o}}
  const d=bd<1e9?bd:dist(e,p),ta=Math.atan2(t.y-e.y,t.x-e.x),see=T.length>0&&d<(e.state=='alert'?520:260)&&angd(ta,e.ang)<(e.state=='alert'?3.2:.6)&&los(e,t);
  if(e.state=='patrol'){const w=e.wp[e.wi];if(dist(e,w)<8)e.wi=1-e.wi;
   e.ang=Math.atan2(w.y-e.y,w.x-e.x);move(e,Math.cos(e.ang)*70*dt,Math.sin(e.ang)*70*dt);
   if(see)e.det+=dt*(1+(260-d)/130);else e.det=Math.max(0,e.det-dt*.5);
   if(e.det>=1){e.state='alert';barbar()}}
  else{e.ang=ta;if(d>190)move(e,Math.cos(ta)*105*dt,Math.sin(ta)*105*dt);
   e.cd-=dt;if(see&&e.cd<=0&&d<520){e.cd=.8+Math.random()*.4;const a=ta+(Math.random()-.5)*.25;
    g.bul.push({x:e.x,y:e.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,d:7,own:'e',life:1.4})}}}
 // peluru
 for(const b of g.bul){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(wallAt(b.x,b.y))b.life=0;
  if(b.own=='p'){for(const [i,e] of g.en.entries())if(e.hp>0&&Math.hypot(e.x-b.x,e.y-b.y)<13){hitEnemy(i,b.d);b.life=0;break}}
  else if(b.own=='e'){if(!p.dead&&Math.hypot(p.x-b.x,p.y-b.y)<p.r+2){hurt(b.d);b.life=0}
   else for(const o of ghosts())if(!o.dead&&Math.hypot(o.x-b.x,o.y-b.y)<14){MP.send({t:'hurt',to:o.id,d:b.d});b.life=0;break}}}
 g.bul=g.bul.filter(b=>b.life>0);
 // granat / flashbang
 for(const n of g.nades){n.t-=dt;if(n.t<=0){n.dead=1;if(n.k=='grenade'){Sfx.fx.nade();noise(n.x,n.y,700);g.en.forEach((e,i)=>{if(e.hp>0&&dist(e,n)<100)hitEnemy(i,90)});if(dist(p,n)<100)hurt(30)}
  else{Sfx.fx.flash();stunAt(n.x,n.y)}g.fxs=g.fxs||[];g.fxs.push({x:n.x,y:n.y,t:.3,k:n.k})}}
 g.nades=g.nades.filter(n=>!n.dead);if(g.fxs)g.fxs=g.fxs.filter(f=>(f.t-=dt)>0);
 // drop
 for(const d of g.drops)if(dist(d,p)<24){d.got=1;Sfx.fx.pickup();d.t=='money'?g.loot.money+=d.v:g.loot.parts+=d.v}
 g.drops=g.drops.filter(d=>!d.got);
 // NPC ikut
 let fl=0;for(const n of g.npc)if(n.follow){fl++;const q=(MP&&n.follow!=MP.id&&MP.players[n.follow]&&MP.players[n.follow].x!=null)?MP.players[n.follow]:p,d=dist(n,q);if(d>50){const a=Math.atan2(q.y-n.y,q.x-n.x);n.r=11;move(n,Math.cos(a)*150*dt,Math.sin(a)*150*dt)}}
 // mode barbar
 if(g.mode=='barbar'){g.surv+=dt;g.waveT-=dt;const alive=g.en.filter(e=>e.hp>0).length;
  if(g.waveT<=0&&alive<14&&(!MP||MP.host)){g.waveT=13;for(let i=0;i<2+g.m;i++)spawnEnemy(true);say('Gelombang musuh!',1.5)}}
 // waktu & selesai
 if(g.time>0){g.time-=dt;if(g.time<=0){g.time=0;say('Waktu habis!');finish(false)}}
 const open=g.mode=='sneaky'||g.surv>=25,ready=g.got>=g.Lv.n&&fl>=g.Lv.rescue;
 g.open=open;g.ready=ready;
 if(dist(p,g.exit)<g.exit.r&&!g.over&&!p.dead){if(ready&&open){if(MP)MP.send({t:'win'});finish(true)}else if(g.msgT<=0)say(!ready?'Objektif belum selesai.':'Jalur keluar masih dikunci, bertahan!',1.5)}
 g.msgT-=dt;
 if(MP){g.sendT=(g.sendT||0)-dt;if(g.sendT<=0){g.sendT=.05;
  MP.send({t:'p',x:+p.x.toFixed(1),y:+p.y.toFixed(1),a:+p.ang.toFixed(2),hp:p.hp,d:p.dead?1:0});
  if(MP.host)MP.send({t:'e',en:g.en.map(e=>[+e.x.toFixed(1),+e.y.toFixed(1),+e.ang.toFixed(2),e.hp,e.state=='alert'?1:0,+e.det.toFixed(2),e.stun>0?1:0]),eb:g.bul.filter(b=>b.own=='e').map(b=>[b.x|0,b.y|0]),mode:g.mode,surv:g.surv})}
  if(MP.host&&p.dead&&!g.over&&!ghosts().some(o=>!o.dead)){MP.send({t:'lose'});finish(false)}}}
function finish(win){const g=G;if(g.over)return;g.over=true;Sfx.music(null);
 if(win){Sfx.fx.win();const idx=g.m*5+g.l,r=g.Lv.reward+g.loot.money;save.money+=r;save.parts+=g.loot.parts;
  if(!MP){if(idx>=save.done)save.done=idx+1;if(g.l==4)save.naskah[g.m]=1}store();
  show(`<h1 style="font-size:40px;color:#7bc86c">MISI BERHASIL</h1><div class=nas><p>${g.Lv.end||'Misi selesai. Perjuangan berlanjut.'}</p><p>💰 +${r} &nbsp; ⚙ +${g.loot.parts} &nbsp; Musuh: ${g.kills}</p>${MP?'<p>Mode multiplayer: progres story & naskah tidak berubah.</p>':''}${g.l==4&&!MP?'<p>📜 Naskah baru terbuka di Markas!</p>':''}</div><br><button onclick=menu()>Markas</button>${MP?'':'<button onclick=mapSel()>Pilih Level</button>'}`)}
 else{Sfx.fx.lose();show(`<h1 style="font-size:40px">GUGUR</h1><p class=sub>Misi gagal.</p>${MP?'':`<button onclick="start(${g.m},${g.l})">Coba Lagi</button>`}<button onclick=menu()>Markas</button>`)}}
// ================= Render =================
function draw(){const g=G,p=g.p,sc=g.sc||1,w=cv.width,h=cv.height;
 cx.setTransform(1,0,0,1,0,0);cx.fillStyle='#000';cx.fillRect(0,0,w,h);
 cx.setTransform(sc,0,0,sc,w/2-g.cam.x*sc,h/2-g.cam.y*sc);
 const bg=img('map'+g.m);if(bg)cx.drawImage(bg,0,0,W,H);else{cx.fillStyle=MAPS[g.m].floor;cx.fillRect(0,0,W,H);
  cx.strokeStyle='rgba(255,255,255,.04)';for(let i=0;i<W;i+=60){cx.beginPath();cx.moveTo(i,0);cx.lineTo(i,H);cx.stroke()}for(let j=0;j<H;j+=60){cx.beginPath();cx.moveTo(0,j);cx.lineTo(W,j);cx.stroke()}}
 cx.fillStyle='#4b4036';for(const k of g.walls)cx.fillRect(k.x,k.y,k.w,k.h);
 cx.fillStyle=g.open&&g.ready?'rgba(80,220,80,.35)':'rgba(220,60,50,.3)';cx.beginPath();cx.arc(g.exit.x,g.exit.y,g.exit.r,0,7);cx.fill();
 cx.fillStyle='#fff';cx.font='13px Georgia';cx.textAlign='center';cx.fillText('TITIK AMAN',g.exit.x,g.exit.y+4);
 for(const i of g.items)if(!i.got)sprite('item',i.x,i.y,0,22,()=>{cx.fillStyle='#f0c040';cx.fillRect(i.x-8,i.y-8,16,16)});
 for(const d of g.drops){cx.fillStyle=d.t=='money'?'#6fd36f':'#69b7ff';cx.beginPath();cx.arc(d.x,d.y,5,0,7);cx.fill()}
 for(const n of g.npc)sprite('npc',n.x,n.y,0,26,()=>{cx.fillStyle=n.follow?'#9ad':'#6af';cx.beginPath();cx.arc(n.x,n.y,11,0,7);cx.fill()});
 for(const e of g.en){if(e.hp<=0){cx.fillStyle='#444';cx.beginPath();cx.arc(e.x,e.y,10,0,7);cx.fill();continue}
  if(e.state=='patrol'){cx.fillStyle=e.det>.4?'rgba(255,200,0,.18)':'rgba(255,255,255,.1)';cx.beginPath();cx.moveTo(e.x,e.y);cx.arc(e.x,e.y,260,e.ang-.6,e.ang+.6);cx.fill()}
  sprite('enemy',e.x,e.y,e.ang,28,()=>{cx.fillStyle=e.stun>0?'#999':e.state=='alert'?'#d33':'#c97';cx.beginPath();cx.arc(e.x,e.y,12,0,7);cx.fill();cx.fillRect(e.x+Math.cos(e.ang)*8-2,e.y+Math.sin(e.ang)*8-2,5,5)});
  if(e.hp<(50+g.m*10)){cx.fillStyle='#300';cx.fillRect(e.x-14,e.y+16,28,4);cx.fillStyle='#d33';cx.fillRect(e.x-14,e.y+16,28*e.hp/(50+g.m*10),4)}
  if(e.state=='patrol'&&e.det>0){cx.fillStyle='#fc0';cx.fillRect(e.x-14,e.y-22,28*Math.min(1,e.det),3)}}
 sprite('player',p.x,p.y,p.ang,28,()=>{cx.fillStyle=p.hurt>0?'#fff':'#5a8a4a';cx.beginPath();cx.arc(p.x,p.y,12,0,7);cx.fill();cx.strokeStyle='#222';cx.lineWidth=4;cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(p.x+Math.cos(p.ang)*20,p.y+Math.sin(p.ang)*20);cx.stroke()});
 for(const o of ghosts()){cx.fillStyle=o.dead?'#555':'#4aa3ff';cx.beginPath();cx.arc(o.x,o.y,12,0,7);cx.fill();cx.strokeStyle='#123';cx.lineWidth=4;cx.beginPath();cx.moveTo(o.x,o.y);cx.lineTo(o.x+Math.cos(o.ang)*20,o.y+Math.sin(o.ang)*20);cx.stroke();cx.fillStyle='#fff';cx.font='12px Georgia';cx.textAlign='center';cx.fillText(o.name,o.x,o.y-20)}
 for(const b of g.ebul||[]){cx.fillStyle='#ff7b5a';cx.fillRect(b[0]-2,b[1]-2,4,4)}
 for(const b of g.bul){cx.fillStyle=b.own!='e'?'#ffe28a':'#ff7b5a';cx.fillRect(b.x-2,b.y-2,4,4)}
 for(const n of g.nades){cx.fillStyle=n.k=='grenade'?'#2a4':'#ddd';cx.beginPath();cx.arc(n.x,n.y,6,0,7);cx.fill()}
 for(const f of g.fxs||[]){cx.fillStyle=f.k=='grenade'?'rgba(255,150,40,.5)':'rgba(255,255,255,.7)';cx.beginPath();cx.arc(f.x,f.y,f.k=='grenade'?100:240*(1-f.t),0,7);cx.fill()}
 hud(w,h)}
function sprite(n,x,y,a,s,fb){const i=img(n);if(!i)return fb();cx.save();cx.translate(x,y);cx.rotate(a);cx.drawImage(i,-s/2,-s/2,s,s);cx.restore()}
function hud(w,h){const g=G,p=g.p,s=wstat(save[p.slot]);cx.setTransform(1,0,0,1,0,0);cx.textAlign='left';cx.font='15px Georgia';
 cx.fillStyle='#000a';cx.fillRect(18,h-44,204,26);cx.fillStyle='#b33';cx.fillRect(20,h-42,200*Math.max(0,p.hp)/100,22);cx.fillStyle='#fff';cx.fillText('HP '+Math.ceil(Math.max(0,p.hp)),28,h-25);
 cx.textAlign='right';cx.fillStyle='#fff';
 cx.fillText(`[${p.slot=='gun'?'1':'2'}] ${WEAPONS[save[p.slot]].name}  ${p.slot=='gun'?(p.rel>0?'RELOAD':p.ammo+'/'+s.mag):''}`,w-20,h-52);
 cx.fillText(`Z Medkit ${save.items.medkit}   X Granat ${save.items.grenade}   C Flash ${save.items.flash}`,w-20,h-28);
 cx.textAlign='center';cx.font='17px Georgia';cx.fillStyle='#e0b45a';
 cx.fillText(`${g.Lv.obj}  |  ${g.Lv.label?g.Lv.label+' '+g.got+'/'+g.Lv.n:''} ${g.Lv.rescue?' Warga '+g.npc.filter(n=>n.follow).length+'/'+g.Lv.rescue:''}`,w/2,26);
 cx.fillStyle=g.mode=='sneaky'?'#7bc86c':'#e44';cx.fillText(g.mode=='sneaky'?'MODE: SNEAKY':`MODE: BARBAR — keluar terbuka ${g.surv>=25?'✓':Math.ceil(25-g.surv)+'d'}`,w/2,50);
 if(g.time>0){cx.fillStyle='#fff';cx.fillText('⏱ '+Math.floor(g.time/60)+':'+String(Math.floor(g.time%60)).padStart(2,'0'),w/2,74)}
 if(g.msgT>0){cx.fillStyle='#fff';cx.font='20px Georgia';cx.fillText(g.msg,w/2,h-90)}
 if(g.inv){cx.fillStyle='#000c';cx.fillRect(w/2-200,h/2-130,400,260);cx.fillStyle='#e0b45a';cx.fillText('INVENTORY',w/2,h/2-100);cx.fillStyle='#fff';cx.font='16px Georgia';
  [`Senjata: ${WEAPONS[save.gun].name} (dmg ${wstat(save.gun).dmg.toFixed(0)})`,`Melee: ${WEAPONS[save.melee].name} (dmg ${wstat(save.melee).dmg.toFixed(0)})`,`Medkit ${save.items.medkit} • Granat ${save.items.grenade} • Flash ${save.items.flash}`,`Loot misi ini: 💰${g.loot.money}  ⚙${g.loot.parts}`].forEach((t,i)=>cx.fillText(t,w/2,h/2-60+i*34))}}
// ================= Input & Loop =================
const K={};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k=='tab')e.preventDefault();if(e.repeat)return;K[k]=1;if(!G||G.over)return;
 if(k=='escape')pause();if(G.paused)return;
 if(k=='f')interact();else if(k=='tab')G.inv=!G.inv;
 else if(k=='1'){G.p.slot='gun'}else if(k=='2'){G.p.slot='melee'}
 else if(k=='z')useItem('medkit');else if(k=='x')useItem('grenade');else if(k=='c')useItem('flash')});
addEventListener('keyup',e=>K[e.key.toLowerCase()]=0);
cv.addEventListener('mousemove',e=>{if(G){G.mouse.x=e.clientX;G.mouse.y=e.clientY}});
cv.addEventListener('mousedown',e=>{if(G&&!G.paused){G.mouse.down=true;G.mouse.x=e.clientX;G.mouse.y=e.clientY}});
addEventListener('mouseup',()=>{if(G)G.mouse.down=false});
cv.addEventListener('contextmenu',e=>e.preventDefault());
function pause(){if(G.over)return;G.paused=!G.paused;G.mouse.down=false;
 if(G.paused)show(`<h2>Pause</h2><div class=col><button onclick=pause2()>Lanjut</button>${MP?'':'<button onclick="start(G.m,G.l)">Restart</button>'}<button class=red onclick=menu()>Exit Mission</button></div>`,1);else hide()}
function pause2(){G.paused=false;hide()}
let last=0;function loop(t){const dt=Math.min(.05,(t-last)/1000);last=t;
 if(G&&(!G.paused||MP)&&!G.over){update(dt);}
 if(G)draw();else{cx.setTransform(1,0,0,1,0,0);cx.fillStyle='#14110d';cx.fillRect(0,0,cv.width,cv.height)}
 requestAnimationFrame(loop)}
menu();requestAnimationFrame(loop);