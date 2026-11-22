/* C² Instructor Hub engine · My notes (private, per-slide instructor notes).
   Instructor-only. Notes live in this browser's localStorage under their own key. They are never
   added to the shared hub state, never broadcast, and never reach the participant display.
   Load after sync.js and BEFORE instructor.js. Requires the #my-notes markup in instructor.html. */
(function(){
'use strict';
const {C,esc:E,download,slideById}=C2Hub;
const KEY=C2Hub.KEY+'_mynotes', OPEN_KEY=KEY+'_open', FORMAT='c2hub-mynotes-v1', MAX=5000;
const TYPES=['Reminder','Suggested revision','Content update','Timing','Technical issue'];
const $=id=>document.getElementById(id);
const root=$('my-notes');
if(!root){window.C2MyNotes={has:()=>false,sync:()=>{}};return;}
let notes=load(),current=0;

function clean(raw){const out={};if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
  for(const [k,v] of Object.entries(raw)){const id=Number(k);if(!C.slides.some(s=>s.id===id)||!v||typeof v!=='object')continue;
    const text=String(v.text??'').slice(0,MAX);if(!text.trim())continue;
    out[id]={type:TYPES.includes(v.type)?v.type:TYPES[0],text,updated:Number(v.updated)||Date.now()};}
  return out;}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');return d&&d.course===C.code?clean(d.notes):{}}catch(e){return {}}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify({format:FORMAT,course:C.code,notes}));return true}catch(e){return false}}
function has(id){const n=notes[id];return !!(n&&n.text.trim());}
function ids(){return C.slides.filter(s=>has(s.id)).map(s=>s.id);}
function when(ts){return ts?new Date(ts).toLocaleString([], {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'';}
function changed(){window.dispatchEvent(new CustomEvent('c2-mynotes-change'));}

/* ---------- panel ---------- */
$('mn-type').innerHTML=TYPES.map(t=>`<option>${E(t)}</option>`).join('');
$('mn-text').maxLength=MAX;
try{root.open=localStorage.getItem(OPEN_KEY)==='1';}catch(e){}
root.addEventListener('toggle',()=>{try{localStorage.setItem(OPEN_KEY,root.open?'1':'0')}catch(e){}});

function paintSummary(){const n=notes[current],on=has(current);
  root.classList.toggle('has-note',on);
  const first=on?n.text.trim().split('\n')[0]:'';
  $('mn-sum').textContent=on?`${n.type} · ${first.length>60?first.slice(0,60)+'…':first}`:'Add a private note for this slide';
  const c=ids().length;$('mn-count').innerHTML=c?`<b>${c}</b> slide${c===1?' has a note':'s have notes'}. Print or download them to share suggested revisions.`:'No slides have notes yet.';
  $('mn-saved').textContent=on?`Saved in this browser · ${when(n.updated)}`:'Only you see this note.';
  $('mn-delete').disabled=!on;}
function sync(s){if(!s||s.id===current)return;current=s.id;
  const n=notes[current];$('mn-text').value=n?n.text:'';$('mn-type').value=n?n.type:TYPES[0];
  $('mn-slide').textContent=`Slide ${s.id}`;paintSummary();}
function edit(){const text=$('mn-text').value.slice(0,MAX),type=$('mn-type').value;
  if(text.trim())notes[current]={type,text,updated:Date.now()};else delete notes[current];
  if(!persist()){$('mn-saved').textContent='The browser could not save this note. Back up your notes now.';return;}
  paintSummary();changed();}
$('mn-text').addEventListener('input',edit);
$('mn-type').addEventListener('change',()=>{if(has(current))edit();});
$('mn-delete').addEventListener('click',()=>{if(!has(current))return;if(!confirm(`Delete your note for slide ${current}?`))return;
  delete notes[current];persist();$('mn-text').value='';$('mn-type').value=TYPES[0];paintSummary();changed();});

/* ---------- print / PDF report ---------- */
function report(){
  const list=ids();const base=location.href;
  const items=list.map(id=>{const s=slideById(id),n=notes[id],img=new URL(s.states[s.states.length-1].img,base).href;
    return `<section class="item"><div class="eyebrow">${E(C.modules[s.module]||'')} · Slide ${s.id} of ${C.slides.length}</div><h2>${E(s.title)}</h2>
    <div class="row"><img src="${E(img)}" alt="Slide ${s.id}"><div><p class="type">${E(n.type)}</p><div class="note">${E(n.text)}</div><p class="meta">Last edited ${E(when(n.updated))}</p></div></div></section>`;}).join('');
  const counts=TYPES.map(t=>[t,list.filter(id=>notes[id].type===t).length]).filter(x=>x[1]).map(([t,c])=>`${c} ${E(t.toLowerCase())}${c>1&&!/s$/.test(t)?'s':''}`).join(' · ');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>My instructor notes · ${E(C.name)}</title>
<style>body{font:11pt Aptos,'Segoe UI',Arial,sans-serif;color:#203347;max-width:900px;margin:30px auto;padding:0 20px;line-height:1.5}
h1{color:#15324e;font-size:21pt;margin:4px 0}h2{color:#15324e;font-size:13.5pt;margin:2px 0 8px}.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:8pt;font-weight:700;color:#136b77}
.meta{color:#5d7183;font-size:9.5pt;margin:4px 0}.fill{display:flex;gap:28px;margin:14px 0 6px;font-size:10pt}.fill span{flex:1;border-bottom:1px solid #9fb0bb;padding-bottom:2px}
.item{border-top:2px solid #d7e1e6;padding-top:14px;margin-top:18px;break-inside:avoid}.row{display:grid;grid-template-columns:40% 1fr;gap:18px;align-items:start}
.row img{width:100%;border:1px solid #ccd;border-radius:4px}.type{display:inline-block;font-weight:800;font-size:8.5pt;letter-spacing:.06em;text-transform:uppercase;background:#fff3e3;color:#8a4b17;border:1px solid #e4c39f;border-radius:5px;padding:1px 7px;margin:0 0 6px}
.note{white-space:pre-wrap;overflow-wrap:anywhere}button{font:inherit;padding:7px 12px;border-radius:8px;border:1px solid #15324e;background:#15324e;color:#fff;cursor:pointer}
@media print{body{margin:0;max-width:none}.noprint{display:none}}</style></head><body>
<div class="eyebrow">Instructor-only · private notes</div><h1>${E(C.name)}: my slide notes</h1>
<p class="meta">${list.length} slide${list.length===1?'':'s'} with notes${counts?' · '+counts:''} · Printed ${E(new Date().toLocaleDateString())}</p>
<div class="fill"><span>Instructor:</span><span>Session date:</span></div>
<p class="meta">Notes are from the instructor's browser. Share them with the course designer to suggest updates or revisions.</p>
<p class="noprint"><button onclick="print()">Print or save as PDF</button></p>${items}</body></html>`;}
$('mn-print').addEventListener('click',()=>{if(!ids().length){alert('You have no notes yet. Type a note on any slide first.');return;}
  const w=window.open('','_blank');if(!w){alert('The browser blocked the notes window. Allow pop-ups for this site, then try again.');return;}
  w.document.open();w.document.write(report());w.document.close();});

/* ---------- spreadsheet, backup, restore ---------- */
const stamp=()=>new Date().toISOString().slice(0,10);
function csvCell(v){v=String(v??'');return /[",\r\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v;}
$('mn-csv').addEventListener('click',()=>{if(!ids().length){alert('You have no notes yet.');return;}
  const rows=[['Slide','Title','Module','Type','Note','Last edited']].concat(ids().map(id=>{const s=slideById(id),n=notes[id];return [s.id,s.title,C.modules[s.module]||'',n.type,n.text,when(n.updated)];}));
  download(`${C.code}_My_Instructor_Notes_${stamp()}.csv`,'﻿'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),'text/csv');});
$('mn-backup').addEventListener('click',()=>{if(!ids().length){alert('You have no notes yet.');return;}
  download(`${C.code}_My_Instructor_Notes_Backup_${stamp()}.json`,JSON.stringify({format:FORMAT,course:C.code,exported:new Date().toISOString(),notes},null,2));});
$('mn-restore').addEventListener('click',()=>$('mn-file').click());
$('mn-file').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;
  try{const d=JSON.parse(await f.text());
    if(d.format!==FORMAT)throw Error('This is not a My notes backup file.');
    if(d.course!==C.code)throw Error('This backup is for a different course.');
    const incoming=clean(d.notes);const n=Object.keys(incoming).length;if(!n)throw Error('The file has no notes.');
    const clash=Object.keys(incoming).filter(id=>has(id)).length;
    if(clash&&!confirm(`${n} notes found. ${clash} of them will replace notes you already have on the same slides. Continue?`))return;
    notes={...notes,...incoming};persist();const keep=current;current=0;sync(slideById(keep));changed();alert(`Restored notes for ${n} slide${n===1?'':'s'}.`);}
  catch(err){alert('Unable to restore notes: '+err.message);}});

window.C2MyNotes={has,sync,count:()=>ids().length};
sync(slideById(C2Hub.read().slide));
})();
