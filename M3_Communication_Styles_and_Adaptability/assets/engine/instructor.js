/* C² Instructor Hub engine · private instructor console.
   Requires: course.js (public), course-private.js (instructor-only notes), sync.js, annotation.js, stage.js. */
(function(){
'use strict';
const {C,read,send,post,on,slideById,esc:E,download,patch,setCustom3,initial}=C2Hub;
const P=window.C2Private||{};
const $=s=>document.querySelector(s);
const CONSOLE_KEY=C2Hub.KEY+'_console';
let state=read();
let priv=(()=>{try{return {sessionStart:0,sessionAccum:0,running:false,slideEnteredAt:Date.now(),notesScale:1,compact:false,rail:true,...JSON.parse(localStorage.getItem(CONSOLE_KEY)||'{}')}}catch(e){return {sessionStart:0,sessionAccum:0,running:false,slideEnteredAt:Date.now(),notesScale:1,compact:false,rail:true}}})();
const savePriv=()=>{try{localStorage.setItem(CONSOLE_KEY,JSON.stringify(priv))}catch(e){}};
let popup=null,displayAlive=0,mediaInfo={slide:0,status:'',detail:''},autoTimer=null;
const total=C.slides.length;
const planStart={};{let acc=0;for(const s of C.slides){planStart[s.id]=acc;if(!s.preSession&&!s.alternativeTo)acc+=s.minutes;}}
if(C.slides.some(s=>s.alternativeTo))for(const s of C.slides)if(s.alternativeTo)planStart[s.id]=planStart[s.alternativeTo];
const courseMinutes=C.slides.filter(s=>!s.preSession&&!s.alternativeTo).reduce((a,s)=>a+s.minutes,0);
/* ---------- helpers ---------- */
function commit(updates){state={...state,...updates};send(state);render();}
function isAutoPhase(s,r){return !!(s.states[r]&&s.states[r].auto);}
function hms(ms){const t=Math.max(0,Math.floor(ms/1000)),h=Math.floor(t/3600),m=Math.floor(t%3600/60),sec=t%60;return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;}
function mmss(ms){const t=Math.max(0,Math.floor(ms/1000));return `${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;}
function hm(min){return `${Math.floor(min/60)}:${String(min%60).padStart(2,'0')}`;}
function say(msg){const el=$('#live-status');el.textContent='';setTimeout(()=>el.textContent=msg,30);}
async function copyText(text,btn){
  let ok=false;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);ok=true;}}catch(e){}
  if(!ok){const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:-9999px';document.body.append(ta);ta.select();try{ok=document.execCommand('copy')}catch(e){}ta.remove();}
  if(btn){const old=btn.dataset.label||btn.textContent;btn.dataset.label=old;btn.textContent=ok?'Copied':'Select and copy manually';setTimeout(()=>btn.textContent=old,1600);}
  say(ok?'Copied to clipboard.':'The browser blocked copying. Select the text and copy it manually.');return ok;}
function fillPlaceholders(t){const st=state.settings;
  const put=(re,v)=>{t=t.replace(new RegExp(re.source+'(\\.?)','gi'),(m,dot)=>v+(dot&&/\.$/.test(v)?'':dot));};
  if(st.breakTime)put(/\[return time\]/,st.breakTime);
  if(st.evalLink)put(/\[evaluation link\]/,st.evalLink);
  if(st.workbookUrl)put(/\[eWorkbook link\]/,st.workbookUrl);
  if(st.pdfLink)put(/\[PDF link\]/,st.pdfLink);
  return t;}
/* which link placeholders a slide's notes use (so the matching setting field appears there) */
function notesText(id){const p=P[id];return p?p.sections.map(x=>x.items.map(i=>(i.t||'')+' '+(i.paste||'')).join(' ')).join(' '):'';}
const courseUsesPdf=C.slides.some(x=>/\[PDF link\]/i.test(notesText(x.id)));
const uses=(s,re)=>re.test(notesText(s.id));
/* ---------- running order: optional alternative slides (alternativeTo) ---------- */
function altOn(id){return !!((state.settings.alternatives||{})[id]);}
function inUse(s){if(s.alternativeTo)return altOn(s.id);const alt=C.slides.find(x=>x.alternativeTo===s.id);return alt?!altOn(alt.id):true;}
function nextId(id){for(let n=id+1;n<=total;n++)if(inUse(slideById(n)))return n;return 0;}
function prevId(id){for(let n=id-1;n>=1;n--)if(inUse(slideById(n)))return n;return 0;}
/* ---------- navigation ---------- */
function stopAuto(){if(autoTimer){clearTimeout(autoTimer);autoTimer=null;}}
function runAuto(){stopAuto();const s=slideById(state.slide);
  if(state.reveal+1<s.states.length&&s.states[state.reveal+1].auto){autoTimer=setTimeout(()=>{if(state.slide!==s.id)return;commit({reveal:state.reveal+1});runAuto();},state.reveal===0?700:900);}}
function go(n,reveal=0){
  n=Math.max(1,Math.min(total,n));stopAuto();
  if(state.slide===2&&n===3&&!priv.running&&!priv.sessionAccum){priv.running=true;priv.sessionStart=Date.now();}
  const s=slideById(n);
  const media={...state.media,slide:state.slide,action:'stop',seq:state.media.seq+1,large:false};
  priv.slideEnteredAt=Date.now();savePriv();
  commit({slide:n,reveal:Math.max(0,Math.min(s.states.length-1,reveal)),mode:'slide',media});
  if(reveal===0)runAuto();
  const btn=document.querySelector(`#slide-nav [data-slide="${n}"]`);btn&&btn.scrollIntoView({block:'nearest'});
}
function nextReveal(){const s=slideById(state.slide);if(state.reveal>=s.states.length-1)return false;stopAuto();
  if(s.states[state.reveal+1].auto){commit({reveal:s.states.length-1});return true;}
  commit({reveal:state.reveal+1});return true;}
function prevReveal(){const s=slideById(state.slide);if(state.reveal<=0)return false;stopAuto();
  let r=state.reveal-1;while(r>0&&s.states[r].auto)r--;commit({reveal:r});return true;}
function mediaStarted(s){return state.media.slide===s.id&&['play','resume','restart'].includes(state.media.action);}
function advance(){const s=slideById(state.slide);
  if(s.media&&s.media.clickToPlay&&!mediaStarted(s)){media('play');return;}
  if(nextReveal())return;const n=nextId(state.slide);if(n)go(n);}
function back(){const s=slideById(state.slide);
  if(state.reveal>0&&!isAutoPhase(s,state.reveal)){prevReveal();return;}
  const pid=prevId(state.slide);if(pid){const p=slideById(pid);go(p.id,p.states.length-1);}}
function media(action){const s=slideById(state.slide);if(!s.media)return;
  commit({media:{...state.media,slide:s.id,action,seq:state.media.seq+1}});
  if(!displayAliveNow())say('Open the participant display first. Media plays in that window.');}
function displayAliveNow(){return (popup&&!popup.closed)||Date.now()-displayAlive<8000;}
/* ---------- rendering ---------- */
function badges(s){const b=[];const clicks=s.states.filter((x,i)=>i>0&&!x.auto).length;
  if(clicks)b.push(`<span class="badge" title="Click reveals">${clicks} reveal${clicks>1?'s':''}</span>`);
  if(s.states.some(x=>x.auto))b.push('<span class="badge" title="Builds automatically">Auto build</span>');
  if(s.media)b.push(`<span class="badge media" title="${E(s.media.label)}">${s.media.kind==='audio'?'Audio':'Video'}</span>`);
  if(s.whiteboard)b.push('<span class="badge" title="Optional shared whiteboard">Board</span>');
  if(s.customizable)b.push('<span class="badge custom" title="Instructor can replace this slide">Custom</span>');
  if(s.breakTime)b.push('<span class="badge custom" title="Enter the return time">Time</span>');
  if(s.timer)b.push(`<span class="badge" title="Timed activity: ${s.timer} minutes">${s.timer}-min timer</span>`);
  if(s.alternativeTo||C.slides.some(x=>x.alternativeTo===s.id))b.push(`<span class="badge alt" title="${inUse(s)?'In today’s running order':'Not in today’s running order'}">${s.alternativeTo?'Alternative':'Has alternative'}</span>`);
  if(s.workbook)b.push(`<span class="badge wb" title="Matching participant eWorkbook activity: ${E(s.workbook.title)}">eWorkbook *</span>`);
  if(window.C2MyNotes&&C2MyNotes.has(s.id))b.push('<span class="badge mine" title="You have a private note on this slide">My note</span>');
  return b.join('');}
function renderNav(){const q=$('#search').value.trim().toLowerCase();let prev=-1,html='';
  for(const s of C.slides){if(q&&!`${s.id} ${s.title} ${C.modules[s.module]}`.toLowerCase().includes(q))continue;
    if(s.module!==prev){html+=`<div class="rail-group">${E(C.modules[s.module])}</div>`;prev=s.module;}
    html+=`<button type="button" class="railnav ${s.id===state.slide?'active':''} ${inUse(s)?'':'skipped'}" data-slide="${s.id}" ${s.id===state.slide?'aria-current="true"':''}><span class="rn-num">${String(s.id).padStart(2,'0')}</span><span class="rn-title">${E(s.title)}</span><span class="rn-meta">${s.minutes} min ${badges(s)}</span></button>`;}
  patch($('#slide-nav'),html||'<p class="tiny muted">No matching slides.</p>');}
function noteItem(it){
  if(it.paste!==undefined){const t=fillPlaceholders(it.paste);const open=/\[[^\]]+\]/.test(t);return `<div class="paste"><p class="paste-text">${E(t).replace(/\[[^\]]+\]/g,m=>`<mark class="ph">${m}</mark>`)}</p>${open?'<p class="tiny warn-text">Replace the highlighted placeholders before you post.</p>':''}<button type="button" class="small accent" data-copy="${E(t)}" aria-label="Copy chat text: ${E(t.slice(0,60))}">Copy for chat</button></div>`;}
  if(it.tag){const cls=it.tag.replace(/[^A-Z]/g,'').toLowerCase();return `<p class="ni"><span class="tag tag-${cls}">${E(it.tag)}</span> ${E(it.t)}</p>`;}
  return `<p class="ni">${E(it.t)}</p>`;}
function renderNotes(s){const p=P[s.id]||{sections:[]};
  const html=p.sections.map(sec=>`<section class="nsec ${/^slide time$/i.test(sec.h)?'nsec-time':''}">${sec.h?`<h3>${E(sec.h)}</h3>`:''}${sec.items.map(noteItem).join('')}</section>`).join('');
  patch($('#notes-body'),html||'<p class="muted">No speaker notes for this slide.</p>');
  $('#notes-title').textContent=`${s.id}. ${s.title}`;
  const nxId=nextId(s.id),nx=nxId?slideById(nxId):null;
  patch($('#up-next'),nx?`<button type="button" class="upnext" data-slide="${nx.id}"><img src="${E(nx.states[0].img)}" alt=""><span><span class="eyebrow">Up next</span><br>${nx.id}. ${E(nx.title)} · ${nx.minutes} min</span></button>`:'<p class="tiny muted">Last slide.</p>');}
function mediaPanel(s){const m=s.media;const st=mediaInfo.slide===s.id?mediaInfo:{status:'',detail:''};
  const btns=['play','pause','resume','restart','stop'].map(a=>`<button type="button" class="${a==='play'?'primary':''}" data-media="${a}">${a[0].toUpperCase()+a.slice(1)}</button>`).join('');
  return `<div class="panel-block"><h3>${E(m.label)}</h3><p class="tiny muted">Plays in the participant display. In Teams or your meeting platform, turn on <b>Include sound</b> when you share the window.${m.clickToPlay?' The Advance key starts this video, as a click does in PowerPoint.':''}</p>
  <div class="button-row">${btns}${m.kind==='youtube'?`<button type="button" data-media-large aria-pressed="${!!state.media.large}">${state.media.large?'Return to slide size':'Enlarge video'}</button>`:''}</div>
  <p class="media-status ${st.status==='blocked'||st.status==='error'?'warn-text':''}" aria-live="polite">${st.status?`Display: ${E(st.status)}${st.detail?' · '+E(st.detail):''}`:'Display: not started'}</p>
  ${m.kind==='youtube'?`<p class="tiny">Online video. Needs internet access to YouTube on the presenting computer.${m.backup?' Backup: '+E(m.backup):''} <a href="https://www.youtube.com/watch?v=${E(m.id)}" target="_blank" rel="noopener">Open on YouTube</a></p>`:''}
  ${m.kind==='video'?`<p class="tiny">Embedded video file. Plays offline from the hub package.${m.backup?' Backup: '+E(m.backup):''}</p>`:''}
  ${m.transcript?`<p class="tiny"><b>Transcript:</b> ${E(m.transcript)}</p>`:''}</div>`;}
function boardPanel(s){const items=(state.boards||{})[s.id]||[];const on=state.mode==='whiteboard';
  return `<div class="panel-block"><h3>Optional shared whiteboard</h3><p class="tiny muted">The notes allow chat or a shared whiteboard here. Type responses from chat or the mic; they appear on the participant display when the board is showing.</p>
  <div class="button-row"><button type="button" class="${on?'':'primary'}" data-mode="${on?'slide':'whiteboard'}">${on?'Show the slide':'Show the whiteboard'}</button><button type="button" data-board-export>Download responses</button><button type="button" class="warn" data-board-clear>Clear board</button></div>
  <form class="board-add" data-board-add><label for="board-new" class="sr-only">New response</label><input id="board-new" maxlength="140" placeholder="Type a response, then press Enter" autocomplete="off"><button type="submit" class="accent">Add</button></form>
  <ol class="board-list">${items.map((it,i)=>`<li><input aria-label="Edit response ${i+1}" data-board-edit="${i}" value="${E(it.text)}" maxlength="140"><button type="button" class="small" data-board-move="${i}" data-dir="-1" aria-label="Move response ${i+1} up" ${i===0?'disabled':''}>↑</button><button type="button" class="small" data-board-move="${i}" data-dir="1" aria-label="Move response ${i+1} down" ${i===items.length-1?'disabled':''}>↓</button><button type="button" class="small warn" data-board-remove="${i}" aria-label="Remove response ${i+1}">Remove</button></li>`).join('')}</ol></div>`;}
function slideTools(s){const out=[];
  const clicks=s.states.length-1;
  if(clicks>0){const auto=s.states.some(x=>x.auto);
    out.push(`<div class="panel-block"><h3>${auto?'Automatic build':'Click reveals'}</h3><p class="tiny muted">${auto?'This diagram builds by itself when the slide opens, as in PowerPoint.':`Matches the PowerPoint click sequence. Answers stay hidden until you reveal them.`}</p>${auto?'<button type="button" data-replay>Replay build</button>':''}</div>`);}
  const altSlide=s.alternativeTo?s:C.slides.find(x=>x.alternativeTo===s.id);
  if(altSlide){const main=slideById(altSlide.alternativeTo);
    out.push(`<div class="panel-block"><h3>Running order</h3><p class="tiny muted">Slides ${main.id} and ${altSlide.id} are alternatives. Advance skips the one you don’t use.${altSlide.alternativeNote?' '+E(altSlide.alternativeNote):''}</p><label class="check"><input type="checkbox" data-alternative="${altSlide.id}" ${altOn(altSlide.id)?'checked':''}> Use slide ${altSlide.id} (${E(altSlide.alternativeLabel||altSlide.title)}) instead of slide ${main.id}</label><p class="tiny ${inUse(s)?'muted':'warn-text'}" style="margin-top:6px">${inUse(s)?'This slide is in today’s running order.':'This slide is not in today’s running order.'}</p></div>`);}
  if(s.timer)out.push(`<div class="panel-block"><h3>Timed activity</h3><p class="tiny muted">The notes call for a ${s.timer}-minute timer.</p><button type="button" class="accent" data-activity-timer>Start ${s.timer}-minute timer on the display</button></div>`);
  if(s.workbook)out.push(`<div class="panel-block"><h3>eWorkbook activity *</h3><p class="tiny muted">Participants complete <b>${E(s.workbook.title)}</b> in their own eWorkbook. Their answers stay on their devices and aren’t sent to you.</p><button type="button" data-open-wb>Open participant eWorkbook</button></div>`);
  if(s.media)out.push(mediaPanel(s));
  if(s.whiteboard)out.push(boardPanel(s));
  if(s.customizable==='png')out.push(`<div class="panel-block"><h3>Instructor introduction slide</h3><p class="tiny muted">Upload your customized slide ${s.id} as a PNG (export it from PowerPoint). It replaces this slide in your preview and the participant display. The course sequence doesn’t change.</p><div class="field"><label for="custom-png">Replacement PNG (up to 3 MB)</label><input type="file" id="custom-png" accept="image/png"></div><button type="button" data-custom-reset ${state.custom3?'':'disabled'}>Restore the original slide</button><p class="tiny">${state.custom3?'Using your uploaded image.':'Showing the original template slide.'}</p></div>`);
  if(s.breakTime)out.push(`<div class="panel-block"><h3>Break return time</h3><p class="tiny muted">Replaces [TIME] on the slide. Example: 11:15 a.m.</p><div class="field"><label for="break-time">Return time</label><input id="break-time" data-setting="breakTime" value="${E(state.settings.breakTime)}" maxlength="24"></div><button type="button" class="accent" data-break-timer>Start 10-minute timer on the display</button></div>`);
  if(s.id===total||uses(s,/\[evaluation link\]/i))out.push(`<div class="panel-block"><h3>Evaluation link</h3><div class="field"><label for="eval-link">Session evaluation link</label><input id="eval-link" data-setting="evalLink" value="${E(state.settings.evalLink)}" placeholder="https://"></div><p class="tiny muted">Fills in [evaluation link] in the chat text in the notes.</p></div>`);
  if(s.id===1||uses(s,/\[eWorkbook link\]/i))out.push(`<div class="panel-block"><h3>Participant eWorkbook link</h3><div class="field"><label for="wb-link">eWorkbook web address</label><input id="wb-link" data-setting="workbookUrl" value="${E(state.settings.workbookUrl)}" placeholder="https://"></div><button type="button" data-copy-workbook ${state.settings.workbookUrl?'':'disabled'}>Copy link for chat</button>${courseUsesPdf?`<div class="field" style="margin-top:10px"><label for="pdf-link">PDF backup link</label><input id="pdf-link" data-setting="pdfLink" value="${E(state.settings.pdfLink||'')}" placeholder="https://"></div><p class="tiny muted">Fills in [eWorkbook link] and [PDF link] in the chat text in the notes.</p>`:'<p class="tiny muted">Fills in [eWorkbook link] in the chat text in the notes.</p>'}</div>`);
  if(!out.length)out.push('<p class="tiny muted">No extra controls are needed for this slide.</p>');
  return out.join('');}
let lastToolsKey='',timerSlide=0;
function render(){
  const s=slideById(state.slide);
  renderNav();
  $('#cur-module').textContent=C.modules[s.module];
  $('#cur-title').textContent=`${s.id}. ${s.title}`;
  $('#rail-num').textContent=`${s.id} of ${total}`;
  $('#cur-time').textContent=s.preSession?`${s.minutes} min · before the session`:`${s.minutes} min`;
  C2Stage.paint($('#preview'),state);
  const mediaBadge=(s.media&&mediaStarted(s))?`<div class="preview-flag">${s.media.kind==='audio'?'Audio':'Video'} is playing on the participant display</div>`:'';
  patch($('#preview').querySelector('.layer-media'),mediaBadge);
  const clicks=s.states.length-1;
  $('#reveal-status').textContent=clicks?`Build ${state.reveal} of ${clicks}`:'No reveals';
  $('#prev-reveal').disabled=state.reveal<=0;$('#next-reveal').disabled=state.reveal>=clicks;
  $('#prev-slide').disabled=!prevId(s.id);$('#next-slide').disabled=!nextId(s.id);
  // Avoid wiping a field the instructor is typing in.
  const key=JSON.stringify([s.id,state.mode,state.boards[s.id],state.custom3,state.media.large,mediaInfo,state.settings.workbookUrl?1:0,state.settings.alternatives||{}]);
  if(key!==lastToolsKey){const a=document.activeElement,tools=$('#slide-tools');
    let restore=null;if(a&&tools.contains(a)&&/INPUT|TEXTAREA/.test(a.tagName)){restore={id:a.id,edit:a.dataset.boardEdit,pos:a.selectionStart};}
    patch(tools,slideTools(s));lastToolsKey=key;
    if(restore){const el=restore.id?document.getElementById(restore.id):tools.querySelector(`[data-board-edit="${restore.edit}"]`);if(el){el.focus();try{el.setSelectionRange(restore.pos,restore.pos)}catch(e){}}}}
  renderNotes(s);
  if(window.C2MyNotes)C2MyNotes.sync(s);
  $('#display-state').textContent=displayAliveNow()?'Participant display connected':'Participant display not open';
  $('#display-state').classList.toggle('ok',displayAliveNow());
  $('#blank-toggle').setAttribute('aria-pressed',String(!!state.blankBoards[s.id]));
  $('#blank-toggle').textContent=state.blankBoards[s.id]?'Return to slide':'Blank whiteboard';
  $('#timer-show').checked=!!state.timer.show;
  if(timerSlide!==s.id){timerSlide=s.id;const t=state.timer;if(!t.running&&!(t.remaining>0))$('#timer-min').value=s.timer||'';}
  document.title=`${s.id}. ${s.title} · Instructor Hub`;
}
/* ---------- clocks ---------- */
function sessionMs(){return priv.sessionAccum+(priv.running?Date.now()-priv.sessionStart:0);}
function tick(){const s=slideById(state.slide);
  const el=sessionMs();$('#session-clock').textContent=hms(el);$('#session-toggle').textContent=priv.running?'Pause':'Start';
  const slideMs=Date.now()-priv.slideEnteredAt;const over=slideMs>s.minutes*60000;
  $('#slide-clock').textContent=mmss(slideMs);$('#slide-clock').classList.toggle('over',over);
  const planned=planStart[s.id];
  let pace='';if(sessionMs()>0&&!s.preSession){const diff=Math.round(el/60000-planned);pace=diff>1?` · ${diff} min behind plan`:diff<-1?` · ${-diff} min ahead of plan`:' · on plan';}
  $('#plan-info').textContent=s.preSession?'Pre-session slide':`Planned start ${hm(planned)} of ${hm(courseMinutes)}${pace}`;
  const t=state.timer;const left=C2Stage.timerSeconds(t);$('#timer-readout').textContent=C2Stage.fmt(left);$('#timer-readout').classList.toggle('done',t.running&&left<=0);
  if(t.running&&left<=0){commit({timer:{...t,running:false,remaining:0}});say('Activity timer finished.');}
  $('#timer-start').textContent=t.running?'Pause':(t.remaining>0?'Resume':'Start');
  $('#display-state').textContent=displayAliveNow()?'Participant display connected':'Participant display not open';
  $('#display-state').classList.toggle('ok',displayAliveNow());}
setInterval(tick,500);
/* ---------- events ---------- */
document.addEventListener('click',async e=>{
  const b=e.target.closest('button,[data-slide]');if(!b)return;
  if(b.dataset.slide&&(b.closest('#slide-nav')||b.classList.contains('upnext'))){go(+b.dataset.slide);if(overlayRail()&&b.closest('#slide-nav')){priv.rail=false;savePriv();applyLayout();}return;}
  if(b.dataset.copy!==undefined){copyText(b.dataset.copy,b);return;}
  if(b.dataset.media){media(b.dataset.media);return;}
  if(b.hasAttribute('data-media-large')){commit({media:{...state.media,large:!state.media.large}});return;}
  if(b.dataset.mode){commit({mode:b.dataset.mode});return;}
  if(b.hasAttribute('data-replay')){commit({reveal:0});runAuto();return;}
  if(b.hasAttribute('data-board-export')){const s=slideById(state.slide);const items=(state.boards[s.id]||[]).map((x,i)=>`${i+1}. ${x.text}`).join('\r\n');download(`${C.code}_Slide${s.id}_Whiteboard.txt`,`${C.name}\r\nSlide ${s.id}: ${s.title}\r\n${new Date().toLocaleString()}\r\n\r\n${items||'(no responses)'}\r\n`,'text/plain');return;}
  if(b.hasAttribute('data-board-clear')){if(confirm('Clear every response on this whiteboard?')){commit({boards:{...state.boards,[state.slide]:[]}});}return;}
  if(b.dataset.boardRemove!==undefined){const a=[...(state.boards[state.slide]||[])];a.splice(+b.dataset.boardRemove,1);commit({boards:{...state.boards,[state.slide]:a}});return;}
  if(b.dataset.boardMove!==undefined){const a=[...(state.boards[state.slide]||[])],i=+b.dataset.boardMove,j=i+Number(b.dataset.dir);if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];commit({boards:{...state.boards,[state.slide]:a}});setTimeout(()=>document.querySelector(`[data-board-move="${j}"][data-dir="${b.dataset.dir}"]`)?.focus(),0);return;}
  if(b.hasAttribute('data-custom-reset')){setCustom3('');commit({custom3:0});say('Original slide restored.');return;}
  if(b.hasAttribute('data-break-timer')){setTimer(10,'Break',true);return;}
  if(b.hasAttribute('data-activity-timer')){const s=slideById(state.slide);$('#timer-min').value=s.timer;setTimer(s.timer,$('#timer-label').value.trim()||'Activity',true);return;}
  if(b.hasAttribute('data-open-wb')){$('#open-workbook').click();return;}
  if(b.hasAttribute('data-copy-workbook')){copyText(state.settings.workbookUrl,b);return;}
});
document.addEventListener('submit',e=>{if(e.target.matches('[data-board-add]')){e.preventDefault();const inp=$('#board-new');const v=inp.value.trim();if(!v)return;
  commit({boards:{...state.boards,[state.slide]:[...(state.boards[state.slide]||[]),{text:v.slice(0,140)}]}});setTimeout(()=>$('#board-new')?.focus(),0);say('Added to the whiteboard.');}});
