// ミミセカからの便り — 新しいものを上に足す。date は YYYY-MM-DD、kind は「イベント」「お知らせ」「更新」のどれか。
// app はどのアプリの話か（"シア"／"ルペ"／null＝ブランド全体）。body は 1〜2 文。URL があれば link に。
// 写真を添えるなら photo（photo/ 配下・横 1600px）と photoAlt（目を閉じた人にも伝わる説明・必須）、あれば caption。写真は便りのページにだけ出ます。
// このファイルだけ書き換えれば、トップと便りのページの両方に出ます。
// 頁の言語で項目を選ぶ。en が無いエントリは日本語のまま出る（翻訳待ちでも壊れない）
// 同じ日付が 2 本並ぶと記事の id が衝突し、トップからのリンクが先頭にしか飛ばない。
// 読み込み時に一度だけ、記事ごとの印を決めておく（同じ日の 2 本目以降は -2, -3…）。
window.TAYORI_ANCHOR = (list) => {
  const seen = {};
  for (const it of list) {
    const n = (seen[it.date] = (seen[it.date] || 0) + 1);
    it.anchor = n === 1 ? it.date : it.date + '-' + n;
  }
  return list;
};

window.TAYORI_L = (it) =>
  ((document.documentElement.lang || 'ja').toLowerCase().startsWith('en') && it.en)
    ? Object.assign({}, it, it.en) : it;

window.TAYORI = [
  {
    date: "2026-10-06",
    kind: "お知らせ",
    app: null,
    title: "サイトに英語版を加えました",
    body: "すべてのページに英語版を用意しました。どのページでも、右上から切り替えられます。",
    link: "en/index.html",
    en: {
      kind: "Notice", app: null,
      title: "The site is now available in English",
      body: "Every page now has an English version. You can switch between the two from the top right of any page.",
      link: "index.html"
    }
  },
  {
    date: "2026-10-06",
    kind: "お知らせ",
    app: "シア",
    title: "使い方に「写真に言葉をつける」を加えました",
    body: "VoiceOver でお使いの方へ。撮るか選ぶかで写真に説明がつき、カメラロールから言葉で探せるようになるまでを、1 ページにまとめました。",
    link: "scia/caption.html",
    en: {
      kind: "Notice", app: "Scia",
      title: "A new guide: giving a photograph words",
      body: "For people using VoiceOver. One page on how taking or choosing a photo gives it a description, and how to find it again by a word."
    }
  },
  {
    date: "2026-09-20",
    kind: "お知らせ",
    app: "シア",
    title: "App Store に、アクセシビリティ情報を掲載しました",
    body: "VoiceOver、文字の拡大、コントラスト、字幕など、実際に確認できた項目だけを申告しています。確認中の項目は正直に未対応としています。",
    link: null,
    en: {
      kind: "Notice", app: "Scia",
      title: "Accessibility information is now on the App Store",
      body: "VoiceOver, larger text, contrast, captions — we declare only the items we have actually confirmed. Anything still being checked is listed honestly as unsupported."
    }
  },
  {
    date: "2026-09-19",
    kind: "お知らせ",
    app: "シア",
    title: "「ミミセカ シア」を App Store で公開しました",
    body: "写真と話す、書かない日記。撮った一枚とすこし話すだけで、日記になり、物語になり、声で聴けます。無料ではじめられます。",
    link: "https://apps.apple.com/jp/app/id6760955583",
    en: {
      kind: "Notice", app: "Scia",
      title: "“MimiSeka Scia” is out on the App Store",
      body: "Talk with a photograph; a diary you never write. Say a little about the one you took, and it becomes a diary, then a story, and it can be listened to. Free to start."
    }
  },
  {
    date: "2026-09-13",
    kind: "お知らせ",
    app: null,
    title: "クラウドファンディングを終えました",
    body: "7 月から 9 月まで、CAMPFIRE で挑戦しました。目標には遠く及びませんでしたが、支えてくださった方々、言葉をくださった方々に、ありがとうございます。ここで得た経験を糧に、つくり続けます。",
    link: "https://camp-fire.jp/projects/956373/view",
    en: {
      kind: "Notice", app: null,
      title: "Our crowdfunding campaign has ended",
      body: "We ran it on CAMPFIRE from July to September. We fell well short of the goal, but to everyone who supported us and everyone who sent us words — thank you. We will keep building on what we learned here."
    }
  },
  {
    date: "2026-07-01",
    kind: "イベント",
    app: null,
    title: "渋谷 QWS「CROSS STAGE」に出展しました",
    body: "来場者の一言——「説明の描写がよくなっているだけで、物語じゃないよね」——が、写真と話す機能の出発点になりました。",
    link: null,
    photo: "photo/crossstage-2026-07.jpg",
    photoAlt: "展示ブースのパネル。上にミミセカのロゴと「耳から世界を体験する」の文字、まわりに写真が数枚ピンで留めてある。「物語にしたら、その一枚は特別に思えた？」と書かれた表に、来場者が貼った赤と青の丸いシールが並び、「特別に思えた」の欄に集まっている。手前はやわらかくぼけて、奥に来場者の後ろ姿。",
    caption: "来場者のシールは「物語にしたら、特別に思えた」に集まりました。",
    en: {
      kind: "Event", app: null,
      title: "We exhibited at SHIBUYA QWS “CROSS STAGE”",
      body: "A remark from one visitor — “the description has just got better at describing; it isn\u2019t a story, is it?” — became the starting point for talking with a photograph.",
      photoAlt: "A panel at an exhibition booth. The MimiSeka logo sits at the top with the words “experiencing the world through the ears”, and photographs are pinned around it. On a chart asking “once it became a story, did that photo feel special?”, visitors have added red and blue dot stickers, gathered in the column for “it felt special”. The foreground is softly out of focus; behind, visitors are seen from the back.",
      caption: "The visitors\u2019 stickers gathered on “once it became a story, it felt special”."
    }
  }
];

window.TAYORI_ANCHOR(window.TAYORI);
