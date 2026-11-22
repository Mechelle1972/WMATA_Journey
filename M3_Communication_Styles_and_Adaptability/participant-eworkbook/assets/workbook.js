/* C² participant eWorkbook · course notes + activities. Learner-safe data only; no network calls.
   Notes and responses autosave to this browser's localStorage and can be backed up, restored, exported, and printed. */
(function(){
'use strict';
const W=window.C2Workbook,A=window.C2Activities||[],REF=window.C2Reference||[];
const KEY=W.storageKey,UIKEY=KEY+'_ui',FORMAT='c2-participant-workbook-v2';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slides=W.slides;
let notes={},answers={},storageOk=true;
try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');notes=d.notes||{};answers=d.answers||{};localStorage.setItem(KEY+'_test','1');localStorage.removeItem(KEY+'_test');}catch(e){storageOk=false;}
let saveTimer=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify({format:FORMAT,notes,answers,savedAt:new Date().toISOString()}));storageOk=true;}catch(e){storageOk=false;}
  status(storageOk?'Saved in this browser at '+new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})+'.':'This browser isn’t saving your work. Download a backup before you close the page.',!storageOk);}
const queueSave=()=>{clearTimeout(saveTimer);saveTimer=setTimeout(save,350);};
function status(t,warn){const el=$('#save-state');el.textContent=t;el.classList.toggle('warn',!!warn);}
const stamp=()=>new Date().toISOString().slice(0,10);
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);}
const grow=t=>{t.style.height='auto';t.style.height=Math.max(t.scrollHeight+2,parseInt(getComputedStyle(t).minHeight)||0)+'px';};

/* ---------- Collapsible side menu (standard) ---------- */
let ui={};try{ui=JSON.parse(localStorage.getItem(UIKEY))||{};}catch(e){}
function setSide(c){document.body.classList.toggle('side-collapsed',c);const b=$('#side-toggle');b.setAttribute('aria-expanded',String(!c));b.querySelector('[aria-hidden]').textContent=c?'»':'«';const l=c?'Expand menu':'Collapse menu';$('#side-toggle-label').textContent=l;b.title=l;ui.side=c;try{localStorage.setItem(UIKEY,JSON.stringify(ui));}catch(e){}}
$('#side-toggle').onclick=()=>setSide(!document.body.classList.contains('side-collapsed'));setSide(!!ui.side);

/* ---------- Course notes ---------- */
const actFor=part=>A.find(a=>a.part===part);
function thumbHTML(s){if(s.placeholder)return `<div class="placeholder">${E(s.placeholder)}</div>`;
  return `<button type="button" class="thumb" data-zoom="${s.id}" aria-label="Enlarge slide ${s.id}: ${E(s.title)}"><img src="assets/slides/${E(s.image)}" alt="Slide ${s.id}: ${E(s.title)}" loading="lazy"><span class="zoom">Enlarge slide</span></button>`;}
function renderPages(){let html='',prev=-1;
  slides.forEach(s=>{if(s.module!==prev){html+=`<h2 class="module-h" id="mod-${s.module}">${E(W.modules[s.module])}</h2>`;prev=s.module;}
    const a=s.part?actFor(s.part):null;
    html+=`<article class="page note-page" id="slide-${s.id}" data-slide="${s.id}"><h2>Slide ${s.id}: ${E(s.title)}</h2><div class="note-meta">${E(W.modules[s.module])}</div>
    <div class="note-grid"><div>${thumbHTML(s)}${a?`<a class="act-link" href="#${a.id}" data-open-act="${a.id}">Open activity: Part ${a.part} · ${E(a.title)} →</a>`:''}${s.hidden?'<p class="alt-note">Your instructor uses this slide only if your class stays in the main room for Round 2.</p>':''}</div>
    <div class="note-col"><label for="note-${s.id}">My notes · Slide ${s.id}</label><textarea id="note-${s.id}" data-note="${s.id}" placeholder="Write your notes here…">${E(notes[s.id]||'')}</textarea>
    <div class="note-foot"><span>Saves automatically in this browser</span><button type="button" class="small" data-clear="${s.id}" aria-label="Delete my notes for slide ${s.id}">Delete note</button></div></div></div></article>`;});
  $('#note-pages').innerHTML=html;$$('#note-pages textarea').forEach(grow);}
