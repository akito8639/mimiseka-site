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

## CSS / JS を変えたら版を上げる

Cloudflare 経由のあいだは `site.css` / `site.js` / `tayori.js` が 4 時間キャッシュされる（`cache-control: max-age=14400`）。
中身を変えたら、全 HTML の `?v=YYYYMMDDx` を新しい値に揃える:

```bash
V=20260922a; for f in $(find . -name '*.html' -not -path './.git/*'); do sed -i '' -E "s#(site\.css|site\.js|tayori\.js)(\?v=[0-9a-z]+)?\"#\1?v=$V\"#g" "$f"; done
```

## 公開の流れ（draft → main）

- 直しは **`draft` ブランチ**で。push すると https://mimiseka.jp/preview/ に載る（本番はそのまま・検索には載せない）
- 確認できたら `draft` を `main` にマージ → https://mimiseka.jp/ が更新される
- 仕組みは `.github/workflows/pages.yml`（main を根に、draft を `/preview/` に置いた 1 つのサイトを組み直す）

```bash
git switch draft && git merge --ff-only main   # 作業前に main を取り込む
# …直して push…
git switch main && git merge --ff-only draft && git push   # 公開
```
