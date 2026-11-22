/* C² Instructor Hub engine · shared-state sync (same browser profile, same site origin).
   BroadcastChannel carries live updates; localStorage keeps the latest state so a display
   that missed a message, reloaded, or regained focus can recover. No network calls. */
(function(){
'use strict';
const C=window.C2Course;
const KEY=C.storageKey, IMG_KEY=KEY+'_custom3';
const bc=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(KEY):null;
const total=C.slides.length;
function initial(){return {format:'c2hub-state-v1',course:C.code,slide:1,reveal:0,mode:'slide',
  annotations:{},blankBoards:{},boards:{},
  media:{slide:0,action:'stop',seq:0,large:false},
  settings:{breakTime:'',evalLink:'',workbookUrl:'',pdfLink:'',alternatives:{}},
  custom3:0,timer:{show:false,running:false,endsAt:0,remaining:0,label:''},updated:0};}
function sanitize(raw){
  const base=initial();
  if(!raw||typeof raw!=='object'||raw.course!==C.code)return base;
  const s={...base,...raw};
  s.slide=Math.max(1,Math.min(total,Number(s.slide)||1));
  const st=slideById(s.slide).states.length;
  s.reveal=Math.max(0,Math.min(st-1,Number(s.reveal)||0));
  for(const k of ['annotations','blankBoards','boards','settings','media','timer'])if(!s[k]||typeof s[k]!=='object'||Array.isArray(s[k]))s[k]=base[k];
  s.settings={...base.settings,...s.settings};s.media={...base.media,...s.media};s.timer={...base.timer,...s.timer};
  if(!['slide','whiteboard'].includes(s.mode))s.mode='slide';
  return s;}
function read(){try{return sanitize(JSON.parse(localStorage.getItem(KEY)))}catch(e){return initial()}}
function send(s){s.updated=Date.now();try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){console.warn('Hub state could not be saved locally',e)}
  try{bc&&bc.postMessage({type:'state',state:s})}catch(e){}}
function post(msg){try{bc&&bc.postMessage(msg)}catch(e){}}
function on(handler){
  if(bc)bc.addEventListener('message',e=>handler(e.data||{}));
  window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue){try{handler({type:'state',state:JSON.parse(e.newValue)})}catch(_){}}
    if(e.key===IMG_KEY)handler({type:'custom3'});});
}
function getCustom3(){try{return localStorage.getItem(IMG_KEY)||''}catch(e){return ''}}
function setCustom3(data){if(data)localStorage.setItem(IMG_KEY,data);else localStorage.removeItem(IMG_KEY);}
function slideById(n){return C.slides.find(x=>x.id===Number(n))||C.slides[0];}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function download(name,contents,mime='application/json'){const b=new Blob([contents],{type:mime});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);}
function patch(el,html){if(el&&el.__html!==html){el.innerHTML=html;el.__html=html;}}
window.C2Hub={C,KEY,initial,read,send,post,on,sanitize,slideById,esc,download,patch,getCustom3,setCustom3};
})();
