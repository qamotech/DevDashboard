import { readFile, writeFile, copyFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const MANIFEST_PATH = join(ROOT, "page-manifest.json");
const BASE_URL = "https://qamotech.github.io/DevDashboard/";
const START_HEAD = "<!-- N8-ENHANCEMENTS:HEAD:START -->";
const END_HEAD = "<!-- N8-ENHANCEMENTS:HEAD:END -->";
const START_BODY = "<!-- N8-ENHANCEMENTS:BODY:START -->";
const END_BODY = "<!-- N8-ENHANCEMENTS:BODY:END -->";

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const stripTags = (value) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const cleanTitle = (value) => stripTags(value)
  .replaceAll("â€”", "—")
  .replaceAll("â€“", "–")
  .replaceAll("âš¡", "⚡")
  .replaceAll("ðŸªƒ", "🪃")
  .replaceAll("ðŸ¥·ðŸ¾", "🥷🏾");

function removeBlock(text, start, end) {
  const pattern = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "g");
  return text.replace(pattern, "");
}

function removeManagedHeadTags(text) {
  const managedMeta = /<meta\b(?=[^>]*(?:name|property)=["'](?:description|keywords|author|creator|publisher|robots|referrer|theme-color|color-scheme|application-name|format-detection|n8-improvement-count|n8-feature-count|devdashboard-preview-count|og:type|og:site_name|og:locale|og:title|og:description|og:url|twitter:card|twitter:title|twitter:description)["'])[^>]*>\s*/gi;
  const managedLink = /<link\b(?=[^>]*rel=["'][^"']*(?:canonical|icon|apple-touch-icon|manifest)[^"']*["'])[^>]*>\s*/gi;
  const managedN8Assets = /<(?:link|script)\b[^>]*(?:n8-tools-transformers\.(?:css|js))[^>]*>(?:<\/script>)?\s*/gi;
  const legacyFaviconTail = /<polygon\b[^>]*\/><\/svg>">\s*/gi;
  const deadStylesheet = /<link\b[^>]*cssanimation\.css\/1\.0\.3\/cssanimation\.min\.css[^>]*>\s*/gi;
  return text.replace(legacyFaviconTail, "").replace(deadStylesheet, "").replace(managedMeta, "").replace(managedLink, "").replace(managedN8Assets, "");
}
function titleFromHtml(html, fallback) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return cleanTitle(match?.[1] || fallback);
}

function descriptionFor(page, title, html) {
  const existing = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    || html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
  if (existing?.[1]?.trim()) return cleanTitle(existing[1]).slice(0, 158);
  const descriptions = {
    "Games & Simulations": `Play ${title}, an interactive browser game from the N8 CyberDev collection.`,
    "Developer Studios": `Explore ${title}, a standalone browser-based developer studio from N8 CyberDev.`,
    "Tools & Productivity": `Use ${title}, a practical standalone browser tool from the N8 CyberDev collection.`,
    "Featured Sites": `Discover ${title}, a featured web experience designed and built by N8 CyberDev.`,
    "Experiments & Archives": `Explore ${title}, an interactive web experiment in the N8 CyberDev collection.`
  };
  return descriptions[page.category] || `Explore ${title}, a standalone interactive experience from N8 CyberDev.`;
}

function headEnhancements(page, title, description) {
  const url = `${BASE_URL}${page.file === "index.html" ? "" : encodeURI(page.file)}`;
  const keywords = [title, page.category, "N8 CyberDev", "Qamelot", "interactive web app", "standalone HTML"].join(", ");
  return `${START_HEAD}
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${escapeHtml(keywords)}">
  <meta name="author" content="N8 CyberDev / Qamelot">
  <meta name="creator" content="N8 CyberDev">
  <meta name="publisher" content="Qamelot">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="theme-color" content="#070b14">
  <meta name="color-scheme" content="dark light">
  <meta name="application-name" content="N8 CyberDev">
  <meta name="format-detection" content="telephone=no">
  <meta name="n8-improvement-count" content="80">
  <meta name="n8-feature-count" content="16">
${page.file === "index.html" || page.file === "QamelotMenu.html" ? `  <meta name="devdashboard-preview-count" content="${manifest.length}">\n` : ""}  <link rel="canonical" href="${escapeHtml(url)}">
  <link rel="icon" type="image/png" sizes="128x128" href="n8-icon.png">
  <link rel="shortcut icon" type="image/png" href="n8-icon.png">
  <link rel="apple-touch-icon" href="n8-icon.png">
  <link rel="manifest" href="qamelot-media-assets/site.webmanifest">
  <link rel="stylesheet" href="n8-tools-transformers.css">
  <script defer src="n8-tools-transformers.js"></script>
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="N8 CyberDev">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <style id="n8x-styles">
    :root{--n8x-cyan:#66e7ff;--n8x-violet:#ae82ff;--n8x-ink:#f4fbff;--n8x-muted:#a8b7c8;--n8x-bg:rgba(5,10,18,.96);--n8x-line:rgba(102,231,255,.28);--n8x-shadow:0 18px 55px rgba(0,0,0,.55)}
    #n8x-skip{position:fixed;left:12px;top:10px;z-index:2147483647;transform:translateY(-160%);padding:10px 14px;border-radius:9px;color:#031017;background:var(--n8x-cyan);font:800 13px/1.2 system-ui,sans-serif;text-decoration:none;transition:transform .18s}
    #n8x-skip:focus{transform:none}
    #n8x-shell,#n8x-shell *{box-sizing:border-box;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
    #n8x-shell{position:fixed;right:14px;bottom:14px;z-index:2147483000;color:var(--n8x-ink);line-height:1.4;touch-action:manipulation}
    #n8x-shell[data-n8x-side="left"]{left:14px;right:auto}
    #n8x-dock{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:5px;max-width:250px;padding:6px;border:1px solid var(--n8x-line);border-radius:15px;background:var(--n8x-bg);box-shadow:var(--n8x-shadow);backdrop-filter:blur(18px) saturate(1.25);transition:.18s}
    #n8x-shell:not([data-n8x-expanded="true"]) .n8x-secondary{display:none}
    #n8x-shell[data-n8x-hidden="true"] #n8x-dock,#n8x-shell[data-n8x-hidden="true"] #n8x-panel{display:none}
    #n8x-restore{display:none;place-items:center;width:34px;height:44px;border:1px solid var(--n8x-line);border-right:0;border-radius:12px 0 0 12px;color:var(--n8x-cyan);background:var(--n8x-bg);box-shadow:var(--n8x-shadow);font:900 10px/1 ui-monospace,monospace;letter-spacing:-.04em;cursor:pointer}
    #n8x-shell[data-n8x-side="left"] #n8x-restore{border:1px solid var(--n8x-line);border-left:0;border-radius:0 12px 12px 0}
    #n8x-shell[data-n8x-hidden="true"] #n8x-restore{display:grid}
    .n8x-btn,.n8x-link{min-width:42px;min-height:42px;display:grid;place-items:center;border:1px solid transparent;border-radius:11px;padding:7px;color:var(--n8x-ink);background:transparent;text-decoration:none;cursor:pointer;font-size:18px;line-height:1;transition:background .18s,border-color .18s,transform .18s}
    .n8x-btn:hover,.n8x-btn:focus-visible,.n8x-link:hover,.n8x-link:focus-visible{outline:0;border-color:var(--n8x-line);background:rgba(102,231,255,.12);transform:translateY(-2px)}
    .n8x-primary{color:#041017;background:linear-gradient(135deg,var(--n8x-cyan),#a8f3ff)}
    #n8x-progress{position:fixed;left:0;top:0;z-index:2147483646;width:0;height:3px;background:linear-gradient(90deg,var(--n8x-cyan),var(--n8x-violet));box-shadow:0 0 12px var(--n8x-cyan);pointer-events:none}
    #n8x-panel{position:fixed;right:14px;bottom:70px;width:min(400px,calc(100vw - 28px));max-height:min(620px,calc(100vh - 96px));display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;border:1px solid var(--n8x-line);border-radius:18px;background:var(--n8x-bg);box-shadow:var(--n8x-shadow);backdrop-filter:blur(22px) saturate(1.3);overflow:hidden;opacity:0;transform:translateY(18px) scale(.98);pointer-events:none;transition:.2s}
    #n8x-shell[data-n8x-side="left"] #n8x-panel{left:14px;right:auto}
    #n8x-panel[aria-hidden="false"]{opacity:1;transform:none;pointer-events:auto}
    .n8x-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 17px 12px}.n8x-head strong{font-size:14px;letter-spacing:.08em;text-transform:uppercase}.n8x-head small{display:block;margin-top:3px;color:var(--n8x-muted);font-size:11px}
    #n8x-search{width:calc(100% - 28px);min-height:44px;margin:0 14px 10px;border:1px solid var(--n8x-line);border-radius:11px;padding:0 13px;color:var(--n8x-ink);background:rgba(255,255,255,.055);font-size:14px;outline:0}#n8x-search:focus{border-color:var(--n8x-cyan);box-shadow:0 0 0 3px rgba(102,231,255,.1)}
    #n8x-list{overflow:auto;padding:4px 10px 12px;scrollbar-width:thin}.n8x-page{display:grid;grid-template-columns:34px 1fr auto;align-items:center;gap:10px;min-height:51px;padding:7px;border-radius:11px;color:var(--n8x-ink);text-decoration:none}.n8x-page:hover,.n8x-page:focus-visible{outline:0;background:rgba(102,231,255,.1)}.n8x-num{display:grid;place-items:center;width:31px;height:31px;border:1px solid var(--n8x-line);border-radius:9px;color:var(--n8x-cyan);font:800 10px/1 ui-monospace,monospace}.n8x-copy{min-width:0}.n8x-copy b,.n8x-copy span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.n8x-copy b{font-size:12px}.n8x-copy span{color:var(--n8x-muted);font-size:9px}.n8x-arrow{color:var(--n8x-muted)}
    .n8x-foot{display:flex;justify-content:space-between;gap:10px;padding:11px 15px;border-top:1px solid var(--n8x-line);color:var(--n8x-muted);font-size:10px}.n8x-empty{padding:28px 14px;text-align:center;color:var(--n8x-muted);font-size:12px}
    #n8x-toast{position:fixed;left:50%;bottom:78px;z-index:2147483647;max-width:calc(100vw - 28px);transform:translate(-50%,18px);padding:10px 14px;border:1px solid var(--n8x-line);border-radius:10px;color:var(--n8x-ink);background:var(--n8x-bg);box-shadow:var(--n8x-shadow);font:700 12px/1.3 system-ui,sans-serif;opacity:0;pointer-events:none;transition:.2s}#n8x-toast.n8x-show{opacity:1;transform:translate(-50%,0)}
    html[data-n8x-calm="true"] body>*:not(#n8x-shell):not(#n8x-progress):not(#n8x-toast):not(#n8x-skip){filter:saturate(.72) brightness(.86)}
    html[data-n8x-calm="true"]{scroll-behavior:auto!important}
    :focus-visible{outline:2px solid var(--n8x-cyan,#66e7ff);outline-offset:3px}
    @media(max-width:620px){#n8x-shell{right:0;bottom:max(8px,env(safe-area-inset-bottom))}#n8x-shell[data-n8x-side="left"]{left:0;right:auto}#n8x-dock{display:grid;grid-template-columns:36px;gap:3px;max-width:none;padding:4px;border-radius:14px 0 0 14px}#n8x-shell[data-n8x-side="left"] #n8x-dock{border-radius:0 14px 14px 0}#n8x-shell[data-n8x-expanded="true"] #n8x-dock{grid-template-columns:repeat(2,36px)}.n8x-btn,.n8x-link{min-width:36px;min-height:36px;padding:5px;font-size:15px}#n8x-panel{right:46px;bottom:0;width:min(360px,calc(100vw - 54px));max-height:min(560px,calc(100dvh - 16px));border-radius:16px}#n8x-shell[data-n8x-side="left"] #n8x-panel{left:46px;right:auto}.n8x-head{padding:12px 13px 9px}#n8x-search{width:calc(100% - 20px);min-height:40px;margin:0 10px 7px}#n8x-list{padding:3px 7px 9px}.n8x-page{grid-template-columns:31px 1fr auto;gap:7px;min-height:44px;padding:5px}.n8x-num{width:28px;height:28px}.n8x-foot{padding:8px 11px}.n8x-foot span:last-child{display:none}}
    @media(max-width:380px){#n8x-panel{width:calc(100vw - 50px);right:42px}#n8x-shell[data-n8x-side="left"] #n8x-panel{left:42px;right:auto}.n8x-copy span{display:none}}
    @media(prefers-reduced-motion:reduce){#n8x-shell *,#n8x-skip,#n8x-toast{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
    @media print{#n8x-shell,#n8x-progress,#n8x-toast,#n8x-skip{display:none!important}}
  </style>
  ${END_HEAD}`;
}

function bodyEnhancements(page, pages) {
  const currentIndex = pages.findIndex((item) => item.file === page.file);
  const previous = pages[(currentIndex - 1 + pages.length) % pages.length];
  const next = pages[(currentIndex + 1) % pages.length];
  const pageLinks = pages.map((item) => `<a class="n8x-page" href="${escapeHtml(item.file)}" data-search="${escapeHtml(`${item.title} ${item.file} ${item.category}`.toLowerCase())}"><span class="n8x-num">${String(item.number).padStart(2, "0")}</span><span class="n8x-copy"><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.category)} · ${escapeHtml(item.file)}</span></span><span class="n8x-arrow" aria-hidden="true">→</span></a>`).join("");
  const filenames = JSON.stringify(pages.map((item) => item.file)).replaceAll("<", "\\u003c");
  return `${START_BODY}
  <a id="n8x-skip" href="#n8x-content">Skip to page content</a>
  <div id="n8x-progress" aria-hidden="true"></div>
  <div id="n8x-content" tabindex="-1"></div>
  <aside id="n8x-shell" aria-label="N8 CyberDev navigation">
    <section id="n8x-panel" aria-hidden="true" aria-label="All Qamelot pages">
      <div class="n8x-head"><div><strong>Qamelot Menu</strong><small>Search every live N8 experience</small></div><button class="n8x-btn" id="n8x-close" type="button" aria-label="Close menu">×</button></div>
      <label for="n8x-search" style="position:absolute;clip:rect(0 0 0 0)">Search pages</label><input id="n8x-search" type="search" placeholder="Search tools, games, studios…" autocomplete="off" spellcheck="false">
      <nav id="n8x-list" aria-label="Every Qamelot page">${pageLinks}</nav>
      <div class="n8x-foot"><span id="n8x-count">${pages.length} pages</span><span>/ search · Esc close · Alt+M menu</span></div>
    </section>
    <nav id="n8x-dock" aria-label="Quick page controls">
      <a class="n8x-link n8x-primary" href="index.html" aria-label="Open Qamelot home" title="Home (Alt+H)">⌂</a>
      <button class="n8x-btn" id="n8x-open" type="button" aria-expanded="false" aria-controls="n8x-panel" aria-label="Browse every page" title="All pages (Alt+M)">☰</button>
      <a class="n8x-link n8x-secondary" href="${escapeHtml(previous.file)}" aria-label="Previous page: ${escapeHtml(previous.title)}" title="Previous page">←</a>
      <a class="n8x-link n8x-secondary" href="${escapeHtml(next.file)}" aria-label="Next page: ${escapeHtml(next.title)}" title="Next page">→</a>
      <button class="n8x-btn n8x-secondary" id="n8x-random" type="button" aria-label="Open a random page" title="Random page (Alt+R)">⚄</button>
      <button class="n8x-btn n8x-secondary" id="n8x-share" type="button" aria-label="Share or copy this page link" title="Share page">↗</button>
      <button class="n8x-btn n8x-secondary" id="n8x-calm" type="button" aria-pressed="false" aria-label="Toggle calm viewing mode" title="Calm mode">◐</button>
      <button class="n8x-btn n8x-secondary" id="n8x-full" type="button" aria-label="Toggle fullscreen" title="Fullscreen">⛶</button>
      <button class="n8x-btn n8x-secondary" id="n8x-top" type="button" aria-label="Back to top" title="Back to top">↑</button>
      <button class="n8x-btn" id="n8x-more" type="button" aria-expanded="false" aria-label="Show more controls" title="More controls">•••</button>
      <button class="n8x-btn" id="n8x-move" type="button" aria-label="Move controls to the other side" title="Move controls">⇆</button>
      <button class="n8x-btn" id="n8x-hide" type="button" aria-label="Hide floating controls" title="Hide controls">−</button>
    </nav>
    <button id="n8x-restore" type="button" aria-label="Show N8 controls" title="Show controls">N8</button>
  </aside>
  <div id="n8x-toast" role="status" aria-live="polite"></div>
  <script id="n8x-script">
  (()=>{
    const pages=${filenames};
    const shell=document.getElementById('n8x-shell'),panel=document.getElementById('n8x-panel'),open=document.getElementById('n8x-open'),search=document.getElementById('n8x-search'),list=document.getElementById('n8x-list'),toast=document.getElementById('n8x-toast'),more=document.getElementById('n8x-more');
    const readSetting=(key,fallback)=>{try{return localStorage.getItem(key)??fallback}catch{return fallback}},writeSetting=(key,value)=>{try{localStorage.setItem(key,value)}catch{}};
    shell.dataset.n8xSide=readSetting('n8x-side','right')==='left'?'left':'right';shell.dataset.n8xHidden=String(readSetting('n8x-hidden','false')==='true');shell.dataset.n8xExpanded='false';
    const showToast=(message)=>{toast.textContent=message;toast.classList.add('n8x-show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('n8x-show'),2200)};
    const setExpanded=(active)=>{shell.dataset.n8xExpanded=String(active);more.setAttribute('aria-expanded',String(active));more.setAttribute('aria-label',active?'Show fewer controls':'Show more controls')};
    const setMenu=(visible,returnFocus=true)=>{if(visible){shell.dataset.n8xHidden='false';writeSetting('n8x-hidden','false');setExpanded(false)}panel.setAttribute('aria-hidden',String(!visible));open.setAttribute('aria-expanded',String(visible));if(visible){search.focus();search.select()}else if(returnFocus&&shell.dataset.n8xHidden!=='true')open.focus()};
    const setHidden=(hidden)=>{setMenu(false,false);shell.dataset.n8xHidden=String(hidden);writeSetting('n8x-hidden',String(hidden));if(!hidden)open.focus()};
    open.addEventListener('click',()=>setMenu(panel.getAttribute('aria-hidden')==='true'));
    document.getElementById('n8x-close').addEventListener('click',()=>setMenu(false));
    more.addEventListener('click',()=>setExpanded(shell.dataset.n8xExpanded!=='true'));
    document.getElementById('n8x-move').addEventListener('click',()=>{const side=shell.dataset.n8xSide==='left'?'right':'left';shell.dataset.n8xSide=side;writeSetting('n8x-side',side);showToast('Controls moved '+side)});
    document.getElementById('n8x-hide').addEventListener('click',()=>setHidden(true));
    document.getElementById('n8x-restore').addEventListener('click',()=>setHidden(false));
    search.addEventListener('input',()=>{const query=search.value.trim().toLowerCase();let shown=0;list.querySelectorAll('.n8x-page').forEach(link=>{const match=!query||link.dataset.search.includes(query);link.hidden=!match;if(match)shown++});document.getElementById('n8x-count').textContent=shown+' page'+(shown===1?'':'s')});
    document.getElementById('n8x-random').addEventListener('click',()=>{const choices=pages.filter(file=>file!==${JSON.stringify(page.file)});location.href=choices[Math.floor(Math.random()*choices.length)]||'index.html'});
    document.getElementById('n8x-share').addEventListener('click',async()=>{const data={title:document.title,text:'Explore '+document.title,url:location.href};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(location.href);showToast('Live page link copied')}}catch(error){if(error.name!=='AbortError')showToast('Use the address bar to copy this link')}});
    const calm=document.getElementById('n8x-calm');const saved=localStorage.getItem('n8x-calm')==='true';document.documentElement.dataset.n8xCalm=String(saved);calm.setAttribute('aria-pressed',String(saved));calm.addEventListener('click',()=>{const active=document.documentElement.dataset.n8xCalm!=='true';document.documentElement.dataset.n8xCalm=String(active);calm.setAttribute('aria-pressed',String(active));localStorage.setItem('n8x-calm',String(active));showToast(active?'Calm mode on':'Calm mode off')});
    document.getElementById('n8x-full').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch(error){showToast('Fullscreen is unavailable here')}});
    document.getElementById('n8x-top').addEventListener('click',()=>scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
    const progress=document.getElementById('n8x-progress');const updateProgress=()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?Math.min(100,scrollY/max*100):0)+'%'};addEventListener('scroll',updateProgress,{passive:true});addEventListener('resize',updateProgress,{passive:true});updateProgress();
    document.addEventListener('pointerdown',event=>{if(panel.getAttribute('aria-hidden')==='false'&&!shell.contains(event.target))setMenu(false,false)},{capture:true});
    document.addEventListener('keydown',event=>{const typing=/input|textarea|select/i.test(document.activeElement?.tagName||'');if(event.key==='Escape'&&panel.getAttribute('aria-hidden')==='false'){event.preventDefault();setMenu(false)}else if(event.key==='/'&&!typing){event.preventDefault();setMenu(true)}else if(event.altKey&&event.key.toLowerCase()==='m'){event.preventDefault();setMenu(panel.getAttribute('aria-hidden')==='true')}else if(event.altKey&&event.key.toLowerCase()==='h'){event.preventDefault();location.href='index.html'}else if(event.altKey&&event.key.toLowerCase()==='r'){event.preventDefault();document.getElementById('n8x-random').click()}});
    document.querySelectorAll('a[target="_blank"]').forEach(link=>{const rel=new Set((link.rel||'').split(/\s+/).filter(Boolean));rel.add('noopener');rel.add('noreferrer');link.rel=[...rel].join(' ')});
  })();
  </script>
  ${END_BODY}`;
}

let manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
if (!manifest.some((page) => page.file === "QamelotMenu.html")) {
  manifest.push({ number: 51, title: "Qamelot Menu — Compatibility Directory", file: "QamelotMenu.html", category: "Experiments & Archives" });
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

await copyFile(join(ROOT, "index.html"), join(ROOT, "QamelotMenu.html"));

let enhancedCount = 0;
for (const page of manifest) {
  const path = join(ROOT, page.file);
  let html;
  try {
    html = await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  html = removeBlock(html, START_HEAD, END_HEAD);
  html = removeBlock(html, START_BODY, END_BODY);
  const title = titleFromHtml(html, page.title);
  const description = descriptionFor(page, title, html);
  html = removeManagedHeadTags(html);
  const head = headEnhancements(page, title, description);
  const body = bodyEnhancements(page, manifest);
  if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) throw new Error(`${page.file} is missing a closing head or body tag`);
  html = html.replace(/<\/head>/i, `${head}\n</head>`);
  html = html.replace(/<\/body>/i, `${body}\n</body>`);
  await writeFile(path, html, "utf8");
  enhancedCount += 1;
}

console.log(`Enhanced ${enhancedCount} standalone HTML pages with 80-point metadata, navigation, accessibility, safety, and usability coverage.`);
