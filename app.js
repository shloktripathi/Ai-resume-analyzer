const prefersReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const perfPrefKey='raiPerfMode';
const savedPerfMode=localStorage.getItem(perfPrefKey)||'auto';
const autoLowPower=
  prefersReducedMotion||
  (typeof navigator.deviceMemory==='number'&&navigator.deviceMemory<=4)||
  (typeof navigator.hardwareConcurrency==='number'&&navigator.hardwareConcurrency<=4);

function applyPerformanceMode(mode){
  const resolved=mode==='auto'?(autoLowPower?'lite':'full'):mode;
  document.body.classList.toggle('perf-lite',resolved==='lite');
  document.body.classList.toggle('fx-cursor-enabled',resolved==='full'&&!prefersReducedMotion&&window.matchMedia('(pointer:fine)').matches);
  const btn=document.getElementById('perfToggleBtn');
  if(btn)btn.textContent=mode==='auto'?'[ PERFORMANCE AUTO ]':resolved==='lite'?'[ PERFORMANCE LITE ]':'[ PERFORMANCE FULL ]';
}

applyPerformanceMode(savedPerfMode);
const lowPowerDevice=document.body.classList.contains('perf-lite');
// â”€â”€ CURSOR â”€â”€
const c1=document.getElementById('cur'),c2=document.getElementById('cur2'),c3=document.getElementById('cur3');
let mx=0,my=0,c2x=0,c2y=0,c3x=0,c3y=0;
if(document.body.classList.contains('fx-cursor-enabled')){
  document.addEventListener('mousemove',e=>{
    mx=e.clientX;my=e.clientY;
    c1.style.left=mx+'px';c1.style.top=my+'px';
  });
  function animCursor(){
    c2x+=(mx-c2x)*.15;c2y+=(my-c2y)*.15;
    c3x+=(mx-c3x)*.07;c3y+=(my-c3y)*.07;
    c2.style.left=c2x+'px';c2.style.top=c2y+'px';
    c3.style.left=c3x+'px';c3.style.top=c3y+'px';
    requestAnimationFrame(animCursor);
  }
  animCursor();
}

// â”€â”€ CANVAS PARTICLE SYSTEM â”€â”€
const canvas=document.getElementById('bgCanvas');
const ctx=canvas.getContext('2d');
let W,H,particles=[];
let canvasBgFrom='rgba(5,5,7,1)';
let canvasBgMid='rgba(17,19,26,.42)';
let particleColor='#32f0d2';
let lineColor='#8a94a6';

function resize(){
  W=canvas.width=window.innerWidth;
  H=canvas.height=window.innerHeight;
}
resize();window.addEventListener('resize',resize);

function hexToRgba(hex,a){
  const h=hex.replace('#','').trim();
  const v=h.length===3?h.split('').map(ch=>ch+ch).join(''):h;
  const n=parseInt(v,16);
  const r=(n>>16)&255;
  const g=(n>>8)&255;
  const b=n&255;
  return `rgba(${r},${g},${b},${a})`;
}

function setCanvasThemeColors(){
  const cs=getComputedStyle(document.body);
  canvasBgFrom=hexToRgba(cs.getPropertyValue('--bg')||'#021024',1);
  canvasBgMid=hexToRgba(cs.getPropertyValue('--bg2')||'#052659',.35);
  particleColor=(cs.getPropertyValue('--neon')||'#32f0d2').trim();
  lineColor=(cs.getPropertyValue('--mid')||'#8a94a6').trim();
}
setCanvasThemeColors();

class Particle{
  constructor(){this.reset();}
  reset(){
    this.x=Math.random()*W;
    this.y=Math.random()*H;
    this.r=Math.random()*1.5+.3;
    this.vx=(Math.random()-.5)*.3;
    this.vy=(Math.random()-.5)*.3;
    this.alpha=Math.random()*.4+.1;
    this.pulse=Math.random()*Math.PI*2;
  }
  update(){
    this.x+=this.vx;this.y+=this.vy;
    this.pulse+=.02;
    if(this.x<0||this.x>W||this.y<0||this.y>H)this.reset();
  }
  draw(){
    ctx.save();
    ctx.globalAlpha=this.alpha*(0.6+0.4*Math.sin(this.pulse));
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
    ctx.fillStyle=particleColor;
    ctx.fill();
    ctx.restore();
  }
}