$('#note-pages').addEventListener('input',e=>{const t=e.target.closest('[data-note]');if(!t)return;const v=t.value;if(v.trim())notes[t.dataset.note]=v;else delete notes[t.dataset.note];grow(t);queueSave();renderNav();});
$('#note-pages').addEventListener('click',e=>{const z=e.target.closest('[data-zoom]');if(z){openLightbox(+z.dataset.zoom);return;}
  const c=e.target.closest('[data-clear]');if(c){const id=c.dataset.clear;if(!notes[id])return;if(!confirm(`Delete your notes for slide ${id}?`))return;delete notes[id];const t=$('#note-'+id);t.value='';grow(t);save();renderNav();}
  const o=e.target.closest('[data-open-act]');if(o){e.preventDefault();showActivity(o.dataset.openAct);}});

/* ---------- Navigation ---------- */
function renderNav(){const q=$('#wb-search').value.trim().toLowerCase();let html='',prev=-1;
  slides.forEach(s=>{if(q&&!(`${s.id} ${s.title}`.toLowerCase().includes(q)))return;if(s.module!==prev){html+=`<div class="nav-group">${E(W.modules[s.module])}</div>`;prev=s.module;}
    html+=`<a href="#slide-${s.id}" data-go="${s.id}"${current===s.id?' class="current" aria-current="true"':''}><span class="num">${s.id}.</span>${E(s.title)}${s.part?' <span class="star" title="Has an eWorkbook activity">*</span>':''}${notes[s.id]?' <span class="sr-only">(has notes)</span><span aria-hidden="true" style="color:#2f6b55">•</span>':''}</a>`;});
  $('#wb-nav').innerHTML=html||'<p class="muted" style="font-size:13px">No slides match.</p>';
  $('#wb-acts').innerHTML=A.map(a=>`<a href="#${a.id}" data-act="${a.id}">Part ${a.part} · ${E(a.title)}</a>`).join('')+'<a href="#quick-reference" data-act="quick-reference">Quick reference</a>';}
let current=1;
$('#wb-search').addEventListener('input',renderNav);
$('#wb-nav').addEventListener('click',e=>{const a=e.target.closest('[data-go]');if(!a)return;e.preventDefault();goTo(+a.dataset.go);});
$('#wb-acts').addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(!a)return;e.preventDefault();showActivity(a.dataset.act);});
function goTo(id){tab('notes');const el=$('#slide-'+id);if(!el)return;el.scrollIntoView({behavior:'smooth',block:'start'});current=id;renderNav();history.replaceState(null,'','#slide-'+id);setTimeout(()=>$('#note-'+id)?.focus({preventScroll:true}),400);}
const io=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){const id=+en.target.dataset.slide;if(id!==current){current=id;renderNav();}}});},{rootMargin:'-140px 0px -60% 0px'});

/* ---------- Tabs ---------- */
function tab(which){const n=which==='notes';$('#tab-notes').setAttribute('aria-selected',String(n));$('#tab-activities').setAttribute('aria-selected',String(!n));$('#tab-notes').tabIndex=n?0:-1;$('#tab-activities').tabIndex=n?-1:0;$('#pane-notes').hidden=!n;$('#pane-activities').hidden=n;
  (n?$$('#note-pages textarea'):$$('#activity-pages textarea')).forEach(grow);}
$('#tab-notes').onclick=()=>tab('notes');$('#tab-activities').onclick=()=>tab('activities');
$('.wb-tabs').addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const t=$('#tab-notes').getAttribute('aria-selected')==='true'?'activities':'notes';tab(t);$('#tab-'+t).focus();}});
function showActivity(id){tab('activities');const el=document.getElementById(id);if(el){el.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'','#'+id);setTimeout(()=>el.querySelector('textarea,input')?.focus({preventScroll:true}),400);}}

