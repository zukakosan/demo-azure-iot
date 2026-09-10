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