// Connections
function drawConnections(){
  for(let i=0;i<particles.length;i++){
    for(let j=i+1;j<particles.length;j++){
      const dx=particles[i].x-particles[j].x;
      const dy=particles[i].y-particles[j].y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<120){
        ctx.save();
        ctx.globalAlpha=(1-d/120)*.08;
        ctx.beginPath();
        ctx.moveTo(particles[i].x,particles[i].y);
        ctx.lineTo(particles[j].x,particles[j].y);
        ctx.strokeStyle=lineColor;
        ctx.lineWidth=.5;
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

const particleCount=lowPowerDevice?26:80;
const drawParticleConnections=!lowPowerDevice;
for(let i=0;i<particleCount;i++)particles.push(new Particle());

// Animated gradient background
let gradAngle=0;
function drawBg(){
  const grd=ctx.createLinearGradient(
    W/2+Math.cos(gradAngle)*W*.4,H/2+Math.sin(gradAngle)*H*.4,
    W/2-Math.cos(gradAngle)*W*.4,H/2-Math.sin(gradAngle)*H*.4
  );
  grd.addColorStop(0,canvasBgFrom);
  grd.addColorStop(.5,canvasBgMid);
  grd.addColorStop(1,canvasBgFrom);
  ctx.fillStyle=grd;
  ctx.fillRect(0,0,W,H);
}

function loop(){
  if(document.hidden){
    requestAnimationFrame(loop);
    return;
  }
  ctx.clearRect(0,0,W,H);
  drawBg();
  gradAngle+=lowPowerDevice?.0015:.003;
  particles.forEach(p=>{p.update();p.draw();});
  if(drawParticleConnections)drawConnections();
  requestAnimationFrame(loop);
}
loop();
if(lowPowerDevice){
  document.querySelectorAll('.bento-card').forEach(card=>card.removeAttribute('onmousemove'));
}
function initProofSlider(){
  const wrap=document.getElementById('proofWrap');
  const track=document.getElementById('proofTrack');
  if(!wrap||!track)return;

  let drag=false;
  let pauseUntil=0;
  let pointerStartX=0;
  let startOffset=0;
  let offsetX=0;
  const speed=lowPowerDevice?0.28:0.5;

  const getLoopWidth=()=>Math.max(1,track.scrollWidth/2);
  const wrapOffset=()=>{
    const loopWidth=getLoopWidth();
    while(offsetX<=-loopWidth)offsetX+=loopWidth;
    while(offsetX>0)offsetX-=loopWidth;
  };
  const paint=()=>{track.style.transform=`translate3d(${offsetX}px,0,0)`;};

  const onDown=(e)=>{
    drag=true;
    pauseUntil=Date.now()+1800;
    pointerStartX=e.clientX;
    startOffset=offsetX;
    wrap.classList.add('dragging');
  };
  const onMove=(e)=>{
    if(!drag)return;
    offsetX=startOffset+(e.clientX-pointerStartX);
    wrapOffset();
    paint();
  };
  const onUp=()=>{
    if(!drag)return;
    drag=false;
    wrap.classList.remove('dragging');
    pauseUntil=Date.now()+1200;
  };

  wrap.addEventListener('pointerdown',onDown);
  window.addEventListener('pointermove',onMove,{passive:true});
  window.addEventListener('pointerup',onUp,{passive:true});
  wrap.addEventListener('pointerleave',onUp,{passive:true});

  wrap.addEventListener('wheel',(e)=>{
    if(Math.abs(e.deltaX)<Math.abs(e.deltaY))return;
    e.preventDefault();
    pauseUntil=Date.now()+1200;
    offsetX-=e.deltaX*.8;
    wrapOffset();
    paint();
  },{passive:false});

  function tick(){
    if(!document.hidden&&!drag&&Date.now()>pauseUntil){
      offsetX-=speed;
      wrapOffset();
      paint();
    }
    requestAnimationFrame(tick);
  }
  paint();
  tick();
}

// â”€â”€ BENTO CARD MOUSE GLOW â”€â”€

const graphStoreKey='raiLiveGraphV1';
let liveGraphData=[],liveGraphAttempts=0;
let lgCanvas=null,lgCtx=null,lgW=1200,lgH=180;

function loadGraphState(){
  try{
    const saved=JSON.parse(localStorage.getItem(graphStoreKey)||'{}');
    if(Array.isArray(saved.data)&&saved.data.length){
      liveGraphData=saved.data.slice(-30).map(v=>Math.max(30,Math.min(99,Number(v)||50)));
      liveGraphAttempts=Number(saved.attempts)||0;
      return;
    }
  }catch(_){}
  liveGraphData=[44,46,47,49,51,50,53,55,56,58,57,59,61,63,64,66,65,68,69,71];
  liveGraphAttempts=0;
}

function saveGraphState(){
  localStorage.setItem(graphStoreKey,JSON.stringify({attempts:liveGraphAttempts,data:liveGraphData.slice(-30)}));
}

function drawLiveGraph(){
  if(!lgCtx||!lgCanvas)return;
  lgCtx.clearRect(0,0,lgW,lgH);
  lgCtx.strokeStyle='rgba(156,168,184,.14)';
  lgCtx.lineWidth=1;
  for(let i=1;i<6;i++){
    const y=(lgH/6)*i;
    lgCtx.beginPath();lgCtx.moveTo(0,y);lgCtx.lineTo(lgW,y);lgCtx.stroke();
  }
  const padX=18,padY=18;
  const chartW=lgW-padX*2,chartH=lgH-padY*2;
  const n=liveGraphData.length;
  if(!n)return;

  const grad=lgCtx.createLinearGradient(0,padY,0,lgH-padY);
  grad.addColorStop(0,'rgba(50,240,210,.24)');
  grad.addColorStop(1,'rgba(50,240,210,.02)');

  lgCtx.beginPath();
  liveGraphData.forEach((v,i)=>{
    const x=padX+(i/(n-1))*chartW;
    const y=padY+((100-v)/100)*chartH;
    if(i===0)lgCtx.moveTo(x,y); else lgCtx.lineTo(x,y);
  });
  const lastX=padX+chartW,lastY=padY+((100-liveGraphData[n-1])/100)*chartH;
  lgCtx.lineTo(lastX,lgH-padY);
  lgCtx.lineTo(padX,lgH-padY);
  lgCtx.closePath();
  lgCtx.fillStyle=grad;
  lgCtx.fill();

  lgCtx.beginPath();
  liveGraphData.forEach((v,i)=>{
    const x=padX+(i/(n-1))*chartW;
    const y=padY+((100-v)/100)*chartH;
    if(i===0)lgCtx.moveTo(x,y); else lgCtx.lineTo(x,y);
  });
  lgCtx.strokeStyle='#2ef0d2';
  lgCtx.lineWidth=2.4;
  lgCtx.stroke();

  lgCtx.beginPath();
  lgCtx.arc(lastX,lastY,4.5,0,Math.PI*2);
  lgCtx.fillStyle='#ff8a3d';
  lgCtx.fill();
}

function refreshGraphMeta(){
  const a=document.getElementById('lgAttempts');
  const s=document.getElementById('lgScore');
  const latest=liveGraphData[liveGraphData.length-1]||0;
  if(a)a.textContent='TRIES: '+liveGraphAttempts;
  if(s)s.textContent='LATEST SCORE: '+Math.round(latest)+'%';
}

function recordGraphTry(type){
  if(!liveGraphData.length)return;
  const bonus=type==='analysis'?2.6:type==='code'?1.8:1.1;
  const prev=liveGraphData[liveGraphData.length-1];
  const growth=Math.min(4.5,Math.max(0.4,(100-prev)*0.06+bonus+Math.random()*1.2));
  const next=Math.min(99,prev+growth);
  liveGraphData.push(Number(next.toFixed(2)));
  if(liveGraphData.length>30)liveGraphData.shift();
  liveGraphAttempts+=1;
  saveGraphState();
  drawLiveGraph();
  refreshGraphMeta();
}

function initLiveGraph(){
  lgCanvas=document.getElementById('liveGraph');
  if(!lgCanvas)return;
  lgCtx=lgCanvas.getContext('2d');
  const resize=()=>{
    const rect=lgCanvas.getBoundingClientRect();
    const dpr=window.devicePixelRatio||1;
    lgW=Math.max(300,Math.floor(rect.width*dpr));
    lgH=Math.max(140,Math.floor(rect.height*dpr));
    lgCanvas.width=lgW;
    lgCanvas.height=lgH;
    lgCtx.setTransform(1,0,0,1,0,0);
    drawLiveGraph();
  };
  loadGraphState();
  refreshGraphMeta();
  resize();
  window.addEventListener('resize',resize);
}
let cubeRotX=-22,cubeRotY=28,cubeDragging=false,cubeLastX=0,cubeLastY=0,cubeAutoTs=0;
function setCubeRotation(){
  const core=document.getElementById('cubeCore');
  if(!core)return;
  core.style.transform=`translate(-50%,-50%) rotateX(${cubeRotX}deg) rotateY(${cubeRotY}deg)`;
}
function animateCubeSystem(ts){
  const orbit=document.getElementById('msOrbitRing');
  const axis=document.getElementById('msAxis');
  const cuboid=document.getElementById('msCuboid');
  const triangle=document.getElementById('msTriangle');
  const prism=document.getElementById('msPrism');
  const mini=document.getElementById('msMini');
  if(!orbit||!axis||!cuboid||!triangle||!prism||!mini)return;

  if(!cubeAutoTs)cubeAutoTs=ts;
  const dt=Math.min(34,ts-cubeAutoTs);
  cubeAutoTs=ts;

  // Keep core rotating automatically. Dragging still updates the same state.
  if(!cubeDragging){
    cubeRotY+=dt*0.045;
    setCubeRotation();
  }

  const a=ts*0.05;
  const r=(Math.PI/180)*a;

  orbit.style.transform=`rotate(${a*0.8}deg) scale(${1+Math.sin(r*1.4)*0.035})`;
  axis.style.transform=`translate(-50%,-50%) rotate(${a*0.55}deg)`;

  cuboid.style.transform=`translate(${Math.cos(r*1.05)*14}px,${Math.sin(r*1.05)*8}px) skewX(-20deg) rotate(${-16+Math.sin(r*1.6)*16}deg)`;
  triangle.style.transform=`translate(${Math.cos(r*1.3+1.1)*12}px,${Math.sin(r*1.3+1.1)*10}px) rotate(${Math.sin(r*1.9)*18}deg)`;
  prism.style.transform=`translate(${Math.cos(r*1.2+2.2)*10}px,${Math.sin(r*1.2+2.2)*9}px) rotate(${Math.sin(r*1.5)*14}deg) scaleY(${1+Math.sin(r*2.1)*0.18})`;
  mini.style.transform=`translate(${Math.cos(r*1.15+3.3)*12}px,${Math.sin(r*1.15+3.3)*10}px) rotate(${28+a*0.95}deg)`;

  requestAnimationFrame(animateCubeSystem);
}
function cubePointerDown(e){
  const stage=document.getElementById('cubeStage');
  if(!stage||!stage.contains(e.target))return;
  cubeDragging=true;
  cubeLastX=e.clientX;
  cubeLastY=e.clientY;
  recordGraphTry('drag');
}
function cubePointerMove(e){
  if(!cubeDragging)return;
  const dx=e.clientX-cubeLastX;
  const dy=e.clientY-cubeLastY;
  cubeRotY+=dx*0.55;
  cubeRotX-=dy*0.5;
  cubeRotX=Math.max(-70,Math.min(70,cubeRotX));
  cubeLastX=e.clientX;
  cubeLastY=e.clientY;
  setCubeRotation();
}
function cubePointerUp(){cubeDragging=false;}
function initCubeControls(){
  const stage=document.getElementById('cubeStage');
  if(!stage)return;
  setCubeRotation();
  requestAnimationFrame(animateCubeSystem);
  stage.addEventListener('pointerdown',cubePointerDown);
  window.addEventListener('pointermove',cubePointerMove);
  window.addEventListener('pointerup',cubePointerUp);
}
// â”€â”€ PAGE ROUTING â”€â”€
let currentUser=null;

function showPage(id,{scrollTop=true}={}){
  const pageMap={
    home:'page-home',
    learn:'page-learn',
    analyze:'page-analyze',
    login:'page-login',
    signup:'page-signup'
  };
  const targetId=pageMap[id]||('page-'+id);
  const target=document.getElementById(targetId);

  if(target){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    target.classList.add('active');
    if(scrollTop)window.scrollTo({top:0,behavior:'smooth'});
    return true;
  }

  if(id==='analyze'){
    const analyzeTop=document.querySelector('.analyze-wrap');
    if(analyzeTop){
      analyzeTop.scrollIntoView({behavior:'smooth',block:'start'});
      return true;
    }
  }
  return false;
}

function go(page){
  return showPage(page,{scrollTop:true});
}


function applyTheme(mode){
  const light=mode==='carbon'||mode==='light';
  document.body.classList.toggle('light-theme',light);
  localStorage.setItem('raiTheme',light?'carbon':'obsidian');
  document.getElementById('themeToggleBtn').textContent=light?'[ OBSIDIAN THEME ]':'[ CARBON THEME ]';
  setCanvasThemeColors();
}

function toggleTheme(){
  applyTheme(document.body.classList.contains('light-theme')?'obsidian':'carbon');
}

let cmdkOpen=false;
let cmdkIndex=0;
let secretBuffer='';
const secretKey='resumeai';

function cmdkItems(){
  return Array.from(document.querySelectorAll('#cmdkList .cmdk-item'));
}

function refreshCmdkActive(items){
  if(!items.length)return;
  items.forEach((el,i)=>el.classList.toggle('active',i===cmdkIndex));
}

function openCmdk(){
  const wrap=document.getElementById('cmdk');
  const input=document.getElementById('cmdkInput');
  if(!wrap||!input)return;
  cmdkOpen=true;
  cmdkIndex=0;
  wrap.hidden=false;
  wrap.setAttribute('aria-hidden','false');
  input.value='';
  filterCmdk('');
  setTimeout(()=>input.focus(),0);
}

function closeCmdk(){
  const wrap=document.getElementById('cmdk');
  if(!wrap)return;
  cmdkOpen=false;
  wrap.hidden=true;
  wrap.setAttribute('aria-hidden','true');
}

function filterCmdk(term){
  const q=(term||'').trim().toLowerCase();
  const items=cmdkItems();
  items.forEach(el=>{
    const txt=el.textContent.toLowerCase();
    el.hidden=q && !txt.includes(q);
  });
  const visible=items.filter(el=>!el.hidden);
  cmdkIndex=0;
  refreshCmdkActive(visible);
}

function executeCmd(cmd){
  if(cmd==='home')go('home');
  else if(cmd==='analyze')go('analyze');
  else if(cmd==='learn')go('learn');
  else if(cmd==='theme')toggleTheme();
  else if(cmd==='perf'){
    const perfBtn=document.getElementById('perfToggleBtn');
    if(perfBtn)perfBtn.click();
  }
  closeCmdk();
}

function triggerSecretBurst(){
  const toast=document.getElementById('secretToast');
  const burst=document.getElementById('secretBurst');
  const logo=document.querySelector('.logo');
  if(!toast||!burst)return;

  burst.innerHTML='';
  for(let i=0;i<30;i++){
    const dot=document.createElement('i');
    const ang=Math.random()*Math.PI*2;
    const dist=80+Math.random()*160;
    const tx=Math.cos(ang)*dist;
    const ty=Math.sin(ang)*dist;
    dot.style.left='50%';
    dot.style.top='50%';
    dot.style.setProperty('--tx',tx.toFixed(1)+'px');
    dot.style.setProperty('--ty',ty.toFixed(1)+'px');
    dot.style.animationDelay=(Math.random()*0.15).toFixed(2)+'s';
    burst.appendChild(dot);
  }

  burst.classList.add('show');
  toast.classList.add('show');
  if(logo){
    logo.classList.add('glitching');
    setTimeout(()=>logo.classList.remove('glitching'),1300);
  }
  setTimeout(()=>burst.classList.remove('show'),900);
  setTimeout(()=>toast.classList.remove('show'),1800);
}

function initMagneticButtons(){
  if(window.matchMedia('(pointer:coarse)').matches)return;
  const els=document.querySelectorAll('.btn-hero-main,.btn-hero-sec,.btn-neon,.btn-ghost,.analyze-btn,.upload-btn,.auth-submit,.t-run,.t-clear');
  els.forEach(el=>{
    el.classList.add('magnetic');
    el.addEventListener('mousemove',(e)=>{
      const r=el.getBoundingClientRect();
      const dx=(e.clientX-(r.left+r.width/2))/r.width;
      const dy=(e.clientY-(r.top+r.height/2))/r.height;
      el.style.transform=`translate(${(dx*7).toFixed(2)}px, ${(dy*7).toFixed(2)}px)`;
    });
    el.addEventListener('mouseleave',()=>{el.style.transform='translate(0, 0)';});
  });
}

function initUniqueInteractions(){
  const cmdk=document.getElementById('cmdk');
  const input=document.getElementById('cmdkInput');
  const list=document.getElementById('cmdkList');
  if(input){
    input.addEventListener('input',()=>filterCmdk(input.value));
  }
  if(list){
    list.addEventListener('click',(e)=>{
      const item=e.target.closest('.cmdk-item');
      if(!item)return;
      executeCmd(item.getAttribute('data-cmd'));
    });
  }
  if(cmdk){
    cmdk.addEventListener('click',(e)=>{ if(e.target===cmdk)closeCmdk(); });
  }

  document.addEventListener('keydown',(e)=>{
    const key=(e.key||'').toLowerCase();
    if((e.ctrlKey||e.metaKey)&&key==='k'){
      e.preventDefault();
      if(cmdkOpen)closeCmdk();
      else openCmdk();
      return;
    }
    if(cmdkOpen){
      const visible=cmdkItems().filter(el=>!el.hidden);
      if(key==='escape'){closeCmdk();return;}
      if(key==='arrowdown'){
        e.preventDefault();
        cmdkIndex=(cmdkIndex+1)%Math.max(visible.length,1);
        refreshCmdkActive(visible);
        return;
      }
      if(key==='arrowup'){
        e.preventDefault();
        cmdkIndex=(cmdkIndex-1+Math.max(visible.length,1))%Math.max(visible.length,1);
        refreshCmdkActive(visible);
        return;
      }
      if(key==='enter'&&visible[cmdkIndex]){
        e.preventDefault();
        executeCmd(visible[cmdkIndex].getAttribute('data-cmd'));
        return;
      }
    }

    if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&key.length===1){
      secretBuffer=(secretBuffer+key).slice(-secretKey.length);
      if(secretBuffer===secretKey){
        triggerSecretBurst();
        secretBuffer='';
      }
    }
  });

  initMagneticButtons();
}

// â”€â”€ SCROLL REVEAL â”€â”€
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis');});
},{threshold:.1});
document.querySelectorAll('.reveal,.reveal-left').forEach(el=>obs.observe(el));