document.addEventListener('input',e=>{const t=e.target;
  if(t.dataset.boardEdit!==undefined){const a=[...(state.boards[state.slide]||[])];a[+t.dataset.boardEdit]={text:t.value.slice(0,140)};state={...state,boards:{...state.boards,[state.slide]:a}};send(state);C2Stage.paint($('#preview'),state);}
  if(t.dataset.setting){state={...state,settings:{...state.settings,[t.dataset.setting]:t.value.trim()}};send(state);C2Stage.paint($('#preview'),state);renderNotes(slideById(state.slide));
    const cw=document.querySelector('[data-copy-workbook]');if(cw)cw.disabled=!state.settings.workbookUrl;}});
document.addEventListener('change',async e=>{const t=e.target;
  if(t.dataset.alternative){const alts={...(state.settings.alternatives||{}),[t.dataset.alternative]:t.checked};commit({settings:{...state.settings,alternatives:alts}});say(t.checked?`Slide ${t.dataset.alternative} is now in the running order.`:`Slide ${t.dataset.alternative} is out of the running order.`);return;}
  if(t.id!=='custom-png')return;const f=t.files&&t.files[0];if(!f)return;
  if(f.type!=='image/png'){alert('Please choose a PNG file.');t.value='';return;}
  if(f.size>3*1024*1024){alert('Please use a PNG smaller than 3 MB. In PowerPoint, export the slide at 1920 × 1080.');t.value='';return;}
  const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f);});
  try{setCustom3(data);commit({custom3:Date.now()});say('Your introduction slide is now showing.');}catch(err){alert('The browser could not store this image. Try a smaller PNG.');}});
