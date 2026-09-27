// 句読点とかっこが行の端で泣き別れないようにする。
// 折り返しは site.css の word-break: keep-all で句読点に寄せているが、句読点のない長い節が
// 幅を超えたときの非常折り返し（overflow-wrap: anywhere）はブラウザが禁則を見ない。そこで
//   ① 行頭に来てはいけないもの（、。！？」』））は直前の 1 文字と、
//   ② 行末に来てはいけないもの（「『（【）は直後の 1 文字と、
// それぞれ折り返し不可（white-space: nowrap）の span で括って守る。
// span は display: inline のままなので、VoiceOver の読み上げ単位は変わらない。
(() => {
  'use strict';
  const CLOSE = { find: /([^、。！？」』）\s])([、。！？」』）]+)/g, test: /[^、。！？」』）\s][、。！？」』）]/ };
  const OPEN  = { find: /([「『（【]+)([^、。！？」』）「『（【\s])/g,   test: /[「『（【][^、。！？」』）「『（【\s]/ };
  // 欧文・数字の並び（iPhone / LINE / QR / 3〜5）は途中で割らせず、直後の 1 文字（助詞など）も連れていく。
  // これがないと「LIN / E」で割れ、「iPhone」だけが行末に取り残される。
  const LATIN = { find: /([A-Za-z0-9][A-Za-z0-9.+\-]*)([^、。！？」』）「『（【\sA-Za-z0-9]?)/g, test: /[A-Za-z0-9]/ };
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'CODE', 'PRE']);

  const applyOne = (root, rule) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentNode && !SKIP.has(n.parentNode.nodeName)
        && !n.parentNode.classList?.contains('np') && rule.test.test(n.data))
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
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

  // 和文と欧文のあいだの半角スペースは、見た目を保ったまま折り返さない空白（NBSP）に替える。
  // ふつうの空白は折り返しの機会になるので、「iPhone」だけが行末に取り残されてしまう。
  const nbsp = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentNode && !SKIP.has(n.parentNode.nodeName) && n.data.includes(' '))
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      n.data = n.data
        .replace(/([A-Za-z0-9.+%\-]) ([^\s\x00-\x7F])/g, '$1\u00A0$2')
        .replace(/([^\s\x00-\x7F]) ([A-Za-z0-9])/g, '$1\u00A0$2');
    }
  };

  const apply = (root) => { nbsp(root); applyOne(root, CLOSE); applyOne(root, OPEN); applyOne(root, LATIN); };
  window.mimisekaKinsoku = apply;
  apply(document.body);
})();