// â”€â”€ ANALYZE â”€â”€
const tinyCodeLimit=2000;
function handleTinyCodeInput(){
  const input=document.getElementById('tinyCodeInput');
  const meta=document.getElementById('tinyCodeMeta');
  if(!input||!meta)return;
  if(input.value.length>tinyCodeLimit)input.value=input.value.slice(0,tinyCodeLimit);
  meta.textContent='// '+input.value.length+'/'+tinyCodeLimit+' chars';
}

function formatTinyValue(v){
  if(typeof v==='string')return v;
  try{return JSON.stringify(v,null,2);}
  catch(_){return String(v);}
}

function runTinyCode(){
  const input=document.getElementById('tinyCodeInput');
  const output=document.getElementById('tinyCodeOutput');
  if(!input||!output)return;
  const code=input.value.trim();
  if(!code){
    output.textContent='// Write JavaScript code first';
    return;
  }
  recordGraphTry('code');

  output.textContent='// Running...';
  const workerSource=`
    self.onmessage=async(e)=>{
      const code=e.data.code;
      const send=(type,data)=>self.postMessage({type,data});
      const c={
        log:(...a)=>send('log',a),
        error:(...a)=>send('error',a),
        warn:(...a)=>send('warn',a),
        info:(...a)=>send('info',a)
      };
      try{
        const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
        const fn=new AsyncFunction('console',code);
        const result=await fn(c);
        if(result!==undefined)send('result',[result]);
      }catch(err){
        send('error',[err&&err.message?err.message:String(err)]);
      }
      send('done',[]);
    };
  `;

  const blob=new Blob([workerSource],{type:'application/javascript'});
  const worker=new Worker(URL.createObjectURL(blob));
  const lines=[];
  const timer=setTimeout(()=>{
    worker.terminate();
    output.textContent=(lines.join('\n')+'\n[timeout] Execution stopped after 3s').trim();
  },3000);

  worker.onmessage=(e)=>{
    const {type,data}=e.data||{};
    if(type==='done'){
      clearTimeout(timer);
      worker.terminate();
      output.textContent=lines.length?lines.join('\n'):'// Done (no output)';
      return;
    }
    const text=(data||[]).map(formatTinyValue).join(' ');
    if(type==='error')lines.push('[error] '+text);
    else if(type==='warn')lines.push('[warn] '+text);
    else if(type==='info')lines.push('[info] '+text);
    else if(type==='result')lines.push('=> '+text);
    else lines.push(text);
  };
  worker.postMessage({code});
}

