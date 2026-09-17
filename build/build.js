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
replaceOnce("  $('#sheet').classList.add('open');\n}\nfunction closeSheet(){ $('#sheet').classList.remove('open'); }",
  "  $('#sheet').classList.remove('wide');\n  $('#sheet').classList.add('open');\n}\nfunction closeSheet(){ $('#sheet').classList.remove('open','wide'); }");

replaceOnce(',[data-wtanattoggle]\');', ',[data-wtanattoggle],[data-plate]\');');
replaceOnce("  if(t.dataset.wtanattoggle!==undefined){",
  "  if(t.dataset.plate){ openPlate(t.dataset.plate); return; }\n  if(t.dataset.wtanattoggle!==undefined){");

fs.writeFileSync(path.join(APP, 'surgical-pa-pathways.html'), s);
console.log('bytes', Buffer.byteLength(s), 'images', Object.keys(src).length);
