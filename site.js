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

  const apply = (root) => { applyOne(root, CLOSE); applyOne(root, OPEN); };
  window.mimisekaKinsoku = apply;
  apply(document.body);
})();
