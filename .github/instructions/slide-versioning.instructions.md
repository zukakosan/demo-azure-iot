---
description: "Use when creating, revising, converting, or exporting slide decks, slides.md, PowerPoint, PPTX, or PDF files in this workspace. Enforces chapter-by-chapter authoring and versioned artifact directories."
name: "Slide Versioning Workflow"
---
# Slide Versioning Workflow
- slides.md の構成が固まるまでスライド生成はしない
- Work one chapter at a time. Complete that chapter's `slides.md` before converting it to PDF or PPTX.
- Treat the chapter-level `slides.md` as the working draft. Do not generate slide artifacts from an incomplete chapter draft.
- When a chapter is ready to convert, assign the next version (`v1`, `v2`, and so on) and create a matching directory inside that chapter.
- Freeze the completed source as `<version>-slides.md` inside the version directory.
- Generate both PDF and PPTX outputs in the same version directory. Prefix each output filename with the same version.
- Never mix source or generated artifacts from different versions in one directory.
- PPTX を生成するときは、共通ヘルパーを一から書かず `docs/template/generate-opus.template.js` と `docs/template/render-opus.template.ps1` をコピーして使う。
- コピーした `generate-opus.js` は先頭の `CFG` ブロック（章番号・タイトル・フッター・表紙チップ・出力パス）とスライド関数を章に合わせて書き換える。共通ヘルパー（`header`/`footer`/`lead`/`sources`/`callout`/`tableAt`/`codeBox`/`connect`/`node`）の定義は、章をまたいだ見た目の一貫性のため全章で同一に保つ。
- スライド関数の中では、生の pptxgenjs 描画（`addShape`/`addText`/`addTable`/`addImage` など）や章固有ヘルパーの追加を自由に使ってよい。テンプレのヘルパーは定型を短く書くための土台であり、表現の制約ではない。内容に適した情報設計を優先する。
- デザインの基準は `docs/template/design-template.md` に従う。

生成手順（章の `slides.md` 確定後）:

```powershell
node docs/sections/<chapter>/generate-opus.js
Copy-Item docs/sections/<chapter>/slides.md docs/sections/<chapter>/v1/v1-slides.md -Force
pwsh -File docs/sections/<chapter>/render-opus.ps1
```

Use this layout:

```text
<chapter>/
  slides.md
  v1/
    v1-slides.md
    v1-<deck-name>.pdf
    v1-<deck-name>.pptx
  v2/
    v2-slides.md
    v2-<deck-name>.pdf
    v2-<deck-name>.pptx
```

For a revision, update the chapter-level `slides.md`, then create a new version directory. Preserve all existing version directories and their contents unchanged.