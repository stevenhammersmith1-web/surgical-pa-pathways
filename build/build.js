// Injects anatomy reference plates into surgical-pa-pathways.html (built from original.html).
const fs = require('fs');
const path = require('path');
const APP = path.join(__dirname, '..');
const { IMAGES, PLATES, DIAGRAMS } = require('./plates.js');

let s = fs.readFileSync(path.join(APP, 'original.html'), 'utf8');
const replaceOnce = (a, b) => {
  const i = s.indexOf(a);
  if (i < 0 || s.indexOf(a, i + 1) >= 0) throw new Error('anchor not unique: ' + a.slice(0, 60));
  s = s.slice(0, i) + b + s.slice(i + a.length);
};

// 1. theme tokens for the always-light "paper" behind scanned plates
replaceOnce('  --rail:280px; --stick:0px;',
  '  --paper:#FFFFFF; --paper-line:#DBE4E1; --plate-filter:none;\n  --rail:280px; --stick:0px;');
const darkTok = '  --paper:#E6E6E6; --paper-line:#3A4A47; --plate-filter:brightness(.9);\n';
let n = 0;
s = s.replace(/(\n  --shadow-lg:0 2px 6px rgba\(0,0,0,\.45\)[^\n]*\n)/g, m => (n++, m + darkTok));
if (n !== 2) throw new Error('expected 2 dark token blocks, got ' + n);

// 2. CSS
replaceOnce('.wtpulsecore{fill:var(--accent)}', `.plates{padding:4px 10px 14px;border-bottom:1px dashed var(--line)}
.plateshead{display:flex;align-items:center;gap:8px;margin:8px 0 11px;font-family:"IBM Plex Mono",monospace;
  font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--accent)}
.plateshead .n{font-weight:500;color:var(--faint);background:var(--surface-2);border-radius:99px;padding:1.5px 6px;letter-spacing:.04em}
.plateshead .hintx{margin-left:auto;font-weight:400;letter-spacing:.04em;text-transform:none;color:var(--faint)}
.plategrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,232px),1fr));gap:16px 14px}
.wtanatfig{margin:0;padding:14px 10px 12px;display:flex;flex-direction:column;gap:10px;background:var(--surface)}
.figpair{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:12px 14px;align-items:start}
.figpair .plate .plateimg{height:auto;padding:6px}
.figpair .plate .plateimg img{max-height:none;width:100%}
.wtanatfig > .pnote{max-width:78ch}
.plate{margin:0;display:flex;flex-direction:column;gap:8px;min-width:0}
.plateimg{display:grid;place-items:center;height:260px;padding:10px;background:var(--paper);
  border:1px solid var(--paper-line);border-radius:8px;cursor:zoom-in;transition:border-color .12s}
.plateimg:hover{border-color:var(--accent)}
.plateimg img,.platebig img{display:block;max-width:100%;object-fit:contain;filter:var(--plate-filter)}
.plateimg img{max-height:238px}
.platebig img{max-height:calc(min(60dvh,620px) - 28px)}
.plate figcaption{display:flex;flex-direction:column;gap:3px}
.plate figcaption b{font-size:12.5px;font-weight:600;color:var(--ink);line-height:1.35}
.pnote{font-size:12.5px;line-height:1.5;color:var(--ink-2)}
.pcredit{display:block;font-family:"IBM Plex Mono",monospace;font-size:9.5px;line-height:1.5;color:var(--faint);margin-top:2px}
.pcredit a{color:inherit;text-underline-offset:2px}
.pcredit a:hover{color:var(--accent)}
#sheet.wide .panel{width:min(880px,100%);max-height:92dvh}
.platebig{display:grid;place-items:center;height:min(60dvh,620px);padding:14px;margin-bottom:12px;
  background:var(--paper);border:1px solid var(--paper-line);border-radius:10px}
.platebig + p{margin:0 0 8px}
@media (max-width:900px){.plateimg{height:190px}.plateimg img{max-height:168px}.platebig{height:52dvh}.platebig img{max-height:calc(52dvh - 28px)}}
/* ---------- OpenEvidence hand-off ---------- */
.oe{font-family:"IBM Plex Mono",monospace;font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;
  color:var(--accent);display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border:1px solid var(--accent);
  border-radius:6px;background:none;transition:.12s;white-space:nowrap}
.oe:hover{background:var(--accent-wash)}
.chead2 .oe{margin-left:6px}
.empty .oe{margin-top:12px;text-transform:none;font-size:12px;letter-spacing:0;white-space:normal;text-align:left}
.oetoast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:90;max-width:min(440px,92vw);
  background:var(--surface);border:1px solid var(--line-2);border-radius:10px;box-shadow:var(--shadow-lg);
  padding:11px 15px;font-size:13px;line-height:1.5;color:var(--ink);display:flex;gap:10px;align-items:flex-start}
.oetoast svg{flex:none;margin-top:2px;color:var(--accent)}
.oetoast b{font-weight:600}
@media (prefers-reduced-motion:no-preference){.oetoast{animation:oerise .18s cubic-bezier(.2,.8,.3,1)}}
@keyframes oerise{from{transform:translate(-50%,10px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
.wtpulsecore{fill:var(--accent)}`);

