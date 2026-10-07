# mimiseka.jp — ミミセカ 公式サイト

静的サイト（HTML / CSS / JS のみ・ビルド不要）。

```
index.html          ブランドの頁（問い・一枚聴いてみる・アプリの入口・便り・出発点・締め）
scia/index.html     ミミセカ シア
scia/camera.html    カメラとしても、ちゃんと
scia/letters.html   手紙が届く（1.3.0 の新しいこと: 今日の手紙・ひと月の手紙・説明の話し方）
lupe/index.html     ミミセカ ルペ（近日公開）
news.html           便り（一覧）— 中身は tayori.js が正本
accessibility.html  目を閉じても、使えます
contact.html        お問い合わせ（送信先は ENDPOINT / TURNSTILE_SITE_KEY の 2 定数）
site.css            共通スタイル（SciaTheme 正典: 紙・墨・朱）
tayori.js           便りのデータ（新しいものを上に足す）
photo/              写真
terms.md            用語集（シアの機能名と英語名・便りや頁を書くときはここに合わせる）
```

## 更新のしかた

- お知らせを足す: `tayori.js` に 1 項目足して push（トップと便りの両方に出る）
- 配色・書体: `site.css` だけ
- 頁に専用のクラスを足す: 先に `node tools/check-classes.mjs` を通す（`site.css` と同じ名前を避ける。共通のクラスをわざと上書きする行には `/* 共通を上書き */`）
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

- 直しは **`draft` ブランチ**で。push すると、本番と同じドメインの非公開の下層パスにプレビューが載る（パスは Actions の secret `PREVIEW_PATH`・検索には載せない・本番はそのまま）
- 確認できたら `draft` を `main` にマージ → https://mimiseka.jp/ が更新される
- 仕組みは `.github/workflows/pages.yml`

```bash
git switch draft && git merge --ff-only main   # 作業前に main を取り込む
# …直して push…
git switch main && git merge --ff-only draft && git push   # 公開
```

## 公開前の機械検査

`tools/check.mjs` が、push のたびに GitHub Actions で走る（落ちると deploy まで行かない）。見るのは 6 つ:

1. **はみ出し** — 1600 / 1100 / 760 / 375 / 320px の 5 幅 ×  Chromium と WebKit の 2 エンジンで、枠から出ている要素がないか（Safari だけで壊れる折り返しがあるため）
2. **画像** — 読めていない画像、潰れて 24px 未満になった画像（2026-09-29 に湯呑みの写真が 0 幅になった件の再発防止）
3. **禁則** — 行頭に落ちた句読点、行末に残った開きかっこ
4. **リンク切れ** — 相対リンクの実体があるか
5. **版ずれ** — 全頁の `site.css` / `site.js` / `tayori.js` の `?v=` が同じか
6. **クラス名の衝突** — 頁の `<style>` が、`site.css` のどこでも効くクラスと同じ名前で部品を定義していないか（2026-10-07 に封筒を `.env` と名づけて、同名のラベル用クラスと衝突した件の再発防止。わざと上書きする行は `/* 共通を上書き */` と書く。単体で走らせるなら `node tools/check-classes.mjs`）

「句読点以外での折り返し」は数えて表示するだけで、落とさない（好みの領域）。
