// サイトの機械検査。壊れたまま公開されるのを止めるための門。
//
// 見るのは「人が気づきにくく、壊れると致命的」なものだけ:
//   1. 枠からのはみ出し（横スクロールが出る状態）
//   2. 画像が読めていない／段が潰れて 0 幅になっている（2026-09-29 の湯呑みの写真の件）
//   3. 行頭に落ちた句読点・行末に残った開きかっこ（禁則）
//   4. リンク切れ（相対リンクの実体がない）
//   5. CSS/JS の版ずれ（頁ごとに ?v= が違うと、古い CSS と新しい HTML が混ざる）
//
// 文章の折り返しの「不格好さ」は数えるだけで落とさない（好みの領域なので門にしない）。
import { chromium, webkit } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WIDTHS = [1600, 1100, 760, 375, 320];
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain' };

const SKIP_DIR = /(^|\/)(node_modules|\.git|\.github)(\/|$)/;
const pages = fs.readdirSync(ROOT, { recursive: true })
  .filter((f) => typeof f === 'string' && f.endsWith('.html') && !f.startsWith('.') && !SKIP_DIR.test(f))
  .map((f) => '/' + f.split(path.sep).join('/'));

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('nf'); return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

const errors = [];
const warns = [];

// --- 5. 版ずれ（HTML を読むだけ）
const vers = new Map();
for (const p of pages) {
  const html = fs.readFileSync(path.join(ROOT, p.slice(1)), 'utf8');
  for (const m of html.matchAll(/(site\.css|site\.js|tayori\.js)\?v=([0-9a-z]+)/g)) {
    vers.set(m[2], [...(vers.get(m[2]) || []), `${p}:${m[1]}`]);
  }
  // --- 4. リンク切れ
  for (const m of html.matchAll(/(?:href|src)="(?!https?:|mailto:|#|data:)([^"]+)"/g)) {
    const target = m[1].split('?')[0].split('#')[0];
    if (!target || target.includes('${')) continue;   // テンプレート文字列（tayori.js が差し込む）は実体を持たない
    const abs = path.resolve(path.dirname(path.join(ROOT, p.slice(1))), target);
    if (!fs.existsSync(abs)) errors.push(`リンク切れ ${p} → ${m[1]}`);
  }
}
if (vers.size > 1) errors.push(`CSS/JS の版がそろっていない: ${[...vers.keys()].join(' / ')}`);

// ⚠️ Chromium だけでは足りない。Safari は `word-break: keep-all` のとき句読点でも折らず、
// 長い一文がそのまま横にはみ出す（2026-09-30 に iPhone で発覚）。WebKit でも同じ検査をする。
for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
const browser = await engine.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const page = await ctx.newPage();

for (const p of pages) {
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    const resp = await page.goto(base + p, { waitUntil: 'load' });
    if (!resp || !resp.ok()) { errors.push(`開けない ${p}`); continue; }
    await page.evaluate(() => document.fonts.ready);
    // 遅延読み込みの画像を起こしてから測る（WebKit は Chromium より読み込みが遅い）
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
      await Promise.all([...document.images].filter(i => !i.complete).map(i => i.decode().catch(() => {})));
    });
    await page.waitForTimeout(250);

    const r = await page.evaluate((W) => {
      const out = { over: [], images: [], collapsed: [], head: [], tail: [], ragged: 0 };
      // 1. はみ出し
      for (const el of document.querySelectorAll('body *')) {
        const b = el.getBoundingClientRect();
        if (b.width > 0 && b.right > W + 1) {
          out.over.push(el.tagName + (el.className ? '.' + String(el.className).slice(0, 18) : ''));
          if (out.over.length > 4) break;
        }
      }
      // 2. 画像と潰れた段
      for (const img of document.querySelectorAll('img')) {
        const b = img.getBoundingClientRect();
        if (!img.complete || img.naturalWidth === 0) out.images.push('読めない: ' + img.getAttribute('src'));
        else if (b.width < 24 || b.height < 24) out.collapsed.push('潰れた: ' + img.getAttribute('src') + ` (${Math.round(b.width)}x${Math.round(b.height)})`);
      }
      // 3. 禁則（行頭の句読点・行末の開きかっこ）
      const rg = document.createRange();
      const OKEND = /[、。！？」』）—・  ]$/;
      for (const el of document.querySelectorAll('p, li, dd, figcaption, h1, h2, h3')) {
        if (el.querySelector('p, li')) continue;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let t, top = null, cur = '', lines = [];
        while ((t = walker.nextNode())) {
          for (let i = 0; i < t.length; i++) {
            rg.setStart(t, i); rg.setEnd(t, i + 1);
            const b = rg.getBoundingClientRect();
            if (!b.height) continue;
            if (top === null) top = b.top;
            if (b.top > top + 1) { lines.push(cur); cur = ''; top = b.top; }
            cur += t.data[i];
          }
        }
        lines.push(cur);
        for (let i = 1; i < lines.length; i++) {
          const prev = lines[i - 1].trim(), next = lines[i].trim();
          if (/^[、。！？」』）]/.test(next)) out.head.push(prev.slice(-8) + '⏎' + next.slice(0, 6));
          if (/[「『（【]$/.test(prev)) out.tail.push(prev.slice(-6) + '⏎' + next.slice(0, 6));
          if (!OKEND.test(prev) && !/^[「『（【]/.test(next)) out.ragged++;
        }
      }
      return out;
    }, w);

    const at = `${p} @${w} (${engineName})`;
    if (r.over.length) errors.push(`はみ出し ${at}: ${r.over.join(', ')}`);
    for (const m of r.images) errors.push(`画像 ${at}: ${m}`);
    for (const m of r.collapsed) errors.push(`画像 ${at}: ${m}`);
    for (const m of r.head.slice(0, 3)) errors.push(`行頭に句読点 ${at}: ${m}`);
    for (const m of r.tail.slice(0, 3)) errors.push(`行末に開きかっこ ${at}: ${m}`);
    if (r.ragged) warns.push(`句読点以外での折り返し ${at}: ${r.ragged} 箇所`);
  }
}

await browser.close();
}
server.close();

if (warns.length) console.log('— 参考（落とさない）—\n' + warns.join('\n'));
if (errors.length) {
  console.error('\n✗ ' + errors.length + ' 件\n' + errors.join('\n'));
  process.exit(1);
}
console.log(`\n✓ ${pages.length} 頁 × ${WIDTHS.length} 幅 × 2 エンジン（Chromium / WebKit）、問題なし`);