function clearTinyCode(){
  const input=document.getElementById('tinyCodeInput');
  const output=document.getElementById('tinyCodeOutput');
  if(input)input.value='';
  if(output)output.textContent='// Output will appear here';
  handleTinyCodeInput();
}

const atsKeywords=[
  'api','rest','node.js','javascript','typescript','react','sql','mongodb','postgresql',
  'docker','aws','kubernetes','microservices','ci/cd','agile','scrum','leadership',
  'stakeholder','cross-functional','automation','testing','analytics','performance','security'
];
const actionVerbs=[
  'built','developed','implemented','optimized','designed','led','managed','delivered',
  'improved','reduced','increased','automated','created','integrated','scaled','launched'
];
let liveAnalyzeTimer=null;
let isAnalysisRunning=false;
let analysisStepTimer=null;

const steps=[
  'SCANNING STRUCTURE',
  'MATCHING ATS SIGNALS',
  'EXTRACTING KEYWORDS',
  'CALCULATING IMPACT SCORE',
  'BUILDING FINAL REPORT'
];

function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function escHtml(s){
  return String(s).replace(/[&<>"']/g,(ch)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
}

// Legacy analyzer block removed; enhanced analyzer is defined below.

// â”€â”€ AUTH â”€â”€
const users=JSON.parse(localStorage.getItem('raiUsers')||'[]');

function doSignup(){
  const name=document.getElementById('regName').value.trim();
  const email=document.getElementById('regEmail').value.trim();
  const pass=document.getElementById('regPass').value;
  const err=document.getElementById('signupErr');
  const ok=document.getElementById('signupOk');
  err.style.display='none';ok.style.display='none';

  if(!name||!email||!pass){err.textContent='// ERROR: All fields required';err.style.display='block';return;}
  if(pass.length<6){err.textContent='// ERROR: Password min 6 chars';err.style.display='block';return;}
  if(users.find(u=>u.email===email)){err.textContent='// ERROR: Email already registered';err.style.display='block';return;}

  users.push({name,email,pass});
  localStorage.setItem('raiUsers',JSON.stringify(users));
  ok.style.display='block';
  setTimeout(()=>go('login'),1500);
}

function doLogin(){
  const email=document.getElementById('loginEmail').value.trim();
  const pass=document.getElementById('loginPass').value;
  const err=document.getElementById('loginErr');
  err.style.display='none';

  const u=users.find(u=>u.email===email&&u.pass===pass);
  if(!u){err.style.display='block';return;}

  currentUser=u;
  document.getElementById('navRight').style.display='none';
  const badge=document.getElementById('userBadge');
  badge.classList.add('show');
  document.getElementById('userNameDisplay').textContent=u.name.toUpperCase();
  go('home');
}

// Logout on logo click if logged in (demo only)
document.querySelector('.logo').addEventListener('dblclick',()=>{
  if(currentUser){
    currentUser=null;
    document.getElementById('navRight').style.display='flex';
    document.getElementById('userBadge').classList.remove('show');
  }
});

function countJdChars(){
  const jd=document.getElementById('jdText');
  const out=document.getElementById('jdCharCnt');
  if(!jd||!out)return;
  out.textContent=(jd.value||'').length+' jd chars';
  scheduleLiveAnalysis();
}

function extractKeywordsFromText(text,max=14){
  const stop=new Set(['the','and','for','with','from','that','this','your','you','our','are','was','were','have','has','into','will','all','job','role','team','work','years','year','plus','using','use']);
  const tokens=(text||'').toLowerCase().match(/[a-z][a-z0-9+./-]{2,}/g)||[];
  const freq=new Map();
  tokens.forEach(t=>{
    if(stop.has(t)||/^\d/.test(t))return;
    freq.set(t,(freq.get(t)||0)+1);
  });
  return [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,max).map(x=>x[0]);
}

async function readFileText(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(reader.error||new Error('Read failed'));
    reader.readAsText(file);
  });
}

