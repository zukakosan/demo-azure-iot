# IoT Edge の掲載位置の修正

確認日: 2026-09-08

## フィードバックと対応

ユーザーの指摘: 「二章見る限り、IoT Edge は結局載ってないね」。前版は3枚目下端に文章が存在したが、冒頭の図と最後の整理表に IoT Edge がなく、接続の選択肢として示すには不十分だった。文字列の存在・原稿一致の検査だけで掲載完了と判断しない。

章の目的・範囲は、直接接続とエッジ経由の違い、および今回の本編が IoT Hub への直接接続であることを説明する点を維持。IoT Edge の詳細比較・構築手順は追加していない。4枚構成、アジェンダの時間配分も維持した。

| ページ | 章内の役割と前提 | 修正後に分かること |
| --- | --- | --- |
| 1 | 前章の全体像を受け、接続要件を整理 | エッジ経由の選択肢に IoT Operations と IoT Edge がある。分岐図と本文に両方を明記 |
| 2 | 接続要件を今回の本編へ当てはめる | IoT Hub への直接接続。変更なし |
| 3 | 直接接続と現場側処理の違いを説明 | IoT Operations の構成例に加え、IoT Edge を独立見出しで紹介。図と72時間の条件は IoT Operations に限定 |
| 4 | 前の説明を踏まえ、併用と今回の対象を整理 | IoT Edge + IoT Hub を表の専用行で確認できる。上の2経路図は IoT Operations を使う例 |

技術情報は Microsoft Learn MCP で再確認し、根拠リンクを投影本文・ノートに維持した。IoT Edge のコンテナー実行は[概要](https://learn.microsoft.com/ja-jp/azure/iot-edge/about-iot-edge)、IoT Hub へのゲートウェイ利用は[ゲートウェイの説明](https://learn.microsoft.com/ja-jp/azure/iot-edge/iot-edge-as-gateway)、サポート状況は[バージョン履歴](https://learn.microsoft.com/ja-jp/azure/iot-edge/version-history)に基づく。

## 成果物と検査

- [修正版 PowerPoint](../../02-connection-patterns-iot-edge-visible.pptx)
- [修正版 PDF](../../02-connection-patterns-iot-edge-visible.pdf)
- [機械検査記録](validation.json)
- [図の原稿構造](source-graphs.json)

前回の出力と元テンプレートは上書きしていない。修正元は [slides.md](../../slides.md)、配置は [build-slides.ps1](../../build-slides.ps1)、構成案は [outline.md](../../outline.md)。

実際の PowerPoint で保存・再オープンに成功。原稿本文・表・図ラベルとの一致、矢印方向・接続先、グループ内配置、文字枠・表セルの収まりを検査し、はみ出し候補0件（許容差2 pt）。テンプレートのハッシュは変更なし。

読み取り専用の別エージェントが [テンプレート](template-body.png) と [1枚目](02-01.png)、[2枚目](02-02.png)、[3枚目](02-03.png)、[4枚目](02-04.png) を目視確認した。IoT Edge を選択肢として認識でき、図・注意条件の対象も区別できると評価。必須修正なし。3枚目の確認日を含む括弧書きはやや密で、改行は任意改善。会場後方での可読性やリンクのクリック操作は未検証。

エディター診断は既存の未使用変数 `teal` の警告1件。変更したMarkdownにエラーなし。この修正版では2回生成の一致検査は再実施しておらず、前回の一致結果を今回の検証結果として流用しない。

## 再生成

Windows、PowerShell 7、デスクトップ版 PowerPoint が必要。リポジトリルートから、既存成果物を保護する一意の出力先を指定して実行する。

```powershell
$section = Join-Path $PWD 'docs/sections/02-connection-patterns'
$run = Join-Path $section ('verification/edge-check-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $run | Out-Null
& "$section/build-slides.ps1" -Output "$run/slides.pptx" -VerificationDirectory "$run/render"
```

PPTX と同じ場所に PDF、render フォルダーに各ページの PNG と検査 JSON が生成される。更新後は機械検査に加え、IoT Edge が冒頭図・見出し・整理表で認識できるかを描画画像で確認する。