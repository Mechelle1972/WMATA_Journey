/* C² Instructor Hub engine · participant display. Shows only what the instructor selects.
   Loads PUBLIC course data only (course.js). Never load course-private.js on this page. */
(function(){
'use strict';
const {C,read,post,on,sanitize,slideById,esc}=C2Hub;
const stage=document.getElementById('stage'),statusEl=document.getElementById('display-status'),gate=document.getElementById('media-gate');
let current=read(),lastSeq=-1,ytFrame=null,ytReady=false,ytQueue=[],ytSlide=0,audioEl=null,audioSlide=0,seenState=false;
/* ---------- media ---------- */
function mediaStatus(status,detail=''){post({type:'mediaStatus',slide:current.slide,status,detail});}
function ytCmd(func,args=[]){if(!ytFrame)return;const msg=JSON.stringify({event:'command',func,args});if(ytReady)ytFrame.contentWindow.postMessage(msg,'*');else ytQueue.push(msg);}
function ensureYouTube(s){
  const layer=stage.querySelector('.layer-media');
  if(ytFrame&&ytSlide===s.id)return;
  removeYouTube();
  const m=s.media,b=m.box;
  const wrap=document.createElement('div');wrap.className='yt-wrap';wrap.style.cssText=`left:${b.x}%;top:${b.y}%;width:${b.w}%;height:${b.h}%`;
  const origin=location.protocol.startsWith('http')?`&origin=${encodeURIComponent(location.origin)}`:'';
  ytFrame=document.createElement('iframe');
  ytFrame.title=m.label;ytFrame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';ytFrame.referrerPolicy='strict-origin-when-cross-origin';
  ytFrame.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(m.id)}?enablejsapi=1&rel=0&playsinline=1&cc_load_policy=1&modestbranding=1${origin}`;
  ytFrame.addEventListener('load',()=>{ytReady=true;try{ytFrame.contentWindow.postMessage(JSON.stringify({event:'listening',id:1,channel:'widget'}),'*')}catch(e){}ytQueue.splice(0).forEach(q=>ytFrame.contentWindow.postMessage(q,'*'));});
  wrap.appendChild(ytFrame);layer.appendChild(wrap);ytSlide=s.id;ytReady=false;ytQueue=[];}
function removeYouTube(){if(ytFrame){ytFrame.parentElement.remove();}ytFrame=null;ytReady=false;ytSlide=0;ytQueue=[];}
window.addEventListener('message',e=>{if(!/youtube(-nocookie)?\.com$/.test(new URL(e.origin||'http://x').hostname))return;
  let d;try{d=typeof e.data==='string'?JSON.parse(e.data):e.data}catch(_){return}
  const ps=d&&(d.event==='onStateChange'?d.info:(d.info&&d.info.playerState));
  if(typeof ps==='number'){mediaStatus({0:'ended',1:'playing',2:'paused',3:'buffering',5:'ready'}[ps]||'ready');}
  if(d&&d.event==='onError')mediaStatus('error','The video could not play here. '+((slideById(current.slide).media||{}).backup||'Use the backup described in the notes.'));});
function ensureAudio(s){if(!audioEl){audioEl=document.getElementById('audio-player');
    audioEl.addEventListener('playing',()=>mediaStatus('playing'));audioEl.addEventListener('pause',()=>{if(!audioEl.ended)mediaStatus('paused')});audioEl.addEventListener('ended',()=>mediaStatus('ended'));
    audioEl.addEventListener('error',()=>mediaStatus('error','The audio file could not be loaded.'));}
  if(audioSlide!==s.id){audioEl.src=s.media.src;audioEl.load();audioSlide=s.id;}}
/* Embedded video file (kind:'video'): plays inside the slide's video box, offline. */
let videoEl=null,videoSlide=0;
function ensureVideo(s){const layer=stage.querySelector('.layer-media');
  if(videoEl&&videoSlide===s.id&&layer.contains(videoEl))return;
  removeVideo();const m=s.media,b=m.box||{x:0,y:0,w:100,h:100};
  const wrap=document.createElement('div');wrap.className='yt-wrap vid-wrap';wrap.style.cssText=`left:${b.x}%;top:${b.y}%;width:${b.w}%;height:${b.h}%`;
  videoEl=document.createElement('video');videoEl.preload='auto';videoEl.playsInline=true;videoEl.setAttribute('aria-label',m.label||'Video');
  if(m.poster)videoEl.poster=m.poster;videoEl.src=m.src;
  if(m.captions){const tr=document.createElement('track');tr.kind='captions';tr.src=m.captions;tr.srclang=m.captionsLang||'en';tr.label='Captions';tr.default=true;videoEl.appendChild(tr);}
  const v=videoEl;const live=()=>v===videoEl;   // ignore events from a video that was already removed
  v.addEventListener('playing',()=>{if(live())mediaStatus('playing')});v.addEventListener('pause',()=>{if(live()&&!v.ended)mediaStatus('paused')});
  v.addEventListener('ended',()=>{if(live())mediaStatus('ended')});v.addEventListener('error',()=>{if(live())mediaStatus('error','The video file could not be loaded.')});
  wrap.appendChild(videoEl);layer.appendChild(wrap);videoSlide=s.id;}
function removeVideo(){if(videoEl){videoEl.pause();videoEl.parentElement&&videoEl.parentElement.remove();}videoEl=null;videoSlide=0;}
function stopAudio(){if(audioEl&&audioSlide){audioEl.pause();try{audioEl.currentTime=0}catch(e){}}}
function tryPlay(p){if(p&&p.catch)p.then(()=>{gate.hidden=true}).catch(()=>{gate.hidden=false;mediaStatus('blocked','The browser blocked playback. Select “Play” in the participant display.');});}
function applyMedia(state){
  const s=slideById(state.slide),m=s.media,wrap=stage.querySelector('.yt-wrap');
  if(!m){removeYouTube();removeVideo();stopAudio();gate.hidden=true;return;}
  if(m.kind==='youtube'){removeVideo();ensureYouTube(s);stopAudio();}
  if(m.kind==='audio'){removeYouTube();removeVideo();ensureAudio(s);}
  if(m.kind==='video'){removeYouTube();stopAudio();ensureVideo(s);}
  const w=stage.querySelector('.yt-wrap');if(w){w.classList.toggle('large',!!state.media.large);}
  if(state.media.seq===lastSeq)return;lastSeq=state.media.seq;
  if(state.media.slide!==s.id)return;
  const a=state.media.action;
  if(m.kind==='youtube'){const w2=stage.querySelector('.yt-wrap');
    if(a==='play'||a==='resume'){w2&&w2.classList.add('active');ytCmd('playVideo');}
    if(a==='pause')ytCmd('pauseVideo');
    if(a==='restart'){w2&&w2.classList.add('active');ytCmd('seekTo',[0,true]);ytCmd('playVideo');}
    if(a==='stop'){ytCmd('stopVideo');w2&&w2.classList.remove('active');gate.hidden=true;}}
  if(m.kind==='video'&&videoEl){const w3=videoEl.parentElement;
    if(a==='play'||a==='resume'){w3.classList.add('active');tryPlay(videoEl.play());}
    if(a==='pause')videoEl.pause();
    if(a==='restart'){w3.classList.add('active');videoEl.currentTime=0;tryPlay(videoEl.play());}
    if(a==='stop'){videoEl.pause();try{videoEl.currentTime=0}catch(e){}w3.classList.remove('active');gate.hidden=true;}}
  if(m.kind==='audio'){
    if(a==='play'||a==='resume')tryPlay(audioEl.play());
    if(a==='pause')audioEl.pause();
    if(a==='restart'){audioEl.currentTime=0;tryPlay(audioEl.play());}
    if(a==='stop'){stopAudio();gate.hidden=true;}}}
gate.addEventListener('click',()=>{gate.hidden=true;const s=slideById(current.slide);
  if(s.media&&s.media.kind==='audio'&&audioEl)tryPlay(audioEl.play());
  if(s.media&&s.media.kind==='video'&&videoEl){videoEl.parentElement.classList.add('active');tryPlay(videoEl.play());}
  if(s.media&&s.media.kind==='youtube')ytCmd('playVideo');});
/* ---------- render ---------- */
function preload(state){const s=slideById(state.slide),next=slideById(Math.min(C.slides.length,state.slide+1));
  [...s.states,...next.states].forEach(x=>{const i=new Image();i.src=x.img;});}
function render(state){
  current=state;C2Stage.paint(stage,state);applyMedia(state);
  const s=slideById(state.slide);
  statusEl.textContent=`Slide ${s.id} of ${C.slides.length} · Synchronized with instructor console`;
  document.title=`${C.name} · Participant display`;preload(state);}
function accept(raw){const s=sanitize(raw);if(s.updated>=current.updated){seenState=true;render(s);}}
on(msg=>{if(msg.type==='state')accept(msg.state);if(msg.type==='custom3')render(current);});
setInterval(()=>{const s=read();if(s.updated>current.updated)accept(s);if(current.timer&&current.timer.show)C2Hub.patch(stage.querySelector('.layer-timer'),C2Stage.layers(current).timer);},500);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)accept(read());});
window.addEventListener('focus',()=>accept(read()));
/* Presenter remotes and keyboards often send keys to whichever window has focus. Forward them. */
document.addEventListener('keydown',e=>{const k=e.key;
  if(['ArrowRight','PageDown',' ','Enter','ArrowDown'].includes(k)){e.preventDefault();post({type:'command',cmd:'advance'});}
  if(['ArrowLeft','PageUp','ArrowUp','Backspace'].includes(k)){e.preventDefault();post({type:'command',cmd:'back'});}});
const fsBtn=document.getElementById('display-fullscreen');
fsBtn.addEventListener('click',()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.().catch(()=>{});else document.exitFullscreen?.();});
document.addEventListener('fullscreenchange',()=>{fsBtn.textContent=document.fullscreenElement?'Exit full screen':'Enter full screen';});
document.getElementById('media-ready').addEventListener('click',e=>{e.currentTarget.textContent='Sound and video enabled';e.currentTarget.disabled=true;
  try{const ctx=new (window.AudioContext||window.webkitAudioContext)();ctx.resume().then(()=>ctx.close());}catch(_){}});
render(current);post({type:'request'});
setInterval(()=>post({type:'displayAlive'}),3000);post({type:'displayAlive'});
setTimeout(()=>{if(!seenState&&!current.updated)statusEl.textContent='Waiting for the instructor console. Open this window from the console’s “Open participant display” button.';},1500);
})();