$('#search').addEventListener('input',renderNav);
$('#prev-slide').onclick=()=>{const n=prevId(state.slide);if(n)go(n);};$('#next-slide').onclick=()=>{const n=nextId(state.slide);if(n)go(n);};
$('#prev-reveal').onclick=prevReveal;$('#next-reveal').onclick=nextReveal;
$('#advance').onclick=advance;$('#back').onclick=back;
$('#blank-toggle').onclick=()=>{const id=state.slide;commit({blankBoards:{...state.blankBoards,[id]:!state.blankBoards[id]}});};
$('#open-display').onclick=()=>{popup=window.open('display.html','c2hub_display_'+C.code,'popup,width=1280,height=760');
  if(!popup){alert('The browser blocked the participant display. Allow pop-ups for this site, then try again.');return;}
  send(state);say('Participant display opened. Share only that window in your meeting platform.');};
$('#open-workbook').onclick=()=>{const url=state.settings.workbookUrl||C.workbookUrl;window.open(url,'_blank','noopener');};
$('#help').onclick=()=>window.open('downloads/instructor-setup-guide.html','_blank','noopener');
$('#layout-toggle').onclick=()=>{priv.compact=!priv.compact;savePriv();applyLayout();};
function toggleRail(){priv.rail=!priv.rail;savePriv();applyLayout();if(priv.rail)setTimeout(()=>$('#search').focus({preventScroll:true}),0);}
$('#rail-toggle').onclick=toggleRail;
function overlayRail(){return priv.compact||window.innerWidth<1180;}
function applyLayout(){document.body.classList.toggle('compact',!!priv.compact);document.body.classList.toggle('rail-collapsed',!priv.rail);
  $('#layout-toggle').textContent=priv.compact?'Wide layout':'Compact layout';$('#layout-toggle').setAttribute('aria-pressed',String(!!priv.compact));
  const rt=$('#rail-toggle');rt.setAttribute('aria-expanded',String(!!priv.rail));rt.textContent=priv.rail?'«':'»';rt.setAttribute('aria-label',priv.rail?'Collapse slide menu':'Expand slide menu');rt.title=(priv.rail?'Collapse slide menu':'Expand slide menu')+' (\\)';$('#rail-body').inert=!priv.rail;
  document.documentElement.style.setProperty('--notes-scale',priv.notesScale);}