/* ---------- Activities ---------- */
const val=k=>String(answers[k]??'');
function copyBtn(target,label){return `<button type="button" class="small copy-btn" data-copy="${E(target)}" aria-label="Copy: ${E(label)}">Copy</button>`;}
function textField(b){return `<div class="fieldset"><div class="flabel"><label for="f-${b.key}">${E(b.label)}</label>${copyBtn(b.key,b.label)}</div><textarea id="f-${b.key}" data-answer="${b.key}" rows="${b.rows||4}">${E(val(b.key))}</textarea><div class="copy-msg" aria-live="polite" data-msg="${b.key}"></div></div>`;}
function block(b,a){
  switch(b.type){
  case 'text':return textField(b);
  case 'scenario':return `<div class="scenario${b.soft?' soft':''}"><span class="lbl">${E(b.label)}</span>${E(b.text)}</div>`;
  case 'pair':return `<div class="pair">${b.items.map(i=>`<div><b>${E(i[1])}</b>${E(i[2])}</div>`).join('')}</div>`;
  case 'chips':return `<div class="chips" aria-label="Four moves">${b.items.map(i=>`<span>${E(i)}</span>`).join('')}</div>`;
  case 'heading':return `<h3 class="act-sub">${E(b.text)}${b.meta?`<small>${E(b.meta)}</small>`:''}</h3>`;
  case 'para':return `<p>${E(b.text)}</p>`;
  case 'combine':return `<div class="fieldset combine"><div class="flabel"><span class="lt">Post in chat</span><button type="button" class="small copy-btn" data-combine="${b.keys.join(',')}" data-labels="${b.labels.join(',')}" aria-label="${E(b.name)}">${E(b.label)}</button></div><div class="copy-msg" aria-live="polite" data-msg="${b.keys.join(',')}"></div></div>`;
  case 'dials':return `<fieldset class="fieldset"><legend class="lt" style="font-weight:750;color:var(--navy)">${E(b.label)}</legend><div class="dials">${b.dials.map((d,i)=>{const k='p1_dial'+(i+1);return `<div class="dial" role="radiogroup" aria-label="${E(d[0])}"><span class="dn">${E(d[0])}</span><div class="opts">${[d[1],d[2]].map(o=>`<label><input type="radio" name="${k}" data-answer="${k}" value="${E(o)}" ${val(k)===o?'checked':''}> ${E(o)}</label>`).join('')}</div></div>`;}).join('')}</div><p class="muted" style="font-size:13px;margin:6px 0 0">${E(b.note)}</p></fieldset>`;
  case 'checklist':{const st=answers[b.key]||[];return `<fieldset class="fieldset"><legend class="lt" style="font-weight:750;color:var(--navy)">${E(b.label)}</legend><ul class="checks">${b.items.map((t,i)=>`<li><label><input type="checkbox" data-check="${b.key}" value="${i}" ${st.includes(i)?'checked':''}> <span>${i+1}. ${E(t)}</span></label></li>`).join('')}</ul></fieldset>`;}
  case 'frame':return `<div class="fieldset"><div class="flabel"><span class="lt">My commitment</span><button type="button" class="small copy-btn" data-frame="${b.key}" aria-label="Copy: My commitment">Copy commitment</button></div><div class="frame">${b.parts.map(p=>typeof p==='string'?E(p):`<label class="sr-only" for="f-${p.key}">${E(p.label)}</label><input type="text" id="f-${p.key}" data-answer="${p.key}" placeholder="${E(p.label)}" value="${E(val(p.key))}" size="${Math.max(16,p.label.length+2)}">`).join('')}</div><div class="copy-msg" aria-live="polite" data-msg="${b.key}"></div><p class="example"><b>Example</b> ${E(b.example)}</p></div>`;
  }return '';}
function renderActivities(){
  let html=A.map(a=>`<article class="page act-page" id="${a.id}"><div class="eyebrow">eWorkbook · Part ${a.part}</div><h2>Part ${a.part} · ${E(a.title)}</h2><div class="act-meta">${E(a.meta)} · <a href="#slide-${a.slide}" data-go-slide="${a.slide}">Slide ${a.slide}</a></div><p class="act-intro">${E(a.intro)}</p>${a.blocks.map(b=>block(b,a)).join('')}</article>`).join('');
  html+=`<article class="page act-page" id="quick-reference"><div class="eyebrow">Resource</div><h2>Quick reference</h2><p class="act-intro">The course models, as they appear on the slides. Keep them handy for your next check-in.</p>${REF.map(r=>`<div class="ref-card"><h3>${E(r.title)} <span class="muted" style="font-weight:500;font-size:12px">· Slide ${r.slide}</span></h3><table>${r.rows.map(x=>`<tr><td>${E(x[0])}</td><td>${E(x[1])}</td></tr>`).join('')}</table>${r.note?`<p>${E(r.note)}</p>`:''}</div>`).join('')}</article>`;
  $('#activity-pages').innerHTML=html;$$('#activity-pages textarea').forEach(grow);}
