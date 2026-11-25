/* Participant eWorkbook · learner-only notes and activities.
   Reads workbook-data.js (learner-safe titles + approved thumbnails). No instructor data. No network calls. */
(()=>{
'use strict';
const C=window.WorkbookData;
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function download(name,contents,mime='application/json'){const b=new Blob([contents],{type:mime});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);}
const key=`ewb_${C.code}_v2`;
const slides=C.slides||[],activities=C.workbooks||[];
let answers={},notes={};
try{const p=JSON.parse(localStorage.getItem(key)||'null');if(p){answers=p.answers||{};notes=p.notes||{};}}catch(e){answers={};notes={};}
const $=s=>document.querySelector(s);
const notePages=$('#note-pages'),actPages=$('#workbook-pages'),notesNav=$('#notes-nav'),activityNav=$('#activity-nav'),lightbox=$('#slide-lightbox');
document.title=`${C.name} · Participant eWorkbook`;$('#wb-course').textContent=C.name;

// Thumbnails come ONLY from approved learner-safe assets. Never instructor screenshots or final reveal states.
function safeSlide(s){
  const src=String(s.learnerSafeThumbnail||'');
  if(s.thumbnailRequiresReview||!src)return `<div class="wb-slide-unavailable">Slide preview pending approval for slide ${s.id}</div>`;
  if(!/^assets\/[a-zA-Z0-9_./-]+\.(png|jpe?g|webp|svg)$/i.test(src)||src.includes('..'))return '<div class="wb-slide-unavailable">Approved thumbnail unavailable</div>';
  return `<img class="wb-safe-image" src="${E(src)}" alt="Slide ${s.id}: ${E(s.title)}">`;}
function saveLocal(){try{localStorage.setItem(key,JSON.stringify({format:'participant-workbook-v2',course:C.code,answers,notes}));return true}catch(e){return false}}
function noteMarkup(s){const related=activities.filter(a=>a.slideId===s.id);
  return `<article class="page wb-note-page" id="note-${s.id}"><div class="eyebrow">${E(C.modules?.[s.module]||'Course')} · Slide ${s.id}</div><h2>${E(s.title)}</h2><div class="wb-note-layout"><div class="wb-slide-col"><button type="button" class="wb-slide-thumb" data-enlarge="${s.id}" aria-label="Enlarge slide ${s.id}: ${E(s.title)}"><span class="wb-slide-stage">${safeSlide(s)}</span><span class="wb-zoom-label">Enlarge slide</span></button>${related.map(a=>`<button type="button" class="wb-activity-link no-print" data-open-activity="${E(a.id)}">Open activity: ${E(a.title)}</button>`).join('')}</div><div class="wb-note-col"><label for="slide-note-${s.id}">My notes · Slide ${s.id}</label><textarea id="slide-note-${s.id}" data-note="${s.id}" placeholder="Write your notes here...">${E(notes[s.id]||'')}</textarea><span class="wb-save-hint">Autosaved in this browser</span></div></div></article>`;}
function renderNotes(filter=''){const q=filter.trim().toLowerCase();
  const m=slides.filter(s=>!q||`${s.id} ${s.title} ${C.modules?.[s.module]||''}`.toLowerCase().includes(q));
  notePages.innerHTML=m.length?m.map(noteMarkup).join(''):'<p>No matching slides.</p>';
  let prev=-1;notesNav.innerHTML=m.map(s=>{const g=s.module!==prev?`<div class="side-group">${E(C.modules?.[s.module]||'')}</div>`:'';prev=s.module;
    const star=activities.some(a=>a.slideId===s.id)?' <span class="star" title="Has an eWorkbook activity">*</span>':'';
    return g+`<a class="side-link" href="#note-${s.id}" data-side="${s.id}">${s.id}. ${E(s.title)}${star}</a>`;}).join('')||'<p class="tiny muted">No matching slides.</p>';
  watch();}
/* Highlight the slide currently in view. */
let io=null;function watch(){if(io)io.disconnect();if(!('IntersectionObserver' in window))return;
  io=new IntersectionObserver(es=>{for(const en of es)if(en.isIntersecting){const id=en.target.id.slice(5);notesNav.querySelectorAll('.side-link').forEach(a=>{const on=a.dataset.side===id;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});}},{rootMargin:'-20% 0px -70% 0px'});
  notePages.querySelectorAll('.wb-note-page').forEach(el=>io.observe(el));}
notesNav.addEventListener('click',e=>{if(e.target.closest('.side-link'))selectTab('notes');});
function renderActivities(){activityNav.innerHTML=activities.map((a,i)=>`<a class="button" href="#${E(a.id)}">${i+1}. ${E(a.title)}</a>`).join('');
  actPages.innerHTML=activities.map((a,i)=>`<section class="page" id="${E(a.id)}"><div class="eyebrow">Activity ${i+1} · Slide ${a.slideId}</div><h2>${E(a.title)}</h2><p>${E(a.prompt)}</p>${a.fields.map(f=>`<div class="field"><div class="copy-row"><label for="${E(a.id)}-${E(f.key)}">${E(f.label)}</label><button type="button" class="small copy-btn no-print" data-copy-for="${E(a.id)}-${E(f.key)}" aria-label="Copy: ${E(f.label)}">Copy</button></div><textarea id="${E(a.id)}-${E(f.key)}" data-act="${E(a.id)}" data-field="${E(f.key)}">${E((answers[a.id]||{})[f.key]||'')}</textarea></div>`).join('')}</section>`).join('')||'<p>This course has no separate workbook activities.</p>';}
function selectTab(which){const n=which==='notes';if(!n)notesNav.querySelectorAll('.side-link.active').forEach(a=>{a.classList.remove('active');a.removeAttribute('aria-current');});$('#pane-notes').hidden=!n;$('#pane-activities').hidden=n;
  for(const [id,sel] of [['tab-notes',n],['tab-activities',!n]]){const b=document.getElementById(id);b.setAttribute('aria-selected',String(sel));b.tabIndex=sel?0:-1;b.classList.toggle('active',sel);}}
/* Optional participant downloads (data: downloads:[{title,file,note}]). Files must sit in this package's downloads/ folder. */
const downloads=(C.downloads||[]).filter(d=>d&&/^downloads\/[a-zA-Z0-9_.\/ -]+$/.test(String(d.file||''))&&!String(d.file).includes('..'));
function renderDownloads(){if(!downloads.length)return;actPages.insertAdjacentHTML('beforeend',`<section class="page" id="wb-downloads"><div class="eyebrow">Resources</div><h2>Downloads</h2><ul class="wb-downloads">${downloads.map(d=>`<li><a href="${E(encodeURI(d.file))}" download>${E(d.title||d.file)}</a>${d.note?` <span class="muted">${E(d.note)}</span>`:''}</li>`).join('')}</ul></section>`);
  if(!activities.length){actPages.querySelector('p')?.remove();}else activityNav.insertAdjacentHTML('beforeend','<a class="button" href="#wb-downloads">Downloads</a>');}
renderNotes();renderActivities();renderDownloads();selectTab('notes');
if(!activities.length&&!downloads.length)$('#tab-activities').hidden=true;
$('#tab-notes').onclick=()=>selectTab('notes');$('#tab-activities').onclick=()=>selectTab('activities');
$('.wb-tabs').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){const toNotes=$('#tab-activities').getAttribute('aria-selected')==='true';selectTab(toNotes?'notes':'activities');(toNotes?$('#tab-notes'):$('#tab-activities')).focus();}});
$('#notes-search').addEventListener('input',e=>renderNotes(e.target.value));
notePages.addEventListener('input',e=>{const t=e.target;if(t.dataset.note){notes[t.dataset.note]=t.value;saveLocal();}});
actPages.addEventListener('input',e=>{const t=e.target;if(t.dataset.act){answers[t.dataset.act]={...answers[t.dataset.act],[t.dataset.field]:t.value};saveLocal();}});
notePages.addEventListener('click',e=>{
  const en=e.target.closest('[data-enlarge]');if(en){const s=slides.find(x=>String(x.id)===en.dataset.enlarge);if(!s)return;$('#lightbox-title').textContent=`Slide ${s.id}: ${s.title}`;$('#lightbox-stage').innerHTML=safeSlide(s);lightbox.showModal?lightbox.showModal():lightbox.setAttribute('open','');return;}
  const act=e.target.closest('[data-open-activity]');if(act){selectTab('activities');document.getElementById(act.dataset.openActivity)?.scrollIntoView({behavior:'smooth',block:'start'});}});