async function extractTextFromPdf(file){
  if(!window.pdfjsLib)return '';
  try{
    window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf=await file.arrayBuffer();
    const doc=await window.pdfjsLib.getDocument({data:buf}).promise;
    const parts=[];
    const pages=Math.min(doc.numPages,5);
    for(let i=1;i<=pages;i++){
      const page=await doc.getPage(i);
      const content=await page.getTextContent();
      const text=content.items.map(it=>it.str).join(' ').replace(/\s+/g,' ').trim();
      if(text)parts.push(text);
    }
    return parts.join('\n\n').trim();
  }catch(_){
    return '';
  }
}

function analyzeResumeData(text,hasFiles,jdText=''){
  const raw=(text||'').trim();
  const lower=raw.toLowerCase();
  const words=raw?raw.split(/\s+/).filter(Boolean):[];
  const wordCount=words.length;
  const jdKeywords=extractKeywordsFromText(jdText,16);
  const activeKeywords=Array.from(new Set([...atsKeywords,...jdKeywords]));

  const sectionRegexes=[
    /summary|objective|profile/i,
    /experience|employment|work history/i,
    /education/i,
    /skills|tech stack|technical skills/i,
    /projects?/i,
    /certifications?|achievements?/i
  ];
  const sectionHits=sectionRegexes.reduce((acc,re)=>acc+(re.test(raw)?1:0),0);
  const keywordHits=activeKeywords.filter(k=>lower.includes(k)).length;
  const jdHits=jdKeywords.filter(k=>lower.includes(k)).length;
  const actionHits=actionVerbs.filter(v=>new RegExp('\\b'+v+'\\b','i').test(raw)).length;
  const numberHits=(raw.match(/\b\d+(?:[.,]\d+)?%?\b/g)||[]).length;
  const bulletHits=(raw.match(/(^|\n)\s*(?:[-*]|[0-9]+\.)\s+/g)||[]).length;
  const emailHits=(raw.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)||[]).length;
  const phoneHits=(raw.match(/(?:\+?\d[\d\s\-()]{8,}\d)/g)||[]).length;
  const profileHits=(/linkedin|github|portfolio|behance|dribbble/i.test(raw)?1:0);
  const contactHits=emailHits+phoneHits+profileHits;
  const summaryPresent=/summary|objective|profile/i.test(raw);

  if(!raw&&hasFiles){
    return {
      overall:58,ats:55,content:61,structure:57,impact:56,grade:'DECENT START',
      summary:'File upload received. PDF text extraction failed or no selectable text found. Paste text for precise scan.',
      status:'STATUS: TEXT NEEDED FOR PRECISE SCAN',
      recs:[
        {type:'ok',text:'Upload received successfully.'},
        {type:'warn',text:'Paste extracted text for accurate ATS and impact scoring.'},
        {type:'warn',text:'Add quantified outcomes for each role.'},
        {type:'err',text:'Cannot compute missing keywords without resume text.'},
        {type:'err',text:'Cannot validate section quality yet.'}
      ]
    };
  }

  let ats=clamp(Math.round(30+(keywordHits/Math.max(activeKeywords.length,1))*45+(sectionHits/6)*15+Math.min(10,contactHits*4)),20,99);
  let content=clamp(Math.round(24+Math.min(36,wordCount/18)+Math.min(18,actionHits*2)+Math.min(14,numberHits*2)+(summaryPresent?8:0)),20,99);
  let structure=clamp(Math.round(26+(sectionHits/6)*40+Math.min(16,bulletHits*2)+(wordCount>240?10:0)),20,99);
  let impact=clamp(Math.round(22+Math.min(30,numberHits*4)+Math.min(22,actionHits*2)+Math.min(16,keywordHits*1.6)),20,99);

  if(wordCount<120){ats-=10;content-=14;structure-=12;impact-=12;}
  if(wordCount<60){ats-=8;content-=10;structure-=8;impact-=8;}

  ats=clamp(ats,20,99);
  content=clamp(content,20,99);
  structure=clamp(structure,20,99);
  impact=clamp(impact,20,99);

  const overall=clamp(Math.round(ats*0.35+content*0.25+structure*0.2+impact*0.2),20,99);
  const grade=overall>=82?'STRONG RESUME':overall>=68?'GOOD RESUME':overall>=52?'DECENT START':'NEEDS WORK';
  const status=overall>=82?'STATUS: ATS READY':overall>=68?'STATUS: IMPROVABLE':overall>=52?'STATUS: MAJOR IMPROVEMENTS NEEDED':'STATUS: LOW MATCH RISK';

  const missingKeywords=activeKeywords.filter(k=>!lower.includes(k)).slice(0,5);
  const recs=[];
  if(jdKeywords.length){
    recs.push({type:jdHits>=Math.ceil(jdKeywords.length*0.45)?'ok':'warn',text:'JD match: '+jdHits+'/'+jdKeywords.length+' target keywords detected.'});
  }
  recs.push({type:actionHits>=4?'ok':'warn',text:actionHits>=4?'Strong action verbs found.':'Use stronger action verbs (built, implemented, optimized, delivered).'});
  recs.push({type:numberHits>=4?'ok':'warn',text:numberHits>=4?'Good quantification found.':'Add measurable impact with numbers (%, revenue, time saved, scale).'});
  recs.push({type:sectionHits>=4?'ok':'err',text:sectionHits>=4?'Core sections are present and recruiter friendly.':'Add missing sections: summary, experience, skills, projects, education.'});
  recs.push({type:missingKeywords.length<=2?'ok':'err',text:missingKeywords.length<=2?'Keyword coverage is healthy.':'Missing keywords to consider: '+missingKeywords.join(', ')+'.'});
  recs.push({type:wordCount>=180?'ok':'warn',text:wordCount>=180?'Resume length looks sufficient for meaningful evaluation.':'Resume is short. Add role scope, outcomes, tools, and context.'});

  const summary=overall>=82
    ?'Excellent signal quality. Resume shows strong ATS alignment and measurable impact.'
    :overall>=68
      ?'Solid base detected. Targeted keyword, impact, and structure tweaks can move this into top-tier range.'
      :overall>=52
        ?'Resume has potential but needs clearer structure, stronger keyword mapping, and quantified outcomes.'
        :'Current profile has weak ATS signals. Add sections, keywords, and measurable achievements urgently.';

  return {overall,ats,content,structure,impact,grade,summary,status,recs};
}