const pa=()=>$('#activity-pages');
function bindActivities(){
  pa().addEventListener('input',e=>{const t=e.target;if(t.dataset.answer){if(t.type==='radio'){if(t.checked)answers[t.dataset.answer]=t.value;}else answers[t.dataset.answer]=t.value;if(t.tagName==='TEXTAREA')grow(t);queueSave();}
    if(t.dataset.check){const k=t.dataset.check;answers[k]=$$(`[data-check="${k}"]`).filter(x=>x.checked).map(x=>+x.value);queueSave();}});
  pa().addEventListener('change',e=>{const t=e.target;if(t.type==='radio'&&t.checked){answers[t.dataset.answer]=t.value;queueSave();}});
  pa().addEventListener('click',async e=>{const g=e.target.closest('[data-go-slide]');if(g){e.preventDefault();goTo(+g.dataset.goSlide);return;}
    const b=e.target.closest('.copy-btn');if(!b)return;let text='',msgKey='',empty='Nothing to copy yet.';
    if(b.dataset.copy){msgKey=b.dataset.copy;text=val(msgKey).trim();}
    else if(b.dataset.combine){msgKey=b.dataset.combine;const keys=msgKey.split(','),labels=b.dataset.labels.split(',');
      const parts=keys.map((k,i)=>[labels[i],val(k).trim()]);if(parts.some(p=>!p[1])){text='';empty=`Fill in both ${labels.join(' and ')} first.`;}
      else text=parts.map(([l,v])=>new RegExp('^'+l+'\\s*[:.)-]','i').test(v)?v:`${l}: ${v}`).join('\n');}
    else if(b.dataset.frame){msgKey=b.dataset.frame;const blk=A.flatMap(a=>a.blocks).find(x=>x.key===msgKey);const vals=blk.parts.filter(p=>typeof p!=='string').map(p=>val(p.key).trim());
      if(vals.some(v=>!v)){text='';empty='Fill in all three blanks first.';}else{let i=0;text=blk.parts.map(p=>typeof p==='string'?p:vals[i++]).join('').replace(/\.\.$/,'.');}}
    const m=pa().querySelector(`[data-msg="${msgKey}"]`);
    if(!text){m.textContent=empty;return;}
    const ok=await copyText(text);m.textContent=ok?'Copied. Paste it in the meeting chat.':'Your browser blocked copying. Select the text and copy it yourself.';
    if(ok){b.dataset.label=b.dataset.label||b.textContent;b.textContent='Copied';setTimeout(()=>{b.textContent=b.dataset.label;},1800);}
    setTimeout(()=>{if(m.textContent.startsWith('Copied'))m.textContent='';},4000);});
}
async function copyText(text){try{if(!navigator.clipboard)throw 0;await navigator.clipboard.writeText(text);return true;}catch(e){const t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();let ok=false;try{ok=document.execCommand('copy');}catch(_){}t.remove();return ok;}}

/* ---------- Lightbox (same learner-safe image as the thumbnail) ---------- */
let lbId=0;
function openLightbox(id){lbId=id;const s=slides.find(x=>x.id===id);$('#lightbox-title').textContent=`Slide ${s.id}: ${s.title}`;
  $('#lightbox-stage').innerHTML=s.placeholder?`<div class="placeholder">${E(s.placeholder)}</div>`:`<img src="assets/slides/${E(s.image)}" alt="Slide ${s.id}: ${E(s.title)}">`;
  $('#lb-prev').disabled=id<=slides[0].id;$('#lb-next').disabled=id>=slides[slides.length-1].id;if(!$('#lightbox').open)$('#lightbox').showModal();}
$('#lb-prev').onclick=()=>openLightbox(lbId-1);$('#lb-next').onclick=()=>openLightbox(lbId+1);
$('#lb-close').onclick=()=>$('#lightbox').close();
$('#lightbox').addEventListener('close',()=>{const b=document.querySelector(`[data-zoom="${lbId}"]`);b&&b.focus({preventScroll:true});});
$('#lightbox').addEventListener('keydown',e=>{if(e.key==='ArrowRight'&&!$('#lb-next').disabled)openLightbox(lbId+1);if(e.key==='ArrowLeft'&&!$('#lb-prev').disabled)openLightbox(lbId-1);});
$('#lightbox').addEventListener('click',e=>{if(e.target===$('#lightbox'))$('#lightbox').close();});

