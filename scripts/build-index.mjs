import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['.git', '.github', 'scripts']);

const entries = [];
for (const name of await fs.readdir(root, { withFileTypes: true })) {
  if (!name.isDirectory() || ignored.has(name.name) || name.name.startsWith('.')) continue;
  const metaPath = path.join(root, name.name, 'meta.json');
  try {
    const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    if (!meta.id || !meta.title || !meta.path || !meta.date) throw new Error('missing id/title/path/date');
    if (!meta.path.startsWith(`${name.name}/`) || meta.path.includes('..')) throw new Error('path must stay inside content folder');
    entries.push({ ...meta, folder: name.name });
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`${name.name}/meta.json: ${error.message}`);
  }
}

entries.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'zh-Hant'));
await fs.writeFile(path.join(root, 'content.json'), `${JSON.stringify(entries, null, 2)}\n`);

const catalog = JSON.stringify(entries).replace(/</g, '\\u003c');
const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>特殊教育研習與實務資料庫</title>
  <style>
    :root{--paper:#f3f6f4;--surface:#fff;--ink:#17231e;--muted:#5b6b64;--rule:#ced8d3;--teal:#126f67;--teal-soft:#dbece8;--shadow:0 12px 30px rgba(23,35,30,.1);--sans:-apple-system,BlinkMacSystemFont,"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif;--serif:"Iowan Old Style","Noto Serif TC","Songti TC",serif}
    html[data-theme=dark]{--paper:#111815;--surface:#19221e;--ink:#edf4f0;--muted:#aab9b2;--rule:#3a4942;--teal:#79cdbc;--teal-soft:#203d36;--shadow:0 12px 30px rgba(0,0,0,.28);color-scheme:dark}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);line-height:1.7}button,input,select{font:inherit}button{color:inherit}
    .wrap{width:min(1180px,100%);margin:auto;padding:28px clamp(18px,5vw,64px) 80px}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--rule);padding-bottom:18px}.kicker{margin:0;color:var(--teal);font-size:12px;font-weight:800;letter-spacing:.08em}.theme{width:40px;height:40px;border:1px solid var(--rule);border-radius:4px;background:var(--surface);cursor:pointer;font-size:20px}.hero{padding:74px 0 54px;border-bottom:1px solid var(--ink)}h1{max-width:800px;margin:0;font:620 clamp(36px,6vw,72px)/1.1 var(--serif)}.hero p{max-width:720px;color:var(--muted);font-size:18px}.tools{display:grid;grid-template-columns:minmax(0,1fr) 180px 180px;gap:10px;margin:28px 0}.field{min-height:44px;border:1px solid var(--rule);border-radius:4px;background:var(--surface);color:var(--ink);padding:9px 12px}.count{color:var(--muted);font-size:13px;align-self:center}.catalog{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.entry{display:flex;flex-direction:column;min-width:0;border:1px solid var(--rule);border-radius:6px;background:var(--surface);box-shadow:var(--shadow);overflow:hidden}.entry-main{padding:22px}.entry-date{margin:0 0 5px;color:var(--teal);font-size:12px;font-weight:800}.entry h2{margin:0;font:650 25px/1.3 var(--serif)}.entry p{color:var(--muted)}.tags{display:flex;flex-wrap:wrap;gap:6px}.tag{border:1px solid var(--rule);border-radius:3px;padding:3px 7px;color:var(--muted);font-size:11px}.open{display:inline-block;margin-top:auto;border-top:1px solid var(--rule);padding:14px 22px;color:var(--teal);font-weight:800;text-decoration:none}.open:hover{background:var(--teal-soft)}.empty{padding:50px 0;color:var(--muted);text-align:center}.footer{margin-top:48px;padding-top:18px;border-top:1px solid var(--rule);color:var(--muted);font-size:12px}
    @media(max-width:760px){.hero{padding:48px 0 38px}.tools{grid-template-columns:1fr 1fr}.tools input{grid-column:1/-1}.catalog{grid-template-columns:1fr}.entry h2{font-size:23px}}
  </style>
</head>
<body>
  <div class="wrap">
    <header class="top"><p class="kicker">SPECIAL EDUCATION KNOWLEDGE HUB</p><button class="theme" id="theme" type="button" aria-label="切換為暗色模式" title="切換為暗色模式">☾</button></header>
    <main>
      <section class="hero"><h1>特殊教育研習與實務資料庫</h1><p>整理特教研習、鑑定研判、個案研討與可重複使用的互動式報告。</p></section>
      <section class="tools" aria-label="內容篩選"><input class="field" id="search" type="search" placeholder="搜尋標題、SLD、鑑定研判…" aria-label="搜尋內容"><select class="field" id="type" aria-label="依類型篩選"><option value="all">全部類型</option></select><select class="field" id="year" aria-label="依年份篩選"><option value="all">全部年份</option></select><span class="count" id="count"></span></section>
      <section class="catalog" id="catalog" aria-live="polite"></section>
    </main>
    <footer class="footer">Private repository · 去識別內容 · 正式鑑定請依當期法規與所在地規定</footer>
  </div>
  <script>
    const entries = ${catalog};
    const root = document.documentElement;
    const themeButton = document.getElementById('theme');
    const applyTheme = (theme) => { root.dataset.theme = theme; const dark = theme === 'dark'; themeButton.textContent = dark ? '☀' : '☾'; const label = dark ? '切換為明亮模式' : '切換為暗色模式'; themeButton.title = label; themeButton.setAttribute('aria-label', label); };
    let savedTheme = null; try { savedTheme = localStorage.getItem('special-education-hub-theme'); } catch (_) {}
    applyTheme(savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    themeButton.addEventListener('click', () => { const next = root.dataset.theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('special-education-hub-theme', next); } catch (_) {} applyTheme(next); });
    const type = document.getElementById('type'), year = document.getElementById('year'), search = document.getElementById('search'), catalog = document.getElementById('catalog'), count = document.getElementById('count');
    [...new Set(entries.map((entry) => entry.type))].forEach((value) => type.insertAdjacentHTML('beforeend', '<option value="' + value + '">' + value + '</option>'));
    [...new Set(entries.map((entry) => entry.date.slice(0, 4)))].forEach((value) => year.insertAdjacentHTML('beforeend', '<option value="' + value + '">' + value + '</option>'));
    const render = () => { const query = search.value.trim().toLowerCase(); const filtered = entries.filter((entry) => (!query || JSON.stringify(entry).toLowerCase().includes(query)) && (type.value === 'all' || entry.type === type.value) && (year.value === 'all' || entry.date.startsWith(year.value))); count.textContent = '顯示 ' + filtered.length + ' / ' + entries.length + ' 項'; catalog.innerHTML = filtered.length ? filtered.map((entry) => '<article class="entry"><div class="entry-main"><p class="entry-date">' + entry.dateLabel + ' · ' + entry.type + '</p><h2>' + entry.title + '</h2><p>' + entry.description + '</p><div class="tags">' + entry.tags.map((tag) => '<span class="tag">' + tag + '</span>').join('') + '</div></div><a class="open" href="' + entry.path + '">開啟內容 →</a></article>').join('') : '<p class="empty">找不到符合的內容。</p>'; };
    [search, type, year].forEach((control) => control.addEventListener(control === search ? 'input' : 'change', render)); render();
  </script>
</body>
</html>
`;
await fs.writeFile(path.join(root, 'index.html'), html);
console.log(`Built index with ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}.`);