$('#close-lightbox').onclick=()=>lightbox.close();lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});
const stamp=()=>new Date().toISOString().slice(0,10);
$('#save-responses').onclick=()=>download(`${C.code}_eWorkbook_Backup_${stamp()}.json`,JSON.stringify({format:'participant-workbook-v2',course:C.code,exported:new Date().toISOString(),notes,answers},null,2));
function readable(){return ['<!doctype html><html lang="en"><head><meta charset="utf-8"><title>My course notes</title><style>body{font:11pt Arial,sans-serif;line-height:1.55;margin:35px auto;max-width:780px;color:#203347}h1{color:#15324e}h2{color:#136b77;border-bottom:1px solid #ddd;padding-bottom:5px;margin-top:28px}.note{white-space:pre-wrap;overflow-wrap:anywhere}small{color:#617587}</style></head><body>',
  `<h1>${E(C.name)} · My course notes</h1><small>Exported ${E(new Date().toLocaleDateString())}</small>`,
  ...slides.map(s=>`<section><h2>Slide ${s.id}: ${E(s.title)}</h2><div class="note">${E(notes[s.id]||'No notes entered.')}</div></section>`),
  ...activities.map(a=>`<section><h2>Activity: ${E(a.title)}</h2>${a.fields.map(f=>`<p><b>${E(f.label)}</b><br><span class="note">${E((answers[a.id]||{})[f.key]||'—')}</span></p>`).join('')}</section>`),'</body></html>'].join('');}
