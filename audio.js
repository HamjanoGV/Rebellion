// Audio sintetis (WebAudio): SFX + musik prosedural, tanpa file. Bisa diganti file asli nanti.
const Sfx=(()=>{
  let ac,mg,sg,nb,mode=null,tm,step=0;const vol={m:.5,s:.8};
  const NOTES={menu:[57,0,60,0,64,0,60,0,55,0,59,0,62,0,59,0],
    sneaky:[45,0,0,0,48,0,0,0,45,0,0,0,43,0,0,46],
    barbar:[45,45,57,45,48,48,60,48,43,43,55,43,46,46,58,52]};
  const BPM={menu:70,sneaky:80,barbar:150};
  const mtof=n=>440*Math.pow(2,(n-69)/12);
  function init(){
    if(ac){if(ac.state=='suspended')ac.resume();return}
    ac=new (window.AudioContext||window.webkitAudioContext)();
    mg=ac.createGain();sg=ac.createGain();mg.connect(ac.destination);sg.connect(ac.destination);
    nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=nb.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    setVol();if(mode){const m=mode;mode=null;music(m)}
  }
  function setVol(m,s){if(m!=null)vol.m=m;if(s!=null)vol.s=s;if(ac){mg.gain.value=vol.m*.5;sg.gain.value=vol.s}}
  function tone(f,d,type='square',v=.2,slide=0,t0=0,dest){
    if(!ac)return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+t0;
    o.type=type;o.frequency.setValueAtTime(f,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),t+d);
    g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);
    o.connect(g);g.connect(dest||sg);o.start(t);o.stop(t+d+.02);
  }
  function noise(d,v=.3,freq=800,type='highpass',t0=0,dest){
    if(!ac)return;const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain(),t=ac.currentTime+t0;
    s.buffer=nb;f.type=type;f.frequency.value=freq;
    g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);
    s.connect(f);f.connect(g);g.connect(dest||sg);s.start(t);s.stop(t+d+.02);
  }
  const fx={
    shoot:(sil)=>{noise(sil?.06:.15,sil?.12:.4,sil?3000:1200);tone(sil?200:120,.1,'sawtooth',sil?.05:.2,-60)},
    melee:()=>noise(.12,.2,2500,'bandpass'),
    reload:()=>{tone(300,.05,'square',.1);tone(500,.05,'square',.1,0,.35)},
    hit:()=>{noise(.08,.25,500,'lowpass');tone(160,.08,'square',.1,-80)},
    hurt:()=>{tone(180,.2,'sawtooth',.25,-100)},
    pickup:()=>{tone(660,.08,'triangle',.25);tone(990,.12,'triangle',.25,0,.07)},
    interact:()=>tone(440,.08,'triangle',.2),
    alert:()=>{for(let i=0;i<3;i++)tone(i%2?500:700,.18,'square',.25,0,i*.2)},
    nade:()=>{noise(.6,.7,300,'lowpass');tone(90,.5,'sawtooth',.4,-60)},
    flash:()=>{noise(.5,.5,6000);tone(2000,.3,'sine',.2,-1500)},
    medkit:()=>{tone(520,.1,'sine',.25);tone(780,.2,'sine',.25,0,.1)},
    click:()=>tone(600,.04,'square',.1),
    win:()=>[523,659,784,1046].forEach((f,i)=>tone(f,.3,'triangle',.3,0,i*.15)),
    lose:()=>[400,330,260,180].forEach((f,i)=>tone(f,.4,'sawtooth',.25,0,i*.25))
  };
  function tick(){
    if(!ac||!mode)return;const n=NOTES[mode],i=step++%n.length,v=n[i];
    if(mode=='menu'){if(v)tone(mtof(v),.9,'sine',.25,0,0,mg);if(i%8==0)tone(mtof(33),2,'triangle',.2,0,0,mg)}
    else if(mode=='sneaky'){if(v)tone(mtof(v),.7,'triangle',.3,0,0,mg);if(i%4==2)noise(.05,.05,6000,'highpass',0,mg)}
    else{if(v)tone(mtof(v-12),.15,'sawtooth',.25,0,0,mg);if(i%4==0){tone(90,.15,'sine',.6,-50,0,mg)}
      if(i%4==2)noise(.1,.25,1500,'bandpass',0,mg);noise(.03,.08,7000,'highpass',0,mg)}
  }
  function music(m){
    if(m===mode)return;mode=m;step=0;clearInterval(tm);
    if(m)tm=setInterval(tick,60000/BPM[m]/2);
  }
  ['click','keydown'].forEach(e=>addEventListener(e,init));
  return{fx,music,setVol,vol,init};
})();