function renderAnalysisUI(result){
  if(!result)return;
  const setText=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val;};
  setText('overallScoreNum',result.overall);
  setText('overallGrade',result.grade);
  setText('overallSummary',result.summary);
  setText('overallStatus',result.status);
  setText('atsScoreText',result.ats+'%');
  setText('contentScoreText',result.content+'%');
  setText('structureScoreText',result.structure+'%');
  setText('impactScoreText',result.impact+'%');

  const setBar=(id,val)=>{const el=document.getElementById(id);if(el)el.style.width=val+'%';};
  setBar('atsBar',result.ats);
  setBar('contentBar',result.content);
  setBar('structureBar',result.structure);
  setBar('impactBar',result.impact);

  const ring=document.querySelector('.br-fill');
  if(ring){
    const circumference=314;
    ring.style.strokeDashoffset=(circumference-(result.overall/100)*circumference).toFixed(2);
  }

  const list=document.getElementById('recommendationList');
  if(list&&Array.isArray(result.recs)){
    const icon={ok:'OK',warn:'!',err:'X'};
    list.textContent='';
    result.recs.slice(0,5).forEach(r=>{
      const item=document.createElement('div');
      item.className='sug-item s-'+r.type;
      const ico=document.createElement('div');
      ico.className='s-ico';
      ico.textContent=icon[r.type]||'*';
      item.appendChild(ico);
      item.appendChild(document.createTextNode(r.text));
      list.appendChild(item);
    });
  }
}

