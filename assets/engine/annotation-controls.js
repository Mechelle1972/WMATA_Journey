/* C² Instructor Hub engine · instructor annotation tools (adapted from reference v1.1).
   Marks drawn on the private preview are sent to the participant display. */
(function(){
'use strict';
const {read,send,download}=C2Hub;
const preview=document.getElementById('preview'),bar=document.getElementById('ink-toolbar');if(!bar)return;
let tool='off',color='#e97624',draft=null,dirty=false;const undone={};
const tools=['off','pen','highlight','line','rect','circle','text','erase'];
const names={off:'Pointer',pen:'Pen',highlight:'Highlight',line:'Line',rect:'Rectangle',circle:'Circle',text:'Text',erase:'Erase'};
function toolbar(){bar.innerHTML=`<div class="ink-row" role="toolbar" aria-label="Slide annotation tools">${tools.map(v=>`<button type="button" class="small ${tool===v?'ink-selected':''}" data-ink-tool="${v}" aria-pressed="${tool===v}">${names[v]}</button>`).join('')}<label class="ink-color-label">Ink <input id="ink-color" type="color" value="${color}" aria-label="Annotation color"></label><span class="ink-sep" aria-hidden="true"></span><button type="button" class="small" id="ink-undo">Undo</button><button type="button" class="small" id="ink-redo">Redo</button><button type="button" class="small warn" id="ink-clear">Clear marks</button><button type="button" class="small" id="ink-save">Save marks as PNG</button></div><p class="tiny muted" id="ink-status" aria-live="polite">${tool==='off'?'Choose a tool to mark up the slide. Marks appear on the participant display.':'Draw on the slide preview. Choose Pointer when you’re done.'}</p>`;
  preview.classList.toggle('ink-enabled',tool!=='off');}
const status=t=>{const el=document.getElementById('ink-status');if(el)el.textContent=t;};
const id=()=>String(read().slide);
function commitMarks(arr){const st=read();st.annotations={...(st.annotations||{}),[id()]:arr};send(st);C2Stage.paint(preview,st);window.dispatchEvent(new CustomEvent('c2-ink-change'));}
function mutate(fn){const cur=((read().annotations||{})[id()]||[]).slice();const next=fn(cur);if(!next)return;undone[id()]=[];commitMarks(next);}
bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.inkTool){tool=b.dataset.inkTool;toolbar();return;}
  const k=id(),arr=((read().annotations||{})[k]||[]);
  if(b.id==='ink-undo'&&arr.length){(undone[k]??=[]).push(arr[arr.length-1]);commitMarks(arr.slice(0,-1));}
  if(b.id==='ink-redo'){const v=(undone[k]||[]).pop();if(v)commitMarks([...arr,v]);}
  if(b.id==='ink-clear'&&arr.length&&confirm('Clear all marks on this slide?'))mutate(()=>[]);
  if(b.id==='ink-save')savePng(arr,k);});
bar.addEventListener('input',e=>{if(e.target.id==='ink-color')color=e.target.value;});
function pos(ev){const svg=preview.querySelector('.c2-ink-layer');if(!svg)return null;const r=svg.getBoundingClientRect();
  return [Math.round(Math.max(0,Math.min(1000,(ev.clientX-r.left)/r.width*1000))*10)/10,Math.round(Math.max(0,Math.min(562.5,(ev.clientY-r.top)/r.height*562.5))*10)/10];}
function drawDraft(){const svg=preview.querySelector('.c2-ink-layer');if(!svg)return;svg.querySelector('#c2-live-draft')?.remove();if(!draft)return;
  const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.id='c2-live-draft';g.innerHTML=C2Ink.item(draft);svg.appendChild(g);}
preview.addEventListener('pointerdown',e=>{if(tool==='off')return;const p=pos(e);if(!p)return;e.preventDefault();
  if(tool==='erase'){const arr=(read().annotations||{})[id()]||[];let idx=-1,best=55;arr.forEach((o,i)=>{const pts=o.points||[[o.x,o.y],[o.x2??o.x,o.y2??o.y]];for(const q of pts){const d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<best){best=d;idx=i;}}});if(idx>=0)mutate(a=>a.filter((_,i)=>i!==idx));return;}
  if(tool==='text'){const v=prompt('Text to place on the slide:');if(v&&v.trim())mutate(a=>[...a,{kind:'text',x:p[0],y:p[1],color,text:v.trim().slice(0,160)}]);return;}
  draft={kind:tool,x:p[0],y:p[1],x2:p[0],y2:p[1],points:[p],color};dirty=false;preview.setPointerCapture(e.pointerId);drawDraft();});
preview.addEventListener('pointermove',e=>{if(!draft)return;const p=pos(e);if(!p)return;dirty=true;
  if(draft.kind==='pen'||draft.kind==='highlight'){if(draft.points.length<2000)draft.points.push(p);}else{draft.x2=p[0];draft.y2=p[1];}drawDraft();});
function finish(){if(!draft)return;const o=draft;draft=null;if(!dirty&&['rect','circle','line'].includes(o.kind)){o.x2=o.x+30;o.y2=o.y+30;}mutate(a=>[...a,o]);}
preview.addEventListener('pointerup',finish);preview.addEventListener('pointercancel',()=>{draft=null;drawDraft();});
function savePng(arr,k){const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=900;const ctx=canvas.getContext('2d');
  const s=C2Hub.slideById(+k);const st=read();const base=new Image();
  const drawMarks=()=>{const url=URL.createObjectURL(new Blob([C2Ink.svgDocument(arr,'transparent').replace('<rect width="1000" height="562.5" fill="transparent"/>','')],{type:'image/svg+xml'}));
    const img=new Image();img.onload=()=>{ctx.drawImage(img,0,0,1600,900);URL.revokeObjectURL(url);canvas.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`${C2Hub.C.code}_Slide${k}_Marked.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);status('Saved the slide with your marks.');},'image/png');};
    img.onerror=()=>{URL.revokeObjectURL(url);status('PNG export isn’t available in this browser. Use Download session file instead.');};img.src=url;};
  if(st.blankBoards&&st.blankBoards[k]){ctx.fillStyle='#fff';ctx.fillRect(0,0,1600,900);drawMarks();return;}
  base.onload=()=>{ctx.drawImage(base,0,0,1600,900);drawMarks();};base.onerror=()=>{ctx.fillStyle='#fff';ctx.fillRect(0,0,1600,900);drawMarks();};
  base.src=s.states[Math.min(st.reveal,s.states.length-1)].img;}
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!/INPUT|TEXTAREA/.test(document.activeElement?.tagName||'')){e.preventDefault();document.getElementById(e.shiftKey?'ink-redo':'ink-undo')?.click();}});
toolbar();
})();