/* ---------- Backup, restore, export, print ---------- */
$('#dl-backup').onclick=()=>{download(`M3_eWorkbook_backup_${stamp()}.json`,JSON.stringify({format:FORMAT,course:W.fullTitle,savedAt:new Date().toISOString(),notes,answers},null,2),'application/json');status('Backup downloaded. Keep the file to restore your work later.');};
$('#restore-btn').onclick=()=>$('#restore-file').click();
$('#restore-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const p=JSON.parse(await f.text());if(p.format!==FORMAT)throw new Error('This file isn’t an eWorkbook backup.');
    const n=(p.notes&&typeof p.notes==='object')?p.notes:{};const clean={};for(const[k,v]of Object.entries(n))if(slides.some(s=>String(s.id)===String(k))&&typeof v==='string')clean[k]=v.slice(0,50000);
    const ans=(p.answers&&typeof p.answers==='object'&&!Array.isArray(p.answers))?p.answers:{};
    if((Object.keys(notes).length||Object.keys(answers).length)&&!confirm('Replace the notes and responses in this browser with the ones in the backup?'))return;
    notes=clean;answers=ans;save();renderPages();renderActivities();renderNav();observe();status('Your backup was restored.');}
  catch(err){alert('Unable to restore: '+err.message);}};
function exportDoc(){const withNotes=slides.filter(s=>notes[s.id]);
  const act=A.map(a=>{const rows=[];a.blocks.forEach(b=>{if(b.type==='text'&&val(b.key).trim())rows.push([b.label,val(b.key)]);if(b.type==='dials'){b.dials.forEach((d,i)=>{const v=val('p1_dial'+(i+1));if(v)rows.push([d[0],v]);});}
    if(b.type==='checklist'){const st=answers[b.key]||[];if(st.length)rows.push([b.label,b.items.filter((_,i)=>st.includes(i)).join('; ')]);}
    if(b.type==='frame'){const vals=b.parts.filter(p=>typeof p!=='string').map(p=>val(p.key).trim());if(vals.some(Boolean)){let i=0;rows.push(['My commitment',b.parts.map(p=>typeof p==='string'?p:(vals[i++]||'____')).join('')]);}}});
    return rows.length?`<section><h2>Part ${a.part} · ${E(a.title)}</h2>${rows.map(r=>`<p class="m">${E(r[0])}</p><div class="note">${E(r[1])}</div>`).join('')}</section>`:'';}).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>My notes · ${E(W.fullTitle)}</title><style>body{font:11pt Aptos,'Segoe UI',Arial,sans-serif;line-height:1.55;max-width:780px;margin:36px auto;padding:0 20px;color:#203347}h1{color:#15324e;margin-bottom:2px}h2{color:#136b77;font-size:13pt;border-bottom:1px solid #d7e1e6;padding-bottom:4px;margin-top:26px}.m{color:#5d7183;font-size:9.5pt;margin:10px 0 2px}.note{white-space:pre-wrap;overflow-wrap:anywhere}@media print{body{margin:0}}</style></head><body><h1>${E(W.fullTitle)} · My notes</h1><p class="m">Exported ${E(new Date().toLocaleString())}</p>${act?`<h1 style="font-size:15pt;margin-top:24px">My activity responses</h1>${act}`:''}<h1 style="font-size:15pt;margin-top:24px">My slide notes</h1>${withNotes.length?withNotes.map(s=>`<section><h2>Slide ${s.id}: ${E(s.title)}</h2><p class="m">${E(W.modules[s.module])}</p><div class="note">${E(notes[s.id])}</div></section>`).join(''):'<p>You haven’t written any slide notes yet.</p>'}</body></html>`;}
$('#export-notes').onclick=()=>{download(`M3_My_Notes_${stamp()}.html`,exportDoc(),'text/html');status('Notes exported. Open the file to read or print it.');};
$('#print-wb').onclick=()=>window.print();
window.addEventListener('beforeprint',()=>{$$('img[loading]').forEach(i=>i.loading='eager');$$('textarea').forEach(grow);});

/* ---------- Init ---------- */
function observe(){io.disconnect();$$('.note-page').forEach(p=>io.observe(p));}
renderPages();renderActivities();bindActivities();renderNav();observe();tab('notes');
status(storageOk?(Object.keys(notes).length||Object.keys(answers).length?'Your saved work is loaded.':'Your work saves automatically in this browser.'):'This browser isn’t saving your work. Download a backup before you close the page.',!storageOk);
const h=location.hash.slice(1);if(h.startsWith('slide-'))setTimeout(()=>goTo(+h.slice(6)),200);else if(h&&document.getElementById(h)&&A.some(a=>a.id===h)||h==='quick-reference')setTimeout(()=>showActivity(h),200);
})();
