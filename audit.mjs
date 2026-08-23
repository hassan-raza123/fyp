import { chromium } from '@playwright/test';
const PAGES = {
  admin: ['/admin','/admin/programs','/admin/courses','/admin/students','/admin/clo-plo-mappings',
          '/admin/results/plo-attainments','/admin/reports','/admin/action-plans','/admin/settings',
          '/admin/rubrics','/admin/assessments','/admin/sections'],
  faculty: ['/faculty','/faculty/courses','/faculty/results/marks-entry','/faculty/rubrics','/faculty/analytics'],
  student: ['/student','/student/results','/student/transcript','/student/analytics','/student/courses'],
};
const AUDIT = () => {
  const srgb=c=>{c/=255;return c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4};
  const lum=([r,g,b])=>.2126*srgb(r)+.7152*srgb(g)+.0722*srgb(b);
  const px=s=>(s.match(/[\d.]+/g)||[]).map(Number);
  const solid=el=>{let n=el;while(n&&n!==document.documentElement){const cs=getComputedStyle(n);
    if(cs.backgroundImage&&cs.backgroundImage!=='none')return null;
    const c=px(cs.backgroundColor); if(c.length>=3&&(c[3]===undefined||c[3]>0.95))return c.slice(0,3); n=n.parentElement}
    return [255,255,255]};
  const o=[];
  document.querySelectorAll('h1,h2,h3,h4,p,span,a,button,td,th,li,label,div').forEach(el=>{
    const t=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join('');
    if(t.length<2)return;
    const cs=getComputedStyle(el);
    if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity<0.15)return;
    const r=el.getBoundingClientRect(); if(!r.width||!r.height)return;
    const bg=solid(el); if(!bg)return;
    const fg=px(cs.color), a=fg[3]??1, eff=[0,1,2].map(i=>Math.round(fg[i]*a+bg[i]*(1-a)));
    const L1=lum(eff),L2=lum(bg);
    const ratio=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
    const size=parseFloat(cs.fontSize);
    const large=size>=24||(size>=18.66&&+cs.fontWeight>=700);
    if(ratio<(large?3:4.5)) o.push(`contrast ${ratio.toFixed(2)} "${t.slice(0,20)}"`);
  });
  document.querySelectorAll('input,textarea,select').forEach(el=>{
    if(el.type==='hidden')return;
    const l=el.id&&document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if(!l&&!el.closest('label')&&!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby')) o.push('unlabelled field');
  });
  document.querySelectorAll('a,button').forEach(el=>{
    if(el.closest('nextjs-portal'))return;
    if(!(el.innerText||'').trim()&&!el.getAttribute('aria-label')&&!el.getAttribute('title')) o.push('unnamed control');
  });
  const hs=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(x=>+x.tagName[1]);
  const n1=hs.filter(x=>x===1).length; if(n1!==1) o.push(`h1 count=${n1}`);
  if(document.documentElement.scrollWidth>window.innerWidth+2) o.push('HORIZONTAL SCROLL');
  return o;
};
const b = await chromium.launch();
for (const scheme of ['light','dark']) {
  const totals={}; let clean=0, tot=0;
  for (const [role,urls] of Object.entries(PAGES)) {
    const ctx = await b.newContext({ storageState:`e2e/.auth/${role}.json`, viewport:{width:1440,height:900}, colorScheme:scheme });
    const p = await ctx.newPage();
    for (const u of urls) {
      tot++;
      await p.goto('http://127.0.0.1:3100'+u,{waitUntil:'networkidle',timeout:45000});
      await p.waitForTimeout(1200);
      if (new URL(p.url()).pathname !== u) { console.log(`  REDIRECT ${u}`); continue; }
      const f = await p.evaluate(AUDIT);
      if(!f.length) clean++;
      f.forEach(x=>{const k=x.startsWith('contrast')?'low contrast':x; totals[k]=(totals[k]||0)+1});
    }
    await ctx.close();
  }
  console.log(`\n${scheme.toUpperCase()}  ${clean}/${tot} dashboard pages fully clean`);
  Object.entries(totals).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`   ${k}: ${v}`));
  if(!Object.keys(totals).length) console.log('   no findings');
}
await b.close();
