// 句読点が行頭に落ちないようにする。
// 折り返しは site.css の word-break: keep-all で句読点に寄せているが、句読点のない長い節が幅を超えたときの
// 非常折り返し（overflow-wrap: anywhere）はブラウザが禁則を見ない。そこで「直前の 1 文字＋句読点」を
// 折り返し不可（white-space: nowrap）の span で包み、句読点が前の文字と離れないようにする。
// span は display: inline のままなので、VoiceOver の読み上げ単位は変わらない。
(() => {
  'use strict';
  const RE = /([^、。！？」』）\s])([、。！？」』）]+)/g;
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'CODE', 'PRE']);
  const apply = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentNode && !SKIP.has(n.parentNode.nodeName) && !n.parentNode.classList?.contains('np') && RE.test(n.data))
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const frag = document.createDocumentFragment();
      let last = 0;
      RE.lastIndex = 0;
      for (const m of node.data.matchAll(RE)) {
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
  window.mimisekaKinsoku = apply;
  apply(document.body);
})();
