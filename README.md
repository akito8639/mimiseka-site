# mimiseka.jp — ミミセカ 公式サイト

静的サイト（HTML / CSS / JS のみ・ビルド不要）。

```
index.html          ブランドの頁（問い・一枚聴いてみる・アプリの入口・便り・出発点・締め）
scia/index.html     ミミセカ シア
scia/camera.html    カメラとしても、ちゃんと
lupe/index.html     ミミセカ ルペ（近日公開）
news.html           便り（一覧）— 中身は tayori.js が正本
accessibility.html  目を閉じても、使えます
contact.html        お問い合わせ（送信先は ENDPOINT / TURNSTILE_SITE_KEY の 2 定数）
site.css            共通スタイル（SciaTheme 正典: 紙・墨・朱）
tayori.js           便りのデータ（新しいものを上に足す）
photo/              写真
```

## 更新のしかた

- お知らせを足す: `tayori.js` に 1 項目足して push（トップと便りの両方に出る）
- 配色・書体: `site.css` だけ
- お問い合わせを本番につなぐ: `contact.html` の `ENDPOINT` と `TURNSTILE_SITE_KEY`（受け口は SenseLit リポジトリ `lambda/published_story` の `POST /contact`）

## 公開

`CNAME` = `mimiseka.jp`。DNS は Cloudflare（グレー雲 = DNS only）。
