// 行の折り返しを、どのブラウザでも「句読点で」そろえる。
//
// ⚠️ 2026-09-30 の実測: Safari（iOS 含む）は `word-break: keep-all` を敷くと、
// 句読点のところでも行を折らない。その結果、長い一文がそのまま横にはみ出す
// （Chrome は句読点で折るので、こちらだけ見ていると気づけない）。
// そこで **改行してよい場所を自分で置く**:
//   ① 句読点の直後に <wbr>（＝ここで折ってよい）
//   ② それでも 1 行に収まらない長い節には、一定の間隔で <wbr>（最後の逃げ道）
// あわせて、行頭・行末の禁則を span.np（white-space: nowrap）で守り、
// 和欧間の半角スペースは折り返さない空白に替える。
(() => {
  'use strict';
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'CODE', 'PRE', 'WBR']);
  const CLOSERS = '、。！？」』）';
  const OPENERS = '「『（【';
  const LONG_RUN = 20;   // これを超えて改行機会がない節には（短い節はそのまま＝句読点だけで折る）
  const EVERY = 14;      // この間隔で逃げ道を置く

  const textNodes = (root, test) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentNode && !SKIP.has(n.parentNode.nodeName)
        && !n.parentNode.classList?.contains('np') && test(n.data))
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const out = [];
    while (walker.nextNode()) out.push(walker.currentNode);
    return out;
  };

  // 和欧間の半角スペースを NBSP に（見た目は同じ・ここでは折らない）
  const nbsp = (root) => {
    for (const n of textNodes(root, (d) => d.includes(' '))) {
      n.data = n.data
        .replace(/([A-Za-z0-9.+%-]) ([^\s\x00-\x7F])/g, '$1 $2')
        .replace(/([^\s\x00-\x7F]) ([A-Za-z0-9])/g, '$1 $2');
    }
  };

  // ① 句読点の直後 ② 長い節の途中 に <wbr> を置く
  const breaks = (root) => {
    const has = (d) => /[、。！？」』）]/.test(d) || d.length > LONG_RUN;
    for (const node of textNodes(root, has)) {
      const frag = document.createDocumentFragment();
      let run = '';
      const flush = () => { if (run) { frag.appendChild(document.createTextNode(run)); run = ''; } };
      let sinceBreak = 0;
      // いまの節（次の句読点までの長さ）。短い節には逃げ道を置かない＝句読点だけで折れる
      const clauseLen = (from) => { const m = node.data.slice(from).search(/[、。！？」』）]/); return m < 0 ? node.data.length - from : m; };
      for (let i = 0; i < node.data.length; i++) {
        const ch = node.data[i];
        run += ch; sinceBreak++;
        const runLen = sinceBreak + clauseLen(i + 1);
        const next = node.data[i + 1];
        const isPunct = CLOSERS.includes(ch);
        // 句読点が続くとき（」。など）は最後まで置いてから折る
        if (isPunct && !CLOSERS.includes(next)) {
          flush(); frag.appendChild(document.createElement('wbr')); sinceBreak = 0; continue;
        }
        // 長い節の逃げ道。ただし欧文の語やかっこの直前では置かない
        if (!isPunct && sinceBreak >= EVERY && runLen > LONG_RUN && next && !/[\sA-Za-z0-9]/.test(next)
            && !OPENERS.includes(ch) && !CLOSERS.includes(next) && /[^\sA-Za-z0-9]/.test(ch)) {
          flush(); frag.appendChild(document.createElement('wbr')); sinceBreak = 0;
        }
      }
      flush();
      if (frag.childNodes.length > 1) node.parentNode.replaceChild(frag, node);
    }
  };

  // 禁則: 行頭に来てはいけないもの／行末に残ってはいけないもの／欧文の語
  const RULES = [
    { find: /([^、。！？」』）\s])([、。！？」』）]+)/g, test: /[^、。！？」』）\s][、。！？」』）]/ },
    { find: /([「『（【]+)([^、。！？」』）「『（【\s])/g, test: /[「『（【][^、。！？」』）「『（【\s]/ },
    { find: /([A-Za-z0-9][A-Za-z0-9.+-]*)([^、。！？」』）「『（【\sA-Za-z0-9]?)/g, test: /[A-Za-z0-9]/ },
  ];
  const nowrap = (root, rule) => {
    for (const node of textNodes(root, (d) => rule.test.test(d))) {
      const frag = document.createDocumentFragment();
      let last = 0;
      for (const m of node.data.matchAll(rule.find)) {
        if (m.index > last) frag.appendChild(document.createTextNode(node.data.slice(last, m.index)));
        const span = document.createElement('span');
        span.className = 'np';
        span.textContent = m[0];
        frag.appendChild(span);
        last = m.index + m[0].length;
      }
      if (last < node.data.length) frag.appendChild(document.createTextNode(node.data.slice(last)));
      node.parentNode.replaceChild(frag, node);
    }
  };

  const apply = (root) => {
    nbsp(root);
    breaks(root);
    for (const rule of RULES) nowrap(root, rule);
  };
  window.mimisekaKinsoku = apply;
  apply(document.body);
})();