function updateLiveAnalysis(){
  const textEl=document.getElementById('rText');
  const jdEl=document.getElementById('jdText');
  const hint=document.getElementById('liveHint');
  const results=document.getElementById('az-results');
  const load=document.getElementById('az-load');
  if(!textEl||!hint||!results||!load)return;

  const text=textEl.value||'';
  const jdText=jdEl?jdEl.value||'':'';
  const hasFiles=uploadedResumeFiles.length>0;
  if(!text.trim()&&!hasFiles){
    hint.textContent='// LIVE AI: WAITING FOR INPUT';
    results.classList.remove('on');
    return;
  }

  const result=analyzeResumeData(text,hasFiles,jdText);
  renderAnalysisUI(result);
  load.classList.remove('on');
  results.classList.add('on');
  hint.textContent='// LIVE AI: '+result.overall+'% '+result.grade;
}

function scheduleLiveAnalysis(){
  clearTimeout(liveAnalyzeTimer);
  liveAnalyzeTimer=setTimeout(updateLiveAnalysis,220);
}

function countChars(){
  const area=document.getElementById('rText');
  const out=document.getElementById('charCnt');
  const n=area?(area.value||'').length:0;
  if(out)out.textContent=n+' chars';
  scheduleLiveAnalysis();
}

function openResumeUpload(){
  const input=document.getElementById('resumeUpload');
  if(input)input.click();
}

async function handleResumeUpload(event){
  const files=Array.from((event&&event.target&&event.target.files)||[]);
  uploadedResumeFiles=files;
  const meta=document.getElementById('uploadMeta');
  const area=document.getElementById('rText');
  if(!files.length){
    if(meta)meta.textContent='// NO FILES SELECTED';
    scheduleLiveAnalysis();
    return;
  }

  if(meta)meta.textContent='// SELECTED: '+files.map(f=>f.name).join(', ');
  if(!area){
    scheduleLiveAnalysis();
    return;
  }

  const extracted=[];
  for(const file of files){
    const name=(file.name||'').toLowerCase();
    if(name.endsWith('.txt')){
      try{extracted.push(await readFileText(file));}catch(_){ }
      continue;
    }
    if(name.endsWith('.pdf')){
      const txt=await extractTextFromPdf(file);
      if(txt)extracted.push(txt);
    }
  }

  const joined=extracted.filter(Boolean).join('\n\n').trim();
  if(joined){
    area.value=joined;
    if(meta)meta.textContent='// PDF/TEXT EXTRACTED: '+joined.length+' chars';
    countChars();
  }
  scheduleLiveAnalysis();
}

function setAnalyzeView(state){
  const input=document.getElementById('az-input');
  const load=document.getElementById('az-load');
  const results=document.getElementById('az-results');
  if(!input||!load||!results)return;

  if(state==='loading'){
    input.style.display='none';
    load.classList.add('on');
    results.classList.remove('on');
    return;
  }
  if(state==='results'){
    input.style.display='none';
    load.classList.remove('on');
    results.classList.add('on');
    return;
  }

  load.classList.remove('on');
  results.classList.remove('on');
  input.style.display='block';
}

