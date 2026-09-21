# ToolzToolz Sandbox

Next.js を使わない、素の HTML/JS だけの実験環境。`tools/` 配下にフォルダを追加するだけで新しいジェネレーターを試作できる。

## 構成

```
shared/
  vendor/           p5.js / p5-svg / tweakpane 本体(ローカルvendor、npm不要)
  bootstrap.js      p5インスタンス生成 + TweakPane構築 + URL同期を配線する共通処理
  createTweakPane.js  defaultParams定義からTweakPaneのUIを自動生成
  urlParams.js      URLクエリ ⇔ パラメータの相互変換
  color.js          共通カラーパレット
  gradient.js       グラデーション系ツール共通のカラー補間ヘルパー(multiLerpColor/triangleWave)
  layout.js         複数シェイプ配置・差異付け用ヘルパー(phyllotaxisPoints/hash01/hashRange/shuffleColors/pickGradientStyle)
  datetime.js       ダウンロードファイル名用の日時フォーマッタ
  style.css         最低限のレイアウト(canvas + パラメーターパネル)

tools/
  0002_OneFlower/
    index.html
    sketch.js       defaultParams + setupP5(p5スケッチ本体) + exportSVG/exportPNG
  0004_Twinkles/
    ...
```

## 新しいツールの追加方法

1. `tools/0002_OneFlower/` を丸ごとコピーして `tools/00XX_YourIdea/` にリネーム
2. `sketch.js` の `defaultParams`(パラメーター定義)と `setupP5` の描画ロジックを書き換える
   - `category` を揃えると TweakPane 上で同じフォルダにまとまる
   - `exportSVG` / `exportPNG` はそのまま流用可能(p5-svgでcreateGraphicsするだけ)
3. `index.html` の `<title>` を変更する(他はコピーのままでOK)

## 起動方法

ES Modules を使っているため `file://` では動かない(ブラウザがCORSでブロックする)。簡易サーバーを立てて開く。

```bash
python3 -m http.server 8000
# → http://localhost:8000/tools/0002_OneFlower/index.html
```

または `npx serve .` でも可。

## 既知の注意点

- p5.js は `1.6.0`、p5-svg は `1.5.3` に固定している(本家ToolzToolzリポジトリのpackage-lock.jsonに合わせた組み合わせ)。新しいp5.jsに上げると `svgGraphics.remove()` 時に例外が出ることがあるため、`sketch.js` 側では try/catch で握りつぶしている。
- URLクエリパラメータへの反映はスライダー操作中はデバウンスされ、離した瞬間にまとめて `history.replaceState` される(`shared/urlParams.js`)。