// 3. data: images as base64 WebP, stored once and referenced by key
const src = {};
const diagramPanels = Object.values(DIAGRAMS).flatMap(g => g.panels);
for (const k of new Set([...Object.values(PLATES).flat(), ...diagramPanels].map(p => p.img))) {
  src[k] = 'data:image/webp;base64,' + fs.readFileSync(path.join(__dirname, 'images', k + '.webp')).toString('base64');
}
const meta = Object.fromEntries(Object.keys(src).map(k => [k, IMAGES[k]]));
replaceOnce('const WALKTHROUGH_TOOL = {',
`// ---------- anatomy reference plates (public domain / CC BY; see credit on each) ----------
const PLATE_META = ${JSON.stringify(meta)};
const ANAT_PLATES = ${JSON.stringify(PLATES)};
const ANAT_DIAGRAMS = ${JSON.stringify(DIAGRAMS)};
const PLATE_SRC = ${JSON.stringify(src)};

const WALKTHROUGH_TOOL = {`);

// 4. rendering
replaceOnce("      ${proc.diagramSvg?`<div class=\"wtanatdiagram\">${proc.diagramSvg}</div>`:''}\n",
  "      ${ANAT_DIAGRAMS[proc.id] ? diagramFigure(proc.id) : (proc.diagramSvg?`<div class=\"wtanatdiagram\">${proc.diagramSvg}</div>`:'')}\n      ${platesHtml(proc.id)}\n");

replaceOnce('/* ================= node detail sheet ================= */',
`/* ================= anatomy reference plates ================= */
function plateCredit(m){
  const lic = m.licenseUrl ? \`<a href="\${esc(m.licenseUrl)}" target="_blank" rel="noopener">\${esc(m.license)}</a>\` : esc(m.license);
  return \`<span class="pcredit"><a href="\${esc(m.url)}" target="_blank" rel="noopener">\${esc(m.credit)}</a> &middot; \${lic}</span>\`;
}
function platesHtml(pid){
  const list = ANAT_PLATES[pid];
  if(!list || !list.length) return '';
  return \`<div class="plates">
    <div class="plateshead"><span>Reference plates</span><span class="n">\${list.length}</span><span class="hintx">Tap to enlarge</span></div>
    <div class="plategrid">\${list.map((p,i)=>{ const m = PLATE_META[p.img]; return \`<figure class="plate">
      <button class="plateimg" data-plate="\${pid}:\${i}" aria-label="Enlarge \${esc(m.title)}"><img src="\${PLATE_SRC[p.img]}" alt="\${esc(m.title)}" decoding="async"></button>
      <figcaption><b>\${esc(m.title)}</b><span class="pnote">\${esc(p.note)}</span>\${plateCredit(m)}</figcaption>
    </figure>\`; }).join('')}</div>
  </div>\`;
}
function plateFigure(pid, key, p){
  const m = PLATE_META[p.img];
  return \`<figure class="plate">
      <button class="plateimg" data-plate="\${pid}:\${key}" aria-label="Enlarge \${esc(m.title)}"><img src="\${PLATE_SRC[p.img]}" alt="\${esc(m.title)}" decoding="async"></button>
      <figcaption><b>\${esc(m.title)}</b>\${plateCredit(m)}</figcaption>
    </figure>\`;
}
function diagramFigure(pid){
  const g = ANAT_DIAGRAMS[pid];
  return \`<div class="wtanatfig">
    <div class="figpair">\${g.panels.map((p,i)=>plateFigure(pid,'d'+i,p)).join('')}</div>
    <span class="pnote">\${esc(g.note)}</span>
  </div>\`;
}
function openPlate(ref){
  const [pid,i] = ref.split(':');
  const p = i[0]==='d' ? ((ANAT_DIAGRAMS[pid]||{}).panels||[])[+i.slice(1)] : (ANAT_PLATES[pid]||[])[+i]; if(!p) return;
  const m = PLATE_META[p.img];
  $('#sheetkind').textContent = 'Reference plate';
  $('#sheettitle').textContent = m.title;
  $('#sheetbody').innerHTML = \`<div class="platebig"><img src="\${PLATE_SRC[p.img]}" alt="\${esc(m.title)}"></div><p>\${esc(p.note)}</p>\${plateCredit(m)}\`;
  $('#sheet').classList.add('open','wide');
}

/* ================= node detail sheet ================= */`);
// 5. OpenEvidence hand-off (no public API: copy the question, open the site in a new tab)
replaceOnce('/* ================= search focus ================= */',
`/* ================= OpenEvidence hand-off ================= */
const OE_URL = 'https://www.openevidence.com/';
function oeButton(question, label){
  return \`<button class="oe" data-oe="\${esc(question)}" title="Copy this question and open OpenEvidence in a new tab">\${esc(label||'OpenEvidence')}
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg></button>\`;
}
function oeCopy(text){
  try{
    if(navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(()=>true,()=>oeCopyFallback(text));
  }catch(e){}
  return Promise.resolve(oeCopyFallback(text));
}
function oeCopyFallback(text){
  try{
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly',''); ta.style.cssText='position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove(); return ok;
  }catch(e){ return false; }
}
let oeToastTimer = null;
function oeToast(copied, question){
  document.querySelector('.oetoast')?.remove();
  const el = document.createElement('div');
  el.className = 'oetoast'; el.setAttribute('role','status');
  el.innerHTML = \`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
    <span>\${copied
      ? '<b>Question copied.</b> Paste it into OpenEvidence in the new tab.'
      : '<b>Copy it manually:</b><br>' + esc(question)}</span>\`;
  document.body.appendChild(el);
  clearTimeout(oeToastTimer);
  oeToastTimer = setTimeout(()=>el.remove(), copied ? 6000 : 15000);
}
function askOpenEvidence(question){
  window.open(OE_URL, '_blank', 'noopener');      // opened on the click, before any await
  Promise.resolve(oeCopy(question)).then(ok=>oeToast(!!ok, question));
}

/* ================= search focus ================= */`);

