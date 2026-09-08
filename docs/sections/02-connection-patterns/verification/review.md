# 第02章 スライド生成・検証記録

確認日: 2026-09-08

## 成果物と修正元

- 編集可能な資料: [PowerPoint](../02-connection-patterns-from-slides.pptx)
- 確認・配布用: [PDF](../02-connection-patterns-from-slides.pdf)
- 本文・図の修正元: [slides.md](../slides.md)
- 今回の生成処理: [build-slides.ps1](../build-slides.ps1)
- 読み取り専用の参照資料: [opus-template-sample-002.pptx](../../../references/opus-template-sample-002.pptx)

既存の JavaScript 生成スクリプトは今回の生成には使用していない。本文・表・図のラベルは原稿から読み込み、生成スクリプトには配置座標と書式を保持する。テンプレートの2ページ目を複製し、背景・タイトル・区切り線・ページ番号の図形を継承した。元原稿とテンプレートは変更していない。

## 再生成

前提: Windows、PowerShell、デスクトップ版 PowerPoint。リポジトリのルートで実行する。

```powershell
./docs/sections/02-connection-patterns/build-slides.ps1 -ValidateOnly
./docs/sections/02-connection-patterns/build-slides.ps1 -Force
```

`-Force` は今回の生成済みPPTXとPDFを上書きする。PowerPointで手作業の修正を加えた場合は、別の出力名を `-Output` に指定し、手修正版を保護する。

Mermaid は現原稿の `flowchart LR`、四角ノード、有向辺、辺ラベル、入れ子の `subgraph` を読み取る。汎用Mermaidレンダラーではなく、本章の構成向けにPowerPointの図形・コネクタへ変換する処理。未対応の構文はエラーにする。図の構造や枚数を変更する場合は配置定義も変更し、再描画して確認する。

## 検証結果

- 全4枚をPowerPointで描画し、保存済みPPTXを再オープンできることを確認。
- 投影本文・表の文言は、Markdown装飾とリンク表現の変換を除いて原稿との完全一致を検査。
- Mermaidの16ノード・12本の有向辺・4グループについて、文言・接続先・矢印・親子関係・枠内配置を検査。
- 本文・表・図はPowerPointのネイティブ要素。図を1枚の画像にはしていない。
- テキスト枠と表セルを実測。許容差2ptで、最終版にはみ出し候補なし。
- PPTX内部のXMLで4枚のスライド、4枚のノート、9件の公式出典ハイパーリンク参照を確認。ノートには完全URLと原稿のハッシュを収録。
- テンプレートが未変更であることをSHA-256で検査。原稿・テンプレートのハッシュと実測値は [validation.json](validation.json) に記録。
- 読み取り専用の別エージェントがテンプレート画像と全4枚を確認。修正後の再レビューでは必須修正なし。

## 描画レビューでの修正

- 書式: 追加図形に継承された不要なグラデーションと影を除去。
- 図の意味: 通信ラベルを移動して現場・Azure・実行基盤の境界を見せ、分岐理由を矢印に近づけた。
- 対象範囲: 第4枚のデバイス側にも「今回の対象」を外付けで表示。原稿のノードラベルは維持。
- 実装・検証: 第1枚の表列幅を調整し、セルの幅超過を解消。

レビュー対象画像: [02-01](02-01.png)、[02-02](02-02.png)、[02-03](02-03.png)、[02-04](02-04.png)。PowerPointでの描画を確認したもので、他の閲覧アプリの表示互換性までは検証していない。