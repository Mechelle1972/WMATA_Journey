/* C² annotation engine (from the Instructor Hub reference v1.1). Browser-local; no dependencies.
   Marks are stored per slide in a 1000 × 562.5 coordinate space so they scale with the slide. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const W=1000,H=562.5;
function item(o){
  const color=/^#[0-9a-fA-F]{6}$/.test(o.color||'')?o.color:'#e97624';
  const x=Number(o.x)||0,y=Number(o.y)||0,dx=Number(o.x2)||x,dy=Number(o.y2)||y;
  if(o.kind==='pen'||o.kind==='highlight'){
    const pts=(o.points||[]).slice(0,2000).map(p=>[Number(p[0])||0,Number(p[1])||0]);if(!pts.length)return '';
    const d=pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${o.kind==='highlight'?22:4}" opacity="${o.kind==='highlight'?.32:1}" stroke-linecap="round" stroke-linejoin="round"/>`;}
  if(o.kind==='line')return `<line x1="${x}" y1="${y}" x2="${dx}" y2="${dy}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
  if(o.kind==='rect')return `<rect x="${Math.min(x,dx)}" y="${Math.min(y,dy)}" width="${Math.abs(dx-x)}" height="${Math.abs(dy-y)}" fill="none" stroke="${color}" stroke-width="4" rx="7"/>`;
  if(o.kind==='circle')return `<ellipse cx="${(x+dx)/2}" cy="${(y+dy)/2}" rx="${Math.abs(dx-x)/2}" ry="${Math.abs(dy-y)/2}" fill="none" stroke="${color}" stroke-width="4"/>`;
  if(o.kind==='text')return `<text x="${x}" y="${y}" fill="${color}" font-size="26" font-weight="650" font-family="Arial,sans-serif">${esc(String(o.text||'').slice(0,160))}</text>`;
  return '';}
function overlay(state,id){const arr=(state.annotations||{})[id]||[];
  return `<svg class="c2-ink-layer" data-ink-layer="${Number(id)||1}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><g>${arr.map(item).join('')}</g></svg>`;}
function svgDocument(arr,background='#ffffff'){return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${background}"/>${arr.map(item).join('')}</svg>`;}
window.C2Ink={overlay,item,svgDocument,W,H};
})();
