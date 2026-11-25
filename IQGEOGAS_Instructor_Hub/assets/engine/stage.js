/* Instructor Hub engine · slide stage. Builds the shared slide view from PUBLIC course data
   and the instructor-sent state. Used by both the private preview and the participant display.
   It never reads speaker notes. */
(function(){
'use strict';
const {esc,slideById,getCustom3}=HubCore;
function fmt(sec){sec=Math.max(0,Math.round(sec));const m=Math.floor(sec/60),s=sec%60;return `${m}:${String(s).padStart(2,'0')}`;}
function timerSeconds(t){if(!t)return 0;return t.running?Math.max(0,(t.endsAt-Date.now())/1000):Math.max(0,t.remaining||0);}
let customCache={v:-1,data:''};
function custom3(state){if(!state.custom3)return '';if(customCache.v!==state.custom3){customCache={v:state.custom3,data:getCustom3()};}return customCache.data;}
function layers(state){
  const s=slideById(state.slide);const st=s.states[Math.min(state.reveal,s.states.length-1)];
  let src=st.img,alt=`Slide ${s.id}: ${st.alt}`;
  const out={base:'',overlay:'',board:'',ink:'',timer:''};
  if(s.customizable==='png'){const c=custom3(state);if(c){src=c;alt=`Slide ${s.id}: instructor introduction (custom image)`;}}
  if(s.breakTime&&state.settings.breakTime){src=s.breakTime.blank;
    const b=s.breakTime;out.overlay=`<div class="break-time" style="left:${b.x}%;top:${b.y}%;width:${b.w}%;font-size:${b.fontPct}cqh;color:${b.color}">${esc(state.settings.breakTime)}</div>`;
    alt=alt.replace('[TIME]',state.settings.breakTime);}
  out.base=`<img class="stage-img" src="${esc(src)}" alt="${esc(alt)}" draggable="false">`;
  const blank=!!(state.blankBoards||{})[s.id];
  if(blank)out.board=`<div class="blank-board" aria-label="Blank whiteboard"><span>Whiteboard</span></div>`;
  else if(state.mode==='whiteboard'&&s.whiteboard){
    const items=(state.boards||{})[s.id]||[];
    out.board=`<section class="wb-board" aria-label="Shared whiteboard"><h2>${esc(s.title)}</h2><div class="wb-cards">${items.length?items.map(i=>`<div class="wb-card">${esc(i.text)}</div>`).join(''):'<p class="wb-empty">Responses will appear here.</p>'}</div></section>`;}
  out.ink=HubInk.overlay(state,s.id);
  if(state.timer&&state.timer.show){const sec=timerSeconds(state.timer);out.timer=`<div class="stage-timer ${sec<=0?'done':''}" role="timer" aria-label="Activity timer">${state.timer.label?`<span>${esc(state.timer.label)}</span>`:''}<b data-timer-readout>${fmt(sec)}</b></div>`;}
  return out;}
function skeleton(){return `<div class="stage-layer layer-base"></div><div class="stage-layer layer-overlay"></div><div class="stage-layer layer-media"></div><div class="stage-layer layer-board"></div><div class="stage-layer layer-ink"></div><div class="stage-layer layer-timer"></div>`;}
function paint(stage,state){
  if(!stage.querySelector('.layer-base'))stage.innerHTML=skeleton();
  const l=layers(state);
  for(const k of ['base','overlay','board','ink','timer'])HubCore.patch(stage.querySelector('.layer-'+k),l[k]);
  stage.dataset.slide=state.slide;}
window.HubStage={layers,paint,fmt,timerSeconds};
})();