replaceOnce('</svg></a>\n    </div>\n    <h2>${esc(c.name)}</h2>',
  '</svg></a>\n      ${oeButton(c.name + \': current evidence-based workup and management?\')}\n    </div>\n    <h2>${esc(c.name)}</h2>');

replaceOnce('<div class="top"><span class="eyebrow">Tool</span><button class="ghost" data-wtback2list="1" style="margin-left:auto">Change procedure</button></div>',
  '<div class="top"><span class="eyebrow">Tool</span>${oeButton(proc.name + \' \\u2014 \' + s.title + \': what does current evidence recommend?\')}<button class="ghost" data-wtback2list="1" style="margin-left:auto">Change procedure</button></div>');

replaceOnce('`<div class="empty">Nothing matches &ldquo;${esc(state.q)}&rdquo;.<br>Try a drug, a finding, or a score.</div>`',
  '`<div class="empty">Nothing matches &ldquo;${esc(state.q)}&rdquo;.<br>Try a drug, a finding, or a score.' +
  '${oeButton(state.q, \'Ask OpenEvidence instead\')}</div>`');

replaceOnce("  $('#sheet').classList.add('open');\n}\nfunction closeSheet(){ $('#sheet').classList.remove('open'); }",
  "  $('#sheet').classList.remove('wide');\n  $('#sheet').classList.add('open');\n}\nfunction closeSheet(){ $('#sheet').classList.remove('open','wide'); }");

replaceOnce(',[data-wtanattoggle]\');', ',[data-wtanattoggle],[data-plate]\');');
replaceOnce("  if(t.dataset.wtanattoggle!==undefined){",
  "  if(t.dataset.plate){ openPlate(t.dataset.plate); return; }\n  if(t.dataset.wtanattoggle!==undefined){");

// click handling for the OpenEvidence buttons (after the plate handler is in place)
replaceOnce(',[data-plate]\');', ',[data-plate],[data-oe]\');');
replaceOnce("  if(t.dataset.plate){ openPlate(t.dataset.plate); return; }",
  "  if(t.dataset.oe){ askOpenEvidence(t.dataset.oe); return; }\n  if(t.dataset.plate){ openPlate(t.dataset.plate); return; }");

fs.writeFileSync(path.join(APP, 'surgical-pa-pathways.html'), s);
console.log('bytes', Buffer.byteLength(s), 'images', Object.keys(src).length);