$('#export-notes').onclick=()=>download(`${C.code}_My_Course_Notes_${stamp()}.html`,readable(),'text/html');
$('#import-responses').onclick=()=>$('#file-import').click();
$('#file-import').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;const p=JSON.parse(await f.text());
  if(p.format!=='participant-workbook-v2'||p.course!==C.code)throw Error('This is not a backup of this eWorkbook.');
  if(typeof p.answers!=='object'||!p.answers||Array.isArray(p.answers)||typeof p.notes!=='object'||!p.notes||Array.isArray(p.notes))throw Error('The file is damaged.');
  answers=p.answers;notes=p.notes;renderNotes($('#notes-search').value);renderActivities();renderDownloads();saveLocal();alert('Your workbook has been restored.');}
  catch(err){alert('Unable to restore: '+err.message);}e.target.value='';};
$('#print-workbook').onclick=()=>window.print();
/* Copy-to-chat (standard v1.3): copies only to the participant's own clipboard. */
async function copyText(text){let ok=false;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);ok=true;}}catch(e){}
  if(!ok){const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:-9999px';document.body.append(ta);ta.select();try{ok=document.execCommand('copy')}catch(e){}ta.remove();}
  return ok;}
function flash(btn,msg,good){btn.textContent=msg;btn.classList.toggle('ok',!!good);clearTimeout(btn._t);btn._t=setTimeout(()=>{btn.textContent='Copy';btn.classList.remove('ok');},1800);}
actPages.addEventListener('click',async e=>{const b=e.target.closest('[data-copy-for]');if(!b)return;const v=(document.getElementById(b.dataset.copyFor)?.value||'').trim();
  if(!v){flash(b,'Nothing to copy yet');return;}
  if(await copyText(v))flash(b,'Copied',true);else flash(b,'Select the text and copy it');});
/* Collapsible side menu (standard v1.4). Local UI preference only. */
const SIDE_KEY='ewb_ui_side_collapsed';
function applySide(collapsed){document.body.classList.toggle('side-collapsed',collapsed);const b=$('#side-toggle');b.textContent=collapsed?'»':'«';
  b.setAttribute('aria-expanded',String(!collapsed));b.setAttribute('aria-label',collapsed?'Expand slide menu':'Collapse slide menu');b.title=b.getAttribute('aria-label');$('#side-body').inert=collapsed;}
let sideCollapsed=false;try{sideCollapsed=localStorage.getItem(SIDE_KEY)==='1'}catch(e){}
applySide(sideCollapsed);
$('#side-toggle').onclick=()=>{sideCollapsed=!sideCollapsed;try{localStorage.setItem(SIDE_KEY,sideCollapsed?'1':'0')}catch(e){}applySide(sideCollapsed);};
})();
