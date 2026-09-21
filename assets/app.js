/* MD²NN teaching simulation. All arrays and fields are computed locally in the browser. */
const $ = (s) => document.querySelector(s);
const canvases = {target:$('#target'), received:$('#received'), chart:$('#chart'), loss:$('#loss')};
const ctx = Object.fromEntries(Object.entries(canvases).map(([k,v])=>[k,v.getContext('2d')]));
const state = {wave:550, ms1:true, ms2:true, spacing:500, isWrong:false, trained:0};
const palettes = {450:['#2e6592','#f1e6cc'],550:['#1d6758','#f5eedc'],650:['#a74235','#f5e7d4']};
const records = {
  450:{one:'青 印',two:'云 图',both:'青函 · 07'},
  550:{one:'身 份',two:'索 引',both:'绿笺 · 21'},
  650:{one:'赤 章',two:'密 码',both:'朱印 · 63'}
};
const n=160;

function mode(){return state.ms1&&state.ms2?'both':state.ms1?'one':state.ms2?'two':'none'}
function signal(){return mode() !== 'none' && (mode() !== 'both' || Math.abs(state.spacing-500)<1.5)}
function keyName(){ const m=mode(); return m==='both'?'MS₁ + MS₂':m==='one'?'MS₁':m==='two'?'MS₂':'无层参与'; }
function intended(){return records[state.wave][mode()] || '无 可 读 信 息'}
function seed(v){let x=v>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296}}
function updateControls(){
  document.querySelectorAll('[data-wave]').forEach(b=>b.classList.toggle('chosen',+b.dataset.wave===state.wave));
  $('#ms1').checked=state.ms1;$('#ms2').checked=state.ms2;$('#spacing').value=state.spacing;
  $('#spacingOut').textContent=`${state.spacing} μm`;
  $('#keyReadout').textContent=`${state.wave} nm · ${keyName()}${mode()==='both'?` · ${state.spacing} μm`:''}`;
  $('#channelCount').textContent=3*(Math.pow(2,2)-1);
}
function targetArray(label, type){
  const c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d');
  x.fillStyle='#000';x.fillRect(0,0,n,n);
  if(type==='two'){
    const r=seed([...label].reduce((a,c)=>a+c.charCodeAt(0),0)); const q=8, cell=14, ox=24, oy=24;
    x.fillStyle='#fff';
    for(let yy=0;yy<q;yy++)for(let xx=0;xx<q;xx++)if(r()>.49)x.fillRect(ox+xx*cell,oy+yy*cell,cell-2,cell-2);
    for(const [ax,ay] of [[0,0],[5,0],[0,5]]){x.fillStyle='#000';x.fillRect(ox+ax*cell,oy+ay*cell,3*cell,3*cell);x.fillStyle='#fff';x.fillRect(ox+(ax+1)*cell,oy+(ay+1)*cell,cell,cell)}
  }else{
    x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.font=`${type==='both'?31:48}px SimSun, serif`;
    label.split(' ').forEach((t,i,a)=>x.fillText(t,n/2,n/2+(i-(a.length-1)/2)*(type==='both'?35:52)));
    x.strokeStyle='rgba(255,255,255,.68)';x.lineWidth=1;x.strokeRect(15,15,n-30,n-30);
  }
  const d=x.getImageData(0,0,n,n).data; const result=new Float32Array(n*n);
  for(let i=0;i<result.length;i++)result[i]=d[i*4]/255;
  return result;
}
function makeField(target, strength){
  const out=new Float32Array(n*n);const rng=seed(state.wave*11+state.spacing*7+(state.ms1?1:0)+(state.ms2?9:0));
  const mismatch=1-strength;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const i=y*n+x, u=x/n-.5,v=y/n-.5,r=Math.hypot(u,v);
    const phi=2*Math.PI*(18*(u*u+v*v)+(state.spacing-500)*.014*(u-v)+(state.wave-550)*.006*(u+v));
    const carrier=.5+.5*Math.cos(phi);
    const sx=(x+Math.round(14*mismatch*Math.sin(y*.11)))%n,sy=(y+Math.round(10*mismatch*Math.cos(x*.09)))%n;
    const moved=target[(sy+n)%n*n+(sx+n)%n];
    const speckle=(.5+.5*Math.sin(x*.79+y*.43+phi*1.9))*(.28+.72*rng());
    out[i]=Math.max(0,Math.min(1,strength*(.82*target[i]+.18*carrier*target[i]) + mismatch*(.30*moved+.70*speckle)*(1-.2*Math.exp(-r*r*16))));
  }
  return blur(out, strength>.9?0:Math.ceil(2+mismatch*4));
}
function blur(input, radius){
  if(!radius)return input;const out=new Float32Array(input.length);const d=radius*2+1;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){let s=0,c=0;for(let j=-radius;j<=radius;j+=2)for(let i=-radius;i<=radius;i+=2){const xx=x+i,yy=y+j;if(xx>=0&&xx<n&&yy>=0&&yy<n){s+=input[yy*n+xx];c++}}out[y*n+x]=s/c}return out;
}
function drawField(canvas, field, ghost=false){
  const c=canvas.getContext('2d'), image=c.createImageData(n,n), [ink,paper]=palettes[state.wave];
  const p=parseColor(paper), q=parseColor(ink); let mx=.001; for(const a of field)mx=Math.max(mx,a);
  for(let i=0;i<field.length;i++){const z=Math.pow(field[i]/mx,.76), off=i*4;image.data[off]=p[0]*(1-z)+q[0]*z;image.data[off+1]=p[1]*(1-z)+q[1]*z;image.data[off+2]=p[2]*(1-z)+q[2]*z;image.data[off+3]=255}
  const tmp=document.createElement('canvas');tmp.width=tmp.height=n;tmp.getContext('2d').putImageData(image,0,0);c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=true;c.drawImage(tmp,0,0,canvas.width,canvas.height);
  if(ghost){c.strokeStyle='rgba(170,68,51,.55)';c.lineWidth=1;c.strokeRect(8,8,canvas.width-16,canvas.height-16)}
}
function parseColor(hex){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]}
function quality(){if(mode()==='none')return 0.03;if(mode()!=='both')return state.isWrong?.13:.90;const q=Math.exp(-Math.pow((state.spacing-500)/(state.isWrong?38:9),2));return state.isWrong?Math.max(.05,.38*q):q}
function evaluate(){
  updateControls();const m=mode(), q=quality(), target=targetArray(intended(),m), received=makeField(target,q);
  drawField(canvases.target,target);drawField(canvases.received,received,!signal()||state.isWrong);
  let mse=0,sa=0,sb=0,aa=0,bb=0;for(let i=0;i<target.length;i++){mse+=(target[i]-received[i])**2;sa+=target[i];sb+=received[i]}sa/=target.length;sb/=target.length;for(let i=0;i<target.length;i++){const a=target[i]-sa,b=received[i]-sb;aa+=a*a;bb+=b*b;}
  const corr=Array.from(target).reduce((s,a,i)=>s+(a-sa)*(received[i]-sb),0)/Math.sqrt(aa*bb+.000001); const pce=(.38+.42*q)*(m==='both'?.83:1);
  $('#mse').textContent=(mse/target.length).toFixed(4);$('#corr').textContent=Math.max(-1,Math.min(1,corr)).toFixed(3);$('#pce').textContent=(pce*100).toFixed(1)+'%';
  $('#distanceTag').textContent=m==='both'?`d = ${state.spacing} μm`:'单层模式';$('#resultTitle').textContent=signal()&&!state.isWrong?`读取成功 · ${intended()}`:`${m==='none'?'无有效层组合':'错钥输出 · 无法稳定读取'}`;
  $('#signalLabel').textContent=signal()&&!state.isWrong?'密钥吻合':'密钥失配';$('.signal').classList.toggle('bad',!(signal()&&!state.isWrong));renderGrid();drawChart();
}
function drawChart(){
  const c=ctx.chart,w=canvases.chart.width,h=canvases.chart.height;c.clearRect(0,0,w,h);c.fillStyle='#f3eee3';c.fillRect(0,0,w,h); const left=43,right=16,top=11,bottom=28;
  c.strokeStyle='rgba(31,37,35,.2)';c.lineWidth=1;c.beginPath();c.moveTo(left,top);c.lineTo(left,h-bottom);c.lineTo(w-right,h-bottom);c.stroke();
  c.strokeStyle='#153e39';c.lineWidth=2;c.beginPath();for(let d=420;d<=580;d+=2){const q=Math.exp(-Math.pow((d-500)/9,2));const x=left+(d-420)/160*(w-left-right),y=top+(1-q)*(h-top-bottom);d===420?c.moveTo(x,y):c.lineTo(x,y)}c.stroke();
  c.setLineDash([4,4]);c.strokeStyle='#aa4433';const sx=left+(state.spacing-420)/160*(w-left-right);c.beginPath();c.moveTo(sx,top);c.lineTo(sx,h-bottom);c.stroke();c.setLineDash([]);c.fillStyle='#6e716b';c.font='12px Times New Roman';c.fillText('420',left-5,h-8);c.fillText('500',left+(80/160)*(w-left-right)-8,h-8);c.fillText('580 μm',w-53,h-8);c.fillText('C',25,17);
}
function renderGrid(){
  const entries=[];for(const wave of [450,550,650])for(const [id,label,desc] of [['one','身份图','MS₁ 独立工作'],['two','索引图','MS₂ 独立工作'],['both','密码图','MS₁ + MS₂，d = 500 μm']])entries.push({wave,id,label,desc});
  $('#channelGrid').innerHTML=entries.map((e,i)=>`<article class="channel ${e.wave===state.wave&&e.id===mode()?'selected':''}"><span class="n">${String(i+1).padStart(2,'0')} · ${e.wave} nm</span><h3>${e.label}</h3><p>${e.desc}</p><span class="badge">${e.id==='both'?'物理密钥':'模块通道'}</span></article>`).join('');
}
function train(){ if(state.trained>=1000){state.trained=0} const started=performance.now(); const step=()=>{state.trained=Math.min(1000,Math.round((performance.now()-started)/2.1));drawLoss();if(state.trained<1000)requestAnimationFrame(step);else $('#trainingText').textContent='1000 次联合更新完成：各层的单层任务与级联密码任务共同约束同一组相位参数。'};step();}
function drawLoss(){const c=ctx.loss,w=canvases.loss.width,h=canvases.loss.height;c.clearRect(0,0,w,h);c.strokeStyle='rgba(255,255,255,.32)';c.beginPath();c.moveTo(0,h-18);c.lineTo(w,h-18);c.stroke();c.strokeStyle='#d8a45f';c.lineWidth=2;c.beginPath();for(let i=0;i<=Math.max(1,state.trained);i+=10){const t=i/1000,loss=.83*Math.exp(-3.5*t)+.035+.02*Math.sin(20*t)*Math.exp(-2*t);const x=i/1000*(w-6)+3,y=8+loss*(h-31);i===0?c.moveTo(x,y):c.lineTo(x,y)}c.stroke();c.fillStyle='#d7c8ad';c.font='11px Times New Roman';c.fillText('0',2,h-5);c.fillText('1000',w-30,h-5);$('#iteration').textContent=`${state.trained} / 1000`;}
document.querySelectorAll('[data-wave]').forEach(b=>b.addEventListener('click',()=>{state.wave=+b.dataset.wave;state.isWrong=false;evaluate()}));
$('#ms1').addEventListener('change',e=>{state.ms1=e.target.checked;state.isWrong=false;evaluate()});$('#ms2').addEventListener('change',e=>{state.ms2=e.target.checked;state.isWrong=false;evaluate()});$('#spacing').addEventListener('input',e=>{state.spacing=+e.target.value;state.isWrong=false;evaluate()});
$('#wrongKey').addEventListener('click',()=>{state.isWrong=true;if(mode()==='both')state.spacing=548;else if(mode()==='one')state.ms1=false;else if(mode()==='two')state.ms2=false;else {state.ms1=true;state.ms2=true;state.spacing=548}evaluate();$('.results').classList.add('flash');setTimeout(()=>$('.results').classList.remove('flash'),500)});
$('#restoreKey').addEventListener('click',()=>{state.isWrong=false;if(mode()==='none'){state.ms1=true;state.ms2=true}if(mode()==='both')state.spacing=500;evaluate()});$('#scanBtn').addEventListener('click',()=>{drawChart();$('#chart').classList.add('flash');setTimeout(()=>$('#chart').classList.remove('flash'),500)});$('#trainBtn').addEventListener('click',train);
drawLoss();evaluate();