$('#notes-smaller').onclick=()=>{priv.notesScale=Math.max(.8,+(priv.notesScale-.1).toFixed(2));savePriv();applyLayout();};
$('#notes-larger').onclick=()=>{priv.notesScale=Math.min(1.6,+(priv.notesScale+.1).toFixed(2));savePriv();applyLayout();};
$('#session-toggle').onclick=()=>{if(priv.running){priv.sessionAccum+=Date.now()-priv.sessionStart;priv.running=false;}else{priv.sessionStart=Date.now();priv.running=true;}savePriv();tick();};
$('#session-reset').onclick=()=>{if(!confirm('Reset the session clock to 0:00:00?'))return;priv.sessionAccum=0;priv.running=false;savePriv();tick();};
/* activity timer (shared so the display can show it) */
function setTimer(min,label,show){const sec=Math.round(min*60);commit({timer:{show:show??state.timer.show,running:true,endsAt:Date.now()+sec*1000,remaining:sec,label:label||''}});}
$('#timer-start').onclick=()=>{const t=state.timer;
  if(t.running){commit({timer:{...t,running:false,remaining:C2Stage.timerSeconds(t)}});return;}
  if(t.remaining>0){commit({timer:{...t,running:true,endsAt:Date.now()+t.remaining*1000}});return;}
  setTimer(Number($('#timer-min').value)||slideById(state.slide).minutes,$('#timer-label').value.trim());};
