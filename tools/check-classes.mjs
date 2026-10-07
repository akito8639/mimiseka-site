// 6. クラス名の衝突 —— 頁の <style> が、site.css の「どこでも効くクラス」と同じ名前で部品を定義していないか。
//
// 2026-10-07、手紙の頁の試案で封筒に `.env` と名づけたところ、site.css に同名のラベル用クラス
// （display: inline-block・小さな文字）があり、封筒が左寄せの小さな枠になった。目で見ても
// 「余白の設計ミス」に見えるだけで、原因がクラス名の衝突だとは気づきにくい。
//
// 見かた:
//   - site.css のうち、祖先の条件なしに効く規則（`.env { }` や `.kind.app { }` のように、
//     結合子を含まない単独の複合セレクタ）のクラスを「どこでも効くクラス」とする。
//     `.start .fine { }` のように祖先に縛られたものは、その祖先の外では効かないので数えない。
//   - 頁の <style> の各規則について、いちばん左の複合セレクタ（部品を定義している側）に
//     どこでも効くクラスが含まれていれば衝突。`.ask .q-line { }` のように共通のクラスを
//     子孫として調整するだけのものは衝突にしない。
//   - わざと共通のクラスを上書きする行は、同じ行に `/* 共通を上書き */` と書く。
//     書いてあれば通す。書かずに重ねたら落とす（気づかずに重ねたのか、わざとかを区別するため）。
import fs from 'node:fs';
import path from 'node:path';

const MARK = '共通を上書き';

function stripComments(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ''); }

// CSS 文字列から { セレクタ, その行の元テキスト } を取り出す。@media などの中も見る。
function rules(css) {
  const out = [];
  const lines = css.split('\n');
  lines.forEach((line, i) => {
    const clean = stripComments(line);
    for (const m of clean.matchAll(/(^|[}{;])\s*([^{}@;]+?)\s*\{/g)) {
      const sel = m[2].trim();
      if (!sel || sel.startsWith('@')) continue;
      out.push({ sel, line: lines[i], lineNo: i + 1 });
    }
  });
  return out;
}

function classesIn(compound) {
  return [...compound.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);
}

// セレクタを複合セレクタに分ける（結合子: 空白 > + ~）。擬似要素・属性の中の空白は無視できる範囲。
function compounds(sel) {
  return sel.split(/\s*[>+~]\s*|\s+/).filter(Boolean);
}

export function globalClasses(sharedCss) {
  const set = new Set();
  for (const { sel } of rules(stripComments(sharedCss))) {
    for (const one of sel.split(',')) {
      const parts = compounds(one.trim());
      if (parts.length !== 1) continue;   // 祖先に縛られている
      for (const c of classesIn(parts[0])) set.add(c);
    }
  }
  return set;
}

export function checkClassCollisions(root, pages) {
  const errors = [];
  const shared = globalClasses(fs.readFileSync(path.join(root, 'site.css'), 'utf8'));
  for (const p of pages) {
    const html = fs.readFileSync(path.join(root, p.slice(1)), 'utf8');
    for (const style of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
      for (const { sel, line, lineNo } of rules(style[1])) {
        if (line.includes(MARK)) continue;
        for (const one of sel.split(',')) {
          const first = compounds(one.trim())[0] || '';
          const hit = classesIn(first).filter((c) => shared.has(c));
          if (hit.length) {
            errors.push(`クラス名の衝突 ${p} <style> ${lineNo} 行目 "${one.trim()}": .${hit.join(' .')} は site.css のどこでも効くクラス。別名にするか、わざとなら同じ行に /* ${MARK} */`);
          }
        }
      }
    }
  }
  return errors;
}

// 単体でも走らせられる: node tools/check-classes.mjs
if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const root = process.cwd();
  const SKIP = /(^|\/)(node_modules|\.git|\.github|\.claude)(\/|$)/;
  const pages = fs.readdirSync(root, { recursive: true })
    .filter((f) => typeof f === 'string' && f.endsWith('.html') && !f.startsWith('.') && !SKIP.test(f))
    .map((f) => '/' + f.split(path.sep).join('/'));
  const errors = checkClassCollisions(root, pages);
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log(`✓ クラス名の衝突なし（${pages.length} 頁）`);
}
