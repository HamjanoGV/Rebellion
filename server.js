// Server Rebellion: file statis + room multiplayer (WebSocket). Jalankan: node server.js
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os');
const {WebSocketServer}=require('ws');
const PORT=process.env.PORT||3000;
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
const srv=http.createServer((req,res)=>{
  let u=decodeURIComponent(req.url.split('?')[0]);if(u=='/')u='/index.html';
  const f=path.normalize(path.join(__dirname,u));
  if(!f.startsWith(__dirname)){res.writeHead(403);return res.end()}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('404')}
    res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});res.end(d)});
});
const wss=new WebSocketServer({server:srv});
const rooms={};let nid=1;
const send=(ws,o)=>ws.readyState==1&&ws.send(JSON.stringify(o));
const all=(r,o,except)=>r.clients.forEach(c=>{if(c!==except)send(c,o)});
const mk=()=>{let c;do c=Array.from({length:4},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random()*24)]).join('');while(rooms[c]);return c};
function lobby(r){all(r,{t:'lobby',host:r.host,players:[...r.clients.keys()].map(id=>({id,ready:!!r.ready[id]}))})}
function leave(ws){const r=ws.room;if(!r)return;ws.room=null;r.clients.delete(ws.id);delete r.ready[ws.id];
  if(r.host==ws.id||!r.clients.size){all(r,{t:'closed'});r.clients.forEach(c=>c.room=null);delete rooms[r.code]}
  else{all(r,{t:'left',from:ws.id});lobby(r)}}
wss.on('connection',ws=>{
  ws.id='p'+nid++;ws.room=null;
  ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch(e){return}
    if(m.t=='create'){leave(ws);const code=mk(),r=rooms[code]={code,host:ws.id,clients:new Map([[ws.id,ws]]),ready:{},started:false};
      ws.room=r;send(ws,{t:'room',id:ws.id,code});lobby(r);return}
    if(m.t=='join'){const r=rooms[String(m.code||'').toUpperCase()];
      if(!r||r.started||r.clients.size>=4)return send(ws,{t:'err',msg:'Room tidak ditemukan, sudah mulai, atau penuh.'});
      leave(ws);r.clients.set(ws.id,ws);ws.room=r;send(ws,{t:'room',id:ws.id,code:r.code});lobby(r);return}
    const r=ws.room;if(!r)return;
    if(m.t=='ready'){r.ready[ws.id]=!r.ready[ws.id];lobby(r);
      if([...r.clients.keys()].every(id=>r.ready[id])){r.started=true;all(r,{t:'go',m:Math.floor(Math.random()*3),l:Math.floor(Math.random()*5)})}return}
    m.from=ws.id;all(r,m,ws); // pesan lain diteruskan ke pemain lain di room
  });
  ws.on('close',()=>leave(ws));
});
srv.listen(PORT,'0.0.0.0',()=>{
  console.log('Rebellion berjalan. Buka di device ini: http://localhost:'+PORT);
  for(const l of Object.values(os.networkInterfaces()))for(const i of l)if(i.family=='IPv4'&&!i.internal)console.log('Device lain (satu WiFi): http://'+i.address+':'+PORT);
});