$('#timer-reset').onclick=()=>commit({timer:{...state.timer,running:false,remaining:0,endsAt:0}});
$('#timer-use-slide').onclick=()=>{const s=slideById(state.slide);$('#timer-min').value=s.timer||s.minutes;};
$('#timer-show').onchange=e=>commit({timer:{...state.timer,show:e.target.checked}});
/* saved work */
$('#export-state').onclick=()=>download(`${C.code}_Instructor_Hub_Session_${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({format:'c2hub-session-v1',course:C.code,exported:new Date().toISOString(),state},null,2));
$('#import-state').onclick=()=>$('#state-file').click();
$('#state-file').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;const v=JSON.parse(await f.text());if(v.format!=='c2hub-session-v1'||v.course!==C.code)throw Error('This file is not a saved session for this course.');state=C2Hub.sanitize({...v.state,course:C.code});send(state);render();say('Saved session restored.');}catch(err){alert('Unable to open the file: '+err.message);}e.target.value='';};
$('#reset-state').onclick=()=>{if(!confirm('Clear all annotations, whiteboard responses, and timers for this course? Your settings (break time, links) stay.'))return;const keep=state.settings,c3=state.custom3;state={...initial(),settings:keep,custom3:c3,slide:state.slide};send(state);render();};
/* keyboard: behaves like a presentation clicker */
document.addEventListener('keydown',e=>{const a=document.activeElement;if(a&&(/INPUT|TEXTAREA|SELECT/.test(a.tagName)||a.isContentEditable))return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==='\\'){e.preventDefault();toggleRail();return;}
  if(['ArrowRight','PageDown'].includes(e.key)||(e.key===' '&&!(a&&a.tagName==='BUTTON'))){e.preventDefault();advance();}
  if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();back();}});
/* messages from the participant display */
on(msg=>{if(msg.type==='request')send(state);
  if(msg.type==='displayAlive'){const was=displayAliveNow();displayAlive=Date.now();if(!was)render();}
  if(msg.type==='command'){if(msg.cmd==='advance')advance();if(msg.cmd==='back')back();}
  if(msg.type==='mediaStatus'){mediaInfo={slide:msg.slide,status:msg.status,detail:msg.detail||''};if(msg.status==='blocked')say(msg.detail);render();}
  if(msg.type==='state'){const s=C2Hub.sanitize(msg.state);if(s.updated>state.updated){state=s;render();}}});
window.addEventListener('beforeunload',()=>{savePriv();});
window.addEventListener('c2-ink-change',()=>{state=read();});
window.addEventListener('c2-mynotes-change',renderNav);
if(window.innerWidth<1180)priv.rail=false;
let wasNarrow=window.innerWidth<1180;window.addEventListener('resize',()=>{const n=window.innerWidth<1180;if(n&&!wasNarrow&&priv.rail){priv.rail=false;applyLayout();}wasNarrow=n;});
applyLayout();send(state);render();tick();runAuto();
})();
