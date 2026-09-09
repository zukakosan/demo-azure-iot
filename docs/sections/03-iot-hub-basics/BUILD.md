# 第3章の生成・再検証

## 成果物

- [PowerPoint](03-iot-hub-basics-protocols.pptx): 12枚、25分程度。プロトコル比較をSDKの説明から独立させた現行版。図形・表・本文は編集可能。
- [確認用PDF](03-iot-hub-basics-protocols.pdf): 同じPowerPointから出力。
- 前回の11枚版は [PowerPoint](03-iot-hub-basics.pptx) と [PDF](03-iot-hub-basics.pdf) を変更せず保持する。
- 本文の修正元は [slide.md](slide.md)。章の目的・範囲は [outline.md](outline.md)。
- [build-slides.ps1](build-slides.ps1) は本文・表・例示コード・問いを原稿から直接読み込み、ページ別の配置を指定する。図中ラベルは原稿の「図の構成」を具体化したもの。
- [verify-slides.ps1](verify-slides.ps1) はPPTXのXML、タイトル、ノート、出典リンク、ネイティブ図形を検査する。

## 実行環境

今回の検証環境はWindows、PowerShell 7、インストール済みのデスクトップ版PowerPoint。生成はPowerPoint COMを利用し、独自のフォントや外部の生成ライブラリは追加しない。テンプレートは [opus-template-sample-002.pptx](../../references/opus-template-sample-002.pptx) を使う。

リポジトリのルートから実行する。

```powershell
pwsh -File ./docs/sections/03-iot-hub-basics/build-slides.ps1 -ValidateOnly
```

現在の配布版を残して別の出力先へ再生成する例:

```powershell
pwsh -File ./docs/sections/03-iot-hub-basics/build-slides.ps1 `
  -Output ./docs/sections/03-iot-hub-basics/03-iot-hub-basics-regenerated.pptx `
  -VerificationDirectory ./docs/sections/03-iot-hub-basics/verification/regenerated
```

生成直後の未編集版だけを更新する場合:

```powershell
pwsh -File ./docs/sections/03-iot-hub-basics/build-slides.ps1 -Force
```

既存ファイルは既定で上書きしない。`-Force` 指定時も、前回の検査記録の出力先・SHA256と一致しなければ停止する。PowerPointで手編集した版は保持し、異なる出力先と検査フォルダーを指定する。テンプレートのハッシュも生成前後で照合し、元ファイルは変更しない。ユーザーが開いている別プレゼンテーションは閉じず、PowerPoint全体の終了・強制終了は行わない。

## 検査と編集上の注意

- 12枚・ノートの合計1500秒を確認し、全タイトルと全投影本文の各要素を、生成直後と再オープン後に照合する。出典は本文中の番号と同ページのリンクへ変換し、完全なURLをノートに保持する。
- 図表はPowerPointの図形・線・表・テキスト。元の本文スライドを複製し、マスター・レイアウト・タイトル位置・罫線を継承する。独自の表紙は追加しない。
- 本文の改行と出典ラベル短縮を除き、原稿の文言は省略しない。各ページの役割・図の指定・講師ノートもノートに格納する。確認問題の答えは投影しない。
- 文の追加や表の行数を変更した場合は、配置コードの調整と再描画が必要。機械検査の成功だけを、視覚的な読みやすさの保証としない。
- デモ実装へのリンクは、この作業環境のローカルファイルを指す。外部配布時はリポジトリと合わせて渡すか、配布先からアクセス可能なリンクへ調整する。

現行版の描画画像・検査記録は [verification/protocols](verification/protocols/) に分離する。[validation.json](verification/protocols/validation.json) は原稿・テンプレート・出力のSHA256、本文一致、ノート、リンク、文字枠の測定値（許容差2pt）を記録する。[structure.json](verification/protocols/structure.json) は保存済みPPTXの構造検査、[review.md](verification/protocols/review.md) は画像レビューの結果である。前回版の [描画レビュー](verification/review.md) は当時の11枚に対する記録として保持し、現行原稿との一致を示すものではない。

実機デモ、実ログの取得、25分の発話実測、他のOS・レンダラーでの表示確認は含まない。