function runAnalysis(){
  if(isAnalysisRunning)return;

  const resumeEl=document.getElementById('rText');
  const jdEl=document.getElementById('jdText');
  const runBtn=document.getElementById('runAnalysisBtn');
  const stepEl=document.getElementById('loadStep');
  const hint=document.getElementById('liveHint');

  const t=resumeEl?resumeEl.value:'';
  const jdText=jdEl?jdEl.value:'';

  if(t.length<50&&uploadedResumeFiles.length===0){
    const tz=document.querySelector('.input-zone');
    if(tz){
      tz.style.borderColor='rgba(255,95,86,.4)';
      tz.style.boxShadow='0 0 20px rgba(255,95,86,.1)';
      setTimeout(()=>{tz.style.borderColor='';tz.style.boxShadow='';},1500);
    }
    return;
  }

  isAnalysisRunning=true;
  if(runBtn){
    runBtn.disabled=true;
    runBtn.classList.add('is-loading');
  }

  recordGraphTry('analysis');
  setAnalyzeView('loading');

  let i=0;
  if(stepEl)stepEl.textContent=steps[0];
  if(analysisStepTimer)clearInterval(analysisStepTimer);
  analysisStepTimer=setInterval(()=>{
    i=(i+1)%steps.length;
    if(stepEl)stepEl.textContent=steps[i];
  },480);

  setTimeout(()=>{
    const result=analyzeResumeData(t,uploadedResumeFiles.length>0,jdText);
    renderAnalysisUI(result);

    if(hint)hint.textContent='// LIVE AI: '+result.overall+'% '+result.grade;
    if(analysisStepTimer){
      clearInterval(analysisStepTimer);
      analysisStepTimer=null;
    }

    setAnalyzeView('results');
    isAnalysisRunning=false;
    if(runBtn){
      runBtn.disabled=false;
      runBtn.classList.remove('is-loading');
    }
  },1900);
}

function resetAZ(){
  if(analysisStepTimer){
    clearInterval(analysisStepTimer);
    analysisStepTimer=null;
  }
  isAnalysisRunning=false;
  const runBtn=document.getElementById('runAnalysisBtn');
  if(runBtn){
    runBtn.disabled=false;
    runBtn.classList.remove('is-loading');
  }
  setAnalyzeView('input');
  const analyzeWrap=document.querySelector('.analyze-wrap');
  document.getElementById('rText').value='';
  const jd=document.getElementById('jdText');
  if(jd)jd.value='';
  uploadedResumeFiles=[];
  document.getElementById('resumeUpload').value='';
  document.getElementById('uploadMeta').textContent='// NO FILES SELECTED';
  document.getElementById('liveHint').textContent='// LIVE AI: WAITING FOR INPUT';
  countChars();
  countJdChars();
}

function wireUiEvents(){
  document.addEventListener('click',(e)=>{
    const goEl=e.target.closest('[data-go]');
    if(goEl){
      e.preventDefault();
      go(goEl.getAttribute('data-go'));
      return;
    }
  });
  const logo=document.querySelector('.logo');
  if(logo){
    logo.addEventListener('keydown',(e)=>{
      if(e.key==='Enter'||e.key===' '){
        e.preventDefault();
        go('home');
      }
    });
  }

  const themeBtn=document.getElementById('themeToggleBtn');
  if(themeBtn)themeBtn.addEventListener('click',toggleTheme);

  const perfBtn=document.getElementById('perfToggleBtn');
  if(perfBtn){
    perfBtn.addEventListener('click',()=>{
      const cur=localStorage.getItem(perfPrefKey)||'auto';
      const next=cur==='auto'?'lite':cur==='lite'?'full':'auto';
      localStorage.setItem(perfPrefKey,next);
      applyPerformanceMode(next);
      location.reload();
    });
  }
  const cmdkBtn=document.getElementById('cmdkBtn');
  if(cmdkBtn)cmdkBtn.addEventListener('click',openCmdk);

  const resumeEl=document.getElementById('rText');
  if(resumeEl)resumeEl.addEventListener('input',countChars);

  const jdEl=document.getElementById('jdText');
  if(jdEl)jdEl.addEventListener('input',countJdChars);

  const uploadOpen=document.getElementById('uploadOpenBtn');
  if(uploadOpen)uploadOpen.addEventListener('click',openResumeUpload);

  const uploadInput=document.getElementById('resumeUpload');
  if(uploadInput)uploadInput.addEventListener('change',handleResumeUpload);

  const runBtn=document.getElementById('runAnalysisBtn');
  if(runBtn)runBtn.addEventListener('click',runAnalysis);

  const resetBtn=document.getElementById('resetAzBtn');
  if(resetBtn)resetBtn.addEventListener('click',resetAZ);

  const tinyInput=document.getElementById('tinyCodeInput');
  if(tinyInput)tinyInput.addEventListener('input',handleTinyCodeInput);

  const tinyRun=document.getElementById('tinyRunBtn');
  if(tinyRun)tinyRun.addEventListener('click',runTinyCode);

  const tinyClear=document.getElementById('tinyClearBtn');
  if(tinyClear)tinyClear.addEventListener('click',clearTinyCode);

  const loginBtn=document.getElementById('loginSubmitBtn');
  if(loginBtn)loginBtn.addEventListener('click',doLogin);

  const signupBtn=document.getElementById('signupSubmitBtn');
  if(signupBtn)signupBtn.addEventListener('click',doSignup);
}

wireUiEvents();


initUniqueInteractions();
applyTheme(localStorage.getItem('raiTheme')||'obsidian');
handleTinyCodeInput();
countChars();
countJdChars();
initCubeControls();
initLiveGraph();
initProofSlider();



