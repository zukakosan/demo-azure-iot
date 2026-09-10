// 第7章スライド: slides.md を素材に、pptxgenjs でネイティブ図形として生成する。
// 第4・5章 (generate-opus.js) と同じデザイン言語・ヘルパーを踏襲する。
const pptxgen = require("pptxgenjs");

const P = {
  ink: "16232E",
  primary: "0B4C8C",   // 深い Azure ブルー（ドミナント）
  teal: "1470C4",      // 中間の Azure ブルー（リード文・矢印・アクセント）
  cyan: "4FA3E3",      // 明るいアズール（表紙アクセント）
  amber: "E0873A",     // 温色アクセント（注意・強調に限定）
  green: "2E7D57",     // 必須以外の分類・肯定に限定
  muted: "5E6B74",
  line: "D6E1EC",
  soft: "EAF2FB",
  softer: "F4F9FE",
  white: "FFFFFF",
};
const JP = "Yu Gothic UI";
const MONO = "Consolas";
const MX = 0.62;
const CW = 13.33 - MX * 2;
const RIGHT = 13.33 - MX;

const pptx = new pptxgen();
pptx.defineLayout({ name: "W", width: 13.33, height: 7.5 });
pptx.layout = "W";
pptx.author = "Azure IoT Workshop";
pptx.title = "第7章 非機能要件と本番化ベストプラクティス";

const S = { rect: "rect", roundRect: "roundRect", line: "line", oval: "ellipse" };

// ---- 共通パーツ ----------------------------------------------------------
function footer(slide, n) {
  slide.addShape(S.line, { x: MX, y: 7.02, w: CW, h: 0, line: { color: P.line, width: 1 } });
  slide.addText("第7章  非機能要件と本番化 — 優先度・DPS・監視・本番判定", {
    x: MX, y: 7.06, w: 9.5, h: 0.3, fontFace: JP, fontSize: 9, color: P.muted, margin: 0, valign: "middle",
  });
  slide.addText(String(n), {
    x: RIGHT - 0.6, y: 7.06, w: 0.6, h: 0.3, fontFace: JP, fontSize: 10, color: P.muted, align: "right", margin: 0, valign: "middle",
  });
}

function header(slide, no, kicker, title) {
  slide.background = { color: P.white };
  slide.addShape(S.rect, { x: MX, y: 0.5, w: 0.62, h: 0.62, fill: { color: P.primary }, line: { type: "none" } });
  slide.addText(no, { x: MX, y: 0.5, w: 0.62, h: 0.62, fontFace: JP, fontSize: 16, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
  slide.addText(kicker.toUpperCase(), { x: MX + 0.82, y: 0.46, w: 9, h: 0.24, fontFace: JP, fontSize: 11, bold: true, color: P.cyan, charSpacing: 2, margin: 0, valign: "middle" });
  slide.addText(title, { x: MX + 0.82, y: 0.68, w: CW - 0.9, h: 0.5, fontFace: JP, fontSize: 23, bold: true, color: P.primary, margin: 0, valign: "middle" });
  slide.addShape(S.line, { x: MX, y: 1.42, w: CW, h: 0, line: { color: P.line, width: 1.25 } });
}

function lead(slide, text, y = 1.62) {
  slide.addText(text, { x: MX, y, w: CW, h: 0.4, fontFace: JP, fontSize: 15, bold: true, color: P.teal, margin: 0, valign: "middle" });
}

// 出典は各 URL を 1 行ずつ縦に並べ、下端をフッター直上へ揃える。
function sources(slide, arr) {
  if (!arr || !arr.length) return;
  const lineH = 0.16;
  const startY = 6.98 - arr.length * lineH;
  arr.forEach((u, i) => {
    slide.addText([
      { text: `[${i + 1}] `, options: { color: P.muted, bold: true } },
      { text: u, options: { color: P.muted, hyperlink: { url: u } } },
    ], { x: MX, y: startY + i * lineH, w: CW, h: lineH, fontFace: JP, fontSize: 8, margin: 0, valign: "middle" });
  });
}

// 社内資料など URL の無い出典。
function noteSource(slide, text, y = 6.66) {
  slide.addText(text, { x: MX, y, w: CW, h: 0.3, fontFace: JP, fontSize: 9, italic: true, color: P.muted, margin: 0, valign: "middle" });
}

function callout(slide, text, y, w = CW, x = MX, color = P.amber) {
  const h = 0.62;
  slide.addShape(S.rect, { x, y, w, h, fill: { color: P.soft }, line: { type: "none" } });
  slide.addShape(S.rect, { x, y, w: 0.09, h, fill: { color }, line: { type: "none" } });
  slide.addText(text, { x: x + 0.24, y, w: w - 0.4, h, fontFace: JP, fontSize: 12.5, bold: true, color: P.ink, margin: 0, valign: "middle" });
  return y + h;
}

function tableAt(slide, head, rows, y, opts = {}) {
  const colW = opts.colW;
  const body = [];
  body.push(head.map((h) => ({ text: h, options: { fill: { color: P.primary }, color: P.white, bold: true, fontFace: JP, fontSize: opts.hsize || 12.5, align: "left", valign: "middle" } })));
  rows.forEach((r, ri) => {
    body.push(r.map((c, ci) => ({
      text: c,
      options: {
        fill: { color: ri % 2 ? P.softer : P.white },
        color: ci === 0 ? P.primary : P.ink,
        bold: ci === 0,
        fontFace: JP, fontSize: opts.size || 12, align: "left", valign: "middle",
      },
    })));
  });
  slide.addTable(body, {
    x: MX, y, w: CW, colW, rowH: opts.rowH || 0.42,
    border: { pt: 0.75, color: P.line }, margin: [3, 6, 3, 6], valign: "middle", autoPage: false,
  });
}

function codeBox(slide, code, x, y, w, h) {
  slide.addShape(S.rect, { x, y, w, h, fill: { color: "0A2A44" }, line: { type: "none" } });
  slide.addText(code, { x: x + 0.16, y: y + 0.08, w: w - 0.3, h: h - 0.16, fontFace: MONO, fontSize: 12.5, color: "DCEBFA", margin: 0, valign: "middle" });
}

function connect(slide, x1, y1, x2, y2, opts = {}) {
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
  const down = y2 >= y1;
  slide.addShape(S.line, {
    x, y, w, h, flipV: !down,
    line: { color: opts.color || P.teal, width: opts.width || 2, endArrowType: opts.arrow === false ? "none" : "triangle" },
  });
}

function node(slide, x, y, w, h, title, sub, opts = {}) {
  const border = opts.border || P.teal;
  slide.addShape(S.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: opts.fill || P.softer }, line: { color: border, width: opts.lw || 1.25 } });
  const ty = sub ? y + 0.08 : y;
  const th = sub ? 0.32 : h;
  slide.addText(title, { x: x + 0.1, y: ty, w: w - 0.2, h: th, fontFace: JP, fontSize: opts.size || 12.5, bold: true, color: opts.color || P.primary, align: "center", valign: "middle", margin: 0 });
  if (sub) slide.addText(sub, { x: x + 0.1, y: y + 0.34, w: w - 0.2, h: h - 0.4, fontFace: JP, fontSize: opts.subSize || 10, color: P.muted, align: "center", valign: "top", margin: 0 });
}

function bullets(slide, items, y, opts = {}) {
  const runs = items.map((t) => ({
    text: t,
    options: { bullet: { code: "2022", indent: 14 }, fontFace: JP, fontSize: opts.size || 12.5, color: P.ink, paraSpaceAfter: opts.gap != null ? opts.gap : 8, breakLine: true },
  }));
  slide.addText(runs, { x: MX + 0.05, y, w: CW - 0.1, h: opts.h || 1.6, valign: "top", margin: 0 });
}

// ---- 表紙 ----------------------------------------------------------------
function cover() {
  const s = pptx.addSlide();
  s.background = { color: P.primary };
  s.addShape(S.rect, { x: 0, y: 0, w: 13.33, h: 0.16, fill: { color: P.cyan }, line: { type: "none" } });
  s.addText("第 7 章", { x: 0.9, y: 1.5, w: 6, h: 0.5, fontFace: JP, fontSize: 18, bold: true, color: P.cyan, charSpacing: 3, margin: 0 });
  s.addText("非機能要件と本番化ベストプラクティス", { x: 0.9, y: 2.05, w: 11.6, h: 1.2, fontFace: JP, fontSize: 40, bold: true, color: P.white, margin: 0 });
  s.addText("デモ構成を本番へ移す前に、セキュリティ・信頼性・性能・運用・コストで決めることを整理する", {
    x: 0.9, y: 3.28, w: 11.6, h: 0.5, fontFace: JP, fontSize: 16, color: "BFE6EC", margin: 0,
  });
  s.addShape(S.line, { x: 0.92, y: 3.98, w: 3.2, h: 0, line: { color: P.cyan, width: 2.5 } });
  const items = ["優先度の考え方", "資格情報とアクセス", "DPS と大規模展開", "監視と本番判定"];
  let cx = 0.9;
  items.forEach((t) => {
    const w = 0.5 + t.length * 0.2;
    s.addShape(S.roundRect, { x: cx, y: 4.38, w, h: 0.5, rectRadius: 0.25, fill: { color: "12508C" }, line: { color: P.cyan, width: 1 } });
    s.addText(t, { x: cx, y: 4.38, w, h: 0.5, fontFace: JP, fontSize: 13, color: P.white, align: "center", valign: "middle", margin: 0 });
    cx += w + 0.25;
  });
  s.addText("Azure IoT ワークショップ ／ 本編 16 分・12 枚", {
    x: 0.9, y: 6.5, w: 11, h: 0.4, fontFace: JP, fontSize: 12, color: "9FC7D1", margin: 0,
  });
}

// ---- 07-01 非機能要件は本番リスクから優先する --------------------------
function s01() {
  const s = pptx.addSlide(); header(s, "01", "優先度の考え方", "非機能要件は本番リスクから優先する");
  lead(s, "非機能要件は、未定義のまま本番へ進んだときの影響から優先する。");
  // 左: 3段階の階段バー
  const bars = [
    ["必須", "本番移行前に決定・検証する。侵害・データ損失・長時間停止・復旧不能に直結", P.primary],
    ["推奨", "初期リリース時点で方針を決める。検知・調査・スケール・コスト管理に影響", P.teal],
    ["発展", "規模拡大に備えて計画する。複数拠点・標準化・継続的な改善に効く", P.cyan],
  ];
  const bx = MX, bw = 7.2, bh = 0.92, top = 2.15, gap = 0.28;
  bars.forEach((b, i) => {
    const y = top + i * (bh + gap);
    const ind = i * 0.5;
    s.addShape(S.roundRect, { x: bx + ind, y, w: bw - ind, h: bh, rectRadius: 0.06, fill: { color: b[2] }, line: { type: "none" } });
    s.addText(b[0], { x: bx + ind + 0.16, y: y + 0.12, w: 1.5, h: bh - 0.24, fontFace: JP, fontSize: 18, bold: true, color: P.white, valign: "middle", margin: 0 });
    s.addText(b[1], { x: bx + ind + 1.6, y: y + 0.1, w: bw - ind - 1.75, h: bh - 0.2, fontFace: JP, fontSize: 11.5, color: P.white, valign: "middle", margin: 0 });
  });
  // 右: Well-Architected Framework の 5 つの柱
  const px = 8.15, pw = RIGHT - 8.15, py = 2.15, ph = 3.44;
  s.addShape(S.roundRect, { x: px, y: py, w: pw, h: ph, rectRadius: 0.08, fill: { color: P.softer }, line: { color: P.line, width: 1.25 } });
  s.addShape(S.rect, { x: px, y: py, w: pw, h: 0.5, fill: { color: P.primary }, line: { type: "none" } });
  s.addText("Well-Architected Framework の5つの柱", { x: px, y: py, w: pw, h: 0.5, fontFace: JP, fontSize: 12, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
  const pillars = ["信頼性", "セキュリティ", "コスト最適化", "オペレーショナル エクセレンス", "パフォーマンス効率"];
  pillars.forEach((t, i) => {
    const y = py + 0.66 + i * 0.53;
    s.addShape(S.oval, { x: px + 0.28, y: y + 0.06, w: 0.14, h: 0.14, fill: { color: P.teal }, line: { type: "none" } });
    s.addText(t, { x: px + 0.56, y, w: pw - 0.7, h: 0.3, fontFace: JP, fontSize: 12, color: P.ink, valign: "middle", margin: 0 });
  });
  callout(s, "重要度は公式ラベルではなく、本番リスクに基づく判断ガイド。目標値・判断基準・責任者・確認方法まで定義する。", 5.85);
  sources(s, ["https://learn.microsoft.com/ja-jp/azure/well-architected/what-is-well-architected-framework"]);
  footer(s, 2);
}

// ---- 07-02 本番前に測定可能な目標を決める ------------------------------
function s02() {
  const s = pptx.addSlide(); header(s, "02", "測定可能な目標", "本番前に測定可能な目標を決める");
  lead(s, "サービスを選ぶ前に、業務影響から測定可能な目標と責任者を決める。");
  tableAt(s, ["観点", "要件として決める例", "設計・運用へ反映する項目"], [
    ["セキュリティ", "侵害時に対象デバイスを何分で無効化するか", "認証方式、失効手順、RBAC、ネットワーク制御"],
    ["信頼性・データ", "許容停止時間と許容データ損失量", "SLO、RTO、RPO、バッファ、再送、保持・削除"],
    ["性能・拡張性", "台数、送信頻度、サイズ、ピーク遅延", "SKU、ユニット数、クォータ、負荷試験"],
    ["運用・コスト", "検知時間、復旧時間、月額上限", "メトリック、アラート、Runbook、予算"],
  ], 2.1, { colW: [2.3, 4.7, 5.09], rowH: 0.56, size: 11.5 });
  // 下部: SLO の対象範囲（エンドツーエンド経路）
  s.addText("SLO の対象範囲", { x: MX, y: 4.95, w: 3, h: 0.28, fontFace: JP, fontSize: 11.5, bold: true, color: P.teal, margin: 0, valign: "middle" });
  const path = ["デバイス", "ネットワーク", "IoT Hub", "配送先", "業務処理"];
  const pw = 2.1, gap = (CW - pw * path.length) / (path.length - 1), py = 5.25, ph = 0.5;
  path.forEach((t, i) => {
    const x = MX + i * (pw + gap);
    node(s, x, py, pw, ph, t, null, { border: P.line, color: P.ink, size: 11.5 });
    if (i < path.length - 1) connect(s, x + pw, py + ph / 2, x + pw + gap, py + ph / 2, { color: P.teal });
  });
  callout(s, "IoT Hub の SLA を、そのままシステム全体の SLO にはしない。デバイスから業務処理までを対象にする。", 5.95);
  sources(s, ["https://learn.microsoft.com/ja-jp/azure/reliability/reliability-iot-hub"]);
  footer(s, 3);
}

// ---- 07-03 デバイス資格情報を製造から廃棄まで管理する ------------------
function s03() {
  const s = pptx.addSlide(); header(s, "03", "資格情報のライフサイクル", "デバイス資格情報を製造から廃棄まで管理する");
  lead(s, "デバイスごとに一意の ID と資格情報を割り当て、共有資格情報を使い回さない。");
  const stages = [
    ["製造・初期設定", "誰が発行し、安全な領域へ格納するか"],
    ["配送・設置", "機器との対応確認と漏えい防止"],
    ["運用・更新", "更新・ローテーションと失敗時の復旧"],
    ["侵害・交換・廃棄", "対象だけ無効化し、再登録を防止"],
  ];
  const n = stages.length, sw = 2.72, sh = 1.02, gap = (CW - sw * n) / (n - 1), sy = 2.15;
  stages.forEach((st, i) => {
    const x = MX + i * (sw + gap);
    node(s, x, sy, sw, sh, st[0], st[1], { border: i === n - 1 ? P.amber : P.teal, size: 12.5, subSize: 10 });
    if (i < n - 1) connect(s, x + sw, sy + sh / 2, x + sw + gap, sy + sh / 2, { color: P.teal });
  });
  bullets(s, [
    "認証方式は、脅威モデル・デバイス性能・製造工程・更新可能性から選ぶ",
    "本番では X.509 証明書や TPM で秘密鍵をハードウェア保護する[2]",
    "ファームウェア更新は、署名検証・セキュアブート・失敗時のロールバックを設計する",
  ], 3.55, { size: 12.5, gap: 9, h: 1.7 });
  callout(s, "認証方式の選択と、資格情報を運び続ける運用手順はセットで決める。廃棄時は DPS の Enrollment と IoT Hub のデバイス ID の両方を扱う。", 5.7);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/secure-azure-iot-hub",
    "https://learn.microsoft.com/ja-jp/azure/iot-dps/concepts-service#attestation-mechanism",
  ]);
  footer(s, 4);
}

// ---- 07-04 配送先の権限とネットワーク到達性を分ける --------------------
function s04() {
  const s = pptx.addSlide(); header(s, "04", "認証・認可・ネットワーク", "ルーティング先への到達性は3つの層で確認する");
  lead(s, "デバイスが IoT Hub に送信できても、IoT Hub が Storage に書き込めるとは限らない。");
  // Portal 操作者（別主体）
  s.addShape(S.roundRect, { x: MX, y: 2.05, w: 4.4, h: 0.44, rectRadius: 0.06, fill: { color: P.white }, line: { color: P.muted, width: 1, dashType: "dash" } });
  s.addText("Portal 操作者（設定変更の権限は配送権限とは別）", { x: MX, y: 2.05, w: 4.4, h: 0.44, fontFace: JP, fontSize: 10.5, color: P.muted, align: "center", valign: "middle", margin: 0 });
  // IoT Hub → 認証 → 認可 → ネットワーク → Storage
  const ry = 2.75, rh = 1.1;
  const boxes = [
    ["IoT Hub", null, 2.0, P.primary, P.white],
    ["認証", "使用するマネージド ID はどれか", 2.35, P.teal, null],
    ["認可", "Blob Data Contributor を対象範囲で付与[1]", 2.55, P.teal, null],
    ["ネットワーク", "送信接続を許可する構成か[2]", 2.45, P.amber, null],
    ["Storage", null, 2.0, P.primary, P.white],
  ];
  let x = MX;
  const totalGap = CW - boxes.reduce((a, b) => a + b[2], 0);
  const gap = totalGap / (boxes.length - 1);
  boxes.forEach((b, i) => {
    const w = b[2];
    if (b[4]) {
      s.addShape(S.roundRect, { x, y: ry, w, h: rh, rectRadius: 0.08, fill: { color: b[3] }, line: { type: "none" } });
      s.addText(b[0], { x, y: ry, w, h: rh, fontFace: JP, fontSize: 15, bold: true, color: b[4], align: "center", valign: "middle", margin: 0 });
    } else {
      node(s, x, ry, w, rh, b[0], b[1], { border: b[3], size: 13, subSize: 10 });
    }
    if (i < boxes.length - 1) connect(s, x + w, ry + rh / 2, x + w + gap, ry + rh / 2, { color: P.teal });
    x += w + gap;
  });
  bullets(s, [
    "Portal 操作者の権限と、IoT Hub が配送に使う権限は別に確認する",
    "マネージド ID にロールを付与しても、ネットワーク制限は解除されない[2]",
    "IoT Hub の Private Endpoint は接続する側の入口で、直接配送を VNet 経由に変える機能ではない[2]",
  ], 4.15, { size: 12, gap: 7, h: 1.5 });
  callout(s, "権限エラーに見えても、主体・ロール・対象範囲・ネットワークの順に切り分ける。", 5.85);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-managed-identity#configure-message-routing-with-managed-identities",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/virtual-network-support#egress-connectivity-from-iot-hub-to-other-azure-resources",
  ]);
  footer(s, 5);
}

// ---- 07-05 入口と出口でネットワーク経路を分ける ------------------------
function sNet() {
  const s = pptx.addSlide(); header(s, "05", "ネットワーク経路", "入口と出口でネットワーク経路を分ける");
  lead(s, "IoT Hub を中心に、手前のデバイス側が入口、その先の配送先側が出口。それぞれ公開経路と閉域経路を分けて決める。");
  const head = ["通信", "公開エンドポイント経由", "閉域（VNet / Private Endpoint）経由"];
  const rows = [
    ["デバイス → IoT Hub", "インターネットから IoT Hub の公開エンドポイントへ接続。広域に分散したデバイスの基本構成[1]", "オンプレミス → VPN / ExpressRoute → VNet（自社専用のネットワーク区画）の Private Endpoint（Hub 専用の非公開の入口）へ接続。公開ネットワークアクセスは無効化できる[1]"],
    ["IoT Hub → 配送先\n(Storage / Event Hubs / Service Bus)", "直接ルーティングは配送先の公開エンドポイントを使用。制限時は「信頼された Microsoft サービスの例外」（配送先が Hub からの接続を許可する設定）とマネージド ID を併用[2]", "直接ルーティングを VNet 経由へ変更することはできない。VNet 内の受信アプリ（自分で用意する中継アプリ）が組み込みエンドポイント[1]から読み、配送先の Private Endpoint へ書き込む[2]"],
  ];
  const body = [head.map((h) => ({ text: h, options: { fill: { color: P.primary }, color: P.white, bold: true, fontFace: JP, fontSize: 11.5, align: "left", valign: "middle" } }))];
  rows.forEach((r, ri) => {
    body.push(r.map((c, ci) => ({
      text: c,
      options: { fill: { color: ri % 2 ? P.softer : P.white }, color: ci === 0 ? P.primary : P.ink, bold: ci === 0, fontFace: JP, fontSize: 10.5, align: "left", valign: "middle" },
    })));
  });
  s.addTable(body, { x: MX, y: 2.05, w: CW, colW: [2.55, 4.77, 4.77], rowH: [0.5, 1.15, 1.4], border: { pt: 0.75, color: P.line }, margin: [3, 6, 3, 6], valign: "middle", autoPage: false });
  bullets(s, [
    "「バックボーン経由か VNet 経由か」は二者択一ではない。Private Link も通信は Azure バックボーンを経由する[3]",
    "デバイス側の Private Endpoint はオンプレミス内のデバイス向けで、広域に分散したデバイスには推奨されない[1]",
  ], 5.16, { size: 11.5, gap: 6, h: 0.6 });
  callout(s, "IoT Hub の Private Endpoint は Hub への入口を閉じる設定で、Hub から配送先へ出る接続には効かない。作っても直接ルーティングまで閉域化されるわけではない。[1][2]", 5.82);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/virtual-network-support#ingress-connectivity-to-iot-hub-using-azure-private-link",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/virtual-network-support#egress-connectivity-from-iot-hub-to-other-azure-resources",
    "https://learn.microsoft.com/ja-jp/azure/private-link/private-link-overview",
  ]);
  footer(s, 6);
}

// ---- 07-06 IoT Hub の信頼性を障害の粒度で備える ------------------------
function sReli() {
  const s = pptx.addSlide(); header(s, "06", "IoT Hub の信頼性", "IoT Hub の信頼性を一時障害・ゾーン・リージョンで備える");
  lead(s, "信頼性は共有責任。障害の粒度ごとに、IoT Hub が自動でやることと利用者が備えることを分ける。");
  const head = ["障害の粒度", "IoT Hub 側の仕組み", "利用者側で行うこと"];
  const rows = [
    ["一時的な障害\n（短時間・断続的）", "高可用だが、分散環境では短時間の障害が起こり得る", "リトライ（指数バックオフ＋ジッター）と再接続ロジックを実装[2]"],
    ["可用性ゾーン障害", "対応リージョンはゾーン冗長を自動適用。データ損失なし・追加コストなし・正常ゾーンへ自動再ルーティング[1]", "ゾーン冗長に対応したリージョンにデプロイ。処理中の要求はリトライで復旧[1]"],
    ["リージョン障害", "単一リージョンサービス。ペアリージョンへ非同期レプリケーション（DR）[1]", "デバイス接続の自動リージョンフェールオーバーは無い。必要なら多リージョン戦略を設計[1]"],
  ];
  const body = [head.map((h) => ({ text: h, options: { fill: { color: P.primary }, color: P.white, bold: true, fontFace: JP, fontSize: 11.5, align: "left", valign: "middle" } }))];
  const rowColors = [P.softer, P.white, P.softer];
  rows.forEach((r, ri) => {
    body.push(r.map((c, ci) => ({
      text: c,
      options: { fill: { color: rowColors[ri] }, color: ci === 0 ? P.primary : P.ink, bold: ci === 0, fontFace: JP, fontSize: 10.5, align: "left", valign: "middle" },
    })));
  });
  s.addTable(body, { x: MX, y: 2.05, w: CW, colW: [2.75, 4.67, 4.67], rowH: [0.5, 0.88, 0.9, 0.9], border: { pt: 0.75, color: P.line }, margin: [3, 6, 3, 6], valign: "middle", autoPage: false });
  bullets(s, [
    "ゾーン・リージョン障害とも、処理中の要求は失われ得る。復旧はデバイス側のリトライが前提[1]",
    "リージョン フェールオーバー後も FQDN（接続文字列）は不変だが IP は変わる。IP をキャッシュしない[1]",
  ], 5.28, { size: 11, gap: 6, h: 0.54 });
  callout(s, "規模に関わらず、一時的な障害へのリトライ実装が信頼性の出発点。ゾーンは対応リージョン選択、リージョンは DR 設計で備える。", 5.86);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/reliability/reliability-iot-hub",
    "https://learn.microsoft.com/ja-jp/azure/iot/concepts-manage-device-reconnections#retry-patterns",
  ]);
  footer(s, 7);
}

// ---- 07-07 DPS の仕組みとメリット ------------------------------------
function s05() {
  const s = pptx.addSlide(); header(s, "07", "DPS の仕組みとメリット", "DPS で初回登録と接続先割り当てを自動化する");
  lead(s, "DPS は、デバイスを認証して接続先 IoT Hub を割り当てる、初回登録の自動化サービス。");
  // 初回登録フロー
  const fy = 2.15, fh = 0.7;
  const steps = ["デバイス", "DPS で認証・Enrollment 照合・割り当て決定", "IoT Hub へ登録", "IoT Hub へ直接接続"];
  const sw = [1.9, 4.3, 2.5, 2.99];
  let x = MX;
  const fgap = (CW - sw.reduce((a, b) => a + b, 0)) / (steps.length - 1);
  steps.forEach((t, i) => {
    node(s, x, fy, sw[i], fh, t, null, { border: i === steps.length - 1 ? P.primary : P.teal, size: 10.5, fill: i === steps.length - 1 ? P.soft : P.softer });
    if (i < steps.length - 1) connect(s, x + sw[i], fy + fh / 2, x + sw[i] + fgap, fy + fh / 2, { color: P.teal });
    x += sw[i] + fgap;
  });
  s.addText("通常のテレメトリは DPS を経由せず、デバイスと IoT Hub が直接やり取りする", { x: MX, y: fy + fh + 0.04, w: CW, h: 0.24, fontFace: JP, fontSize: 10.5, italic: true, color: P.muted, align: "right", margin: 0 });

  // 下段: 左=工場出荷時の初期設定（DPS の情報＋資格情報）、右=メリット
  const py = 3.28, ph = 2.34;
  const lw = 5.0, rx = MX + lw + 0.35, rw = RIGHT - rx;
  s.addShape(S.roundRect, { x: MX, y: py, w: lw, h: ph, rectRadius: 0.08, fill: { color: P.softer }, line: { color: P.teal, width: 1.25 } });
  s.addShape(S.rect, { x: MX, y: py, w: lw, h: 0.44, fill: { color: P.primary }, line: { type: "none" } });
  s.addText("工場出荷時の初期設定（手動登録の代わりに用意）", { x: MX, y: py, w: lw, h: 0.44, fontFace: JP, fontSize: 12, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
  node(s, MX + 0.22, py + 0.6, lw - 0.44, 0.72, "① DPS の接続情報", "ID スコープ / グローバル エンドポイント / 登録 ID", { border: P.teal, size: 12.5, subSize: 10.5, fill: P.white });
  node(s, MX + 0.22, py + 1.48, lw - 0.44, 0.72, "② 資格情報", "認証方式に応じて X.509 証明書 / TPM / 対称キー", { border: P.teal, size: 12.5, subSize: 10.5, fill: P.white });
  s.addShape(S.roundRect, { x: rx, y: py, w: rw, h: ph, rectRadius: 0.08, fill: { color: P.softer }, line: { color: P.line, width: 1.25 } });
  s.addShape(S.rect, { x: rx, y: py, w: rw, h: 0.44, fill: { color: P.teal }, line: { type: "none" } });
  s.addText("手動登録との違い（メリット）", { x: rx, y: py, w: rw, h: 0.44, fontFace: JP, fontSize: 12, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
  const merits = [
    "手動登録が不要: 工場出荷時の設定だけで現地で自動接続",
    "接続先を固定しない: 出荷後に割り当て先 Hub を決定・変更",
    "多数台・多拠点に強い: 複数 Hub への割り当てを一元管理",
    "割り当ての自動化: ポリシーで負荷分散や地理的な割り当て",
  ];
  const mruns = merits.map((t) => ({ text: t, options: { bullet: { code: "2022", indent: 14 }, fontFace: JP, fontSize: 11.5, color: P.ink, paraSpaceAfter: 10, breakLine: true } }));
  s.addText(mruns, { x: rx + 0.25, y: py + 0.6, w: rw - 0.45, h: ph - 0.75, valign: "top", margin: 0 });

  callout(s, "Enrollment は登録を許可するための事前設定で、IoT Hub のデバイス ID とは別。", 5.78);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-dps/about-iot-dps#how-device-provisioning-service-works",
    "https://learn.microsoft.com/ja-jp/azure/iot-dps/concepts-service#enrollment",
  ]);
  footer(s, 8);
}

// ---- 07-08 登録方式の使い分け ----------------------------------------
function sMethods() {
  const s = pptx.addSlide(); header(s, "08", "登録方式の使い分け", "直接登録・個別登録・グループ登録を選ぶ");
  lead(s, "台数と接続先の要件から、IoT Hub への直接登録と DPS の登録方式を選ぶ。");
  tableAt(s, ["方式", "クラウド側の事前準備", "向いている例"], [
    ["IoT Hub へ直接登録", "接続先 Hub にデバイス ID を登録", "少数台で接続先が固定される検証"],
    ["DPS の個別登録", "DPS にデバイスごとの Enrollment を作成", "出荷先決定後に Hub を割り当てる機器"],
    ["DPS のグループ登録", "共通の認証方式に基づく Enrollment Group を作成", "同じ管理単位に属する多数デバイス"],
  ], 2.2, { colW: [2.9, 5.1, 4.09], rowH: 0.56, size: 12 });
  bullets(s, [
    "個別登録でも、デバイスの本人確認と接続先 IoT Hub の決定を分離できる[1]",
    "グループ登録でも各デバイスの資格情報は必要で、秘密情報の使い回しではない[2]",
    "設定変更だけでは接続中デバイスは移動せず、デバイスからの再プロビジョニング要求が必要[3]",
  ], 4.55, { size: 12, gap: 7, h: 1.2 });
  callout(s, "登録エントリの管理を集約することと、接続先をデバイスに固定しないことは、別々のメリットである。", 5.78);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-dps/concepts-service#enrollment",
    "https://learn.microsoft.com/ja-jp/azure/iot-dps/concepts-service#enrollment-group",
    "https://learn.microsoft.com/ja-jp/azure/iot-dps/concepts-device-reprovision#reprovisioning-policies",
  ]);
  footer(s, 9);
}

// ---- 07-09 再接続と再プロビジョニングを使い分ける ----------------------
function s07() {
  const s = pptx.addSlide(); header(s, "09", "再接続と再プロビジョニング", "再接続と再プロビジョニングを使い分ける");
  lead(s, "再起動や一時切断のたびに DPS へ戻らず、保存した割り当て情報で同じ IoT Hub への再接続を先に試す。");
  // メイン経路（強調）
  const my = 2.35, mh = 0.7;
  node(s, MX, my, 3.2, mh, "割り当て済み情報あり", null, { border: P.teal, size: 12 });
  connect(s, MX + 3.2, my + mh / 2, MX + 3.95, my + mh / 2, { color: P.teal, width: 2.5 });
  s.addText("ある", { x: MX + 3.2, y: my - 0.24, w: 0.75, h: 0.22, fontFace: JP, fontSize: 10, color: P.teal, align: "center", margin: 0 });
  node(s, MX + 3.95, my, 3.7, mh, "同じ IoT Hub へ直接再接続", null, { border: P.primary, size: 12, fill: P.soft, lw: 2 });
  connect(s, MX + 7.65, my + mh / 2, MX + 8.4, my + mh / 2, { color: P.teal, width: 2.5 });
  s.addText("成功", { x: MX + 7.65, y: my - 0.24, w: 0.75, h: 0.22, fontFace: JP, fontSize: 10, color: P.teal, align: "center", margin: 0 });
  node(s, MX + 8.4, my, CW - 8.4, mh, "通常通信を再開", null, { border: P.teal, size: 12 });
  // 分岐（DPS 経由）
  const by = 3.55;
  connect(s, MX + 1.6, my + mh, MX + 1.6, by, { color: P.muted });
  s.addText("なし", { x: MX + 1.7, y: (my + mh + by) / 2 - 0.12, w: 0.7, h: 0.22, fontFace: JP, fontSize: 10, color: P.muted, margin: 0 });
  node(s, MX, by, 3.2, 0.62, "DPS でプロビジョニング", null, { border: P.amber, size: 11.5 });
  connect(s, MX + 5.8, my + mh, MX + 5.8, by, { color: P.muted });
  s.addText("継続して失敗", { x: MX + 5.9, y: (my + mh + by) / 2 - 0.12, w: 1.5, h: 0.22, fontFace: JP, fontSize: 10, color: P.muted, margin: 0 });
  node(s, MX + 3.95, by, 3.7, 0.62, "DPS で再プロビジョニング", null, { border: P.amber, size: 11.5 });
  tableAt(s, ["処理", "目的", "代表的な場面"], [
    ["再接続", "以前に割り当てられた Hub へ戻る", "一時的な回線断、再起動、サービスの一時障害"],
    ["再プロビジョニング", "接続先の割り当てを確認・変更する", "Hub の移行、リージョン変更、工場出荷時リセット"],
  ], 4.45, { colW: [2.7, 4.2, 5.19], rowH: 0.52, size: 11.5 });
  callout(s, "429 は Retry-After、5xx はバックオフを使い、短時間の失敗だけで全台を DPS へ戻さない[1]。", 5.9);
  sources(s, ["https://learn.microsoft.com/ja-jp/azure/iot-dps/concepts-deploy-at-scale"]);
  footer(s, 10);
}

// ---- 07-10 信頼性・容量・監視をエンドツーエンドで設計する --------------
function s08() {
  const s = pptx.addSlide(); header(s, "10", "信頼性・容量・監視", "信頼性・容量・監視をエンドツーエンドで設計する");
  lead(s, "IoT Hub の稼働だけでなく、必要なデータが必要な時間内に業務処理まで届くかを監視する。");
  tableAt(s, ["観点", "本番前に決めること"], [
    ["切断・再送", "バックオフとジッター、デバイス側バッファ、重複判定、順序の扱い"],
    ["容量", "台数・頻度・サイズ・ピーク、操作別スロットリング、配送先の処理能力[1]"],
    ["監視", "接続数・認証エラー・スロットリング・ルーティング失敗・データ未着・DPS 登録率[2][3]"],
    ["対応", "重要度・通知先・一次対応者・Runbook・復旧/フェールオーバー演習"],
    ["コスト", "Hub ユニット・保存期間・ログ量・通信量・1台/1拠点当たりの目標原価"],
  ], 2.1, { colW: [2.4, 9.69], rowH: 0.48, size: 11.5 });
  s.addText("1 Hub の上限を超える規模は複数 Hub へ分割し DPS で割り当てる。Twin・Direct Method・C2D を使う構成は Standard を選ぶ[1]。", {
    x: MX, y: 5.05, w: CW, h: 0.3, fontFace: JP, fontSize: 11, color: P.muted, margin: 0, valign: "middle",
  });
  callout(s, "技術メトリックと「一定時間データが来ない」という業務視点のアラートを組み合わせる。", 5.45);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-scaling",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/monitor-iot-hub",
    "https://learn.microsoft.com/ja-jp/azure/iot-dps/concepts-deploy-at-scale",
  ]);
  footer(s, 11);
}

// ---- 07-11 ケーススタディから責任分界を読み解く ------------------------
function s09() {
  const s = pptx.addSlide(); header(s, "11", "ケーススタディ", "ケーススタディから責任分界を読み解く");
  lead(s, "事例の構成をそのまま採用せず、自分の要件に照らして設計判断を読み解く。");

  const ext = P.green;
  // Azure サービス（青）／外部システム（緑）の塗り箱
  function svc(x, y, w, h, label, fill = P.primary, color = P.white, size = 10.5) {
    s.addShape(S.roundRect, { x, y, w, h, rectRadius: 0.05, fill: { color: fill }, line: { type: "none" } });
    s.addText(label, { x: x + 0.06, y, w: w - 0.12, h, fontFace: JP, fontSize: size, bold: true, color, align: "center", valign: "middle", margin: 0 });
  }

  // 車両 → Protocol Gateway
  svc(MX, 2.95, 0.95, 0.6, "車両", "222B33", P.white, 11);
  connect(s, MX + 0.95, 3.25, 1.75, 3.25, { color: P.teal });
  svc(1.75, 2.9, 1.7, 0.7, "Protocol Gateway");
  // ブランド別 IoT Hub（接続先の分離）
  svc(3.7, 2.35, 1.75, 0.62, "IoT Hub（ブランドA）");
  svc(3.7, 3.55, 1.75, 0.62, "IoT Hub（ブランドB）");
  connect(s, 3.45, 3.15, 3.7, 2.66, { color: P.teal });
  connect(s, 3.45, 3.35, 3.7, 3.86, { color: P.teal });
  // Service Bus（High / Normal）
  connect(s, 5.45, 2.66, 5.75, 2.66, { color: P.teal });
  s.addShape(S.roundRect, { x: 5.75, y: 2.1, w: 1.95, h: 1.15, rectRadius: 0.06, fill: { color: P.softer }, line: { color: P.teal, width: 1.25 } });
  s.addText("Service Bus", { x: 5.75, y: 2.16, w: 1.95, h: 0.28, fontFace: JP, fontSize: 10.5, bold: true, color: P.primary, align: "center", margin: 0 });
  s.addShape(S.roundRect, { x: 5.95, y: 2.5, w: 1.55, h: 0.3, rectRadius: 0.15, fill: { color: P.amber }, line: { type: "none" } });
  s.addText("High", { x: 5.95, y: 2.5, w: 1.55, h: 0.3, fontFace: JP, fontSize: 10, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
  s.addShape(S.roundRect, { x: 5.95, y: 2.86, w: 1.55, h: 0.3, rectRadius: 0.15, fill: { color: P.teal }, line: { type: "none" } });
  s.addText("Normal", { x: 5.95, y: 2.86, w: 1.55, h: 0.3, fontFace: JP, fontSize: 10, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
  // Telemetry processor → Extensions → External Systems（責任分界）
  connect(s, 7.7, 2.66, 8.0, 2.66, { color: P.teal });
  svc(8.0, 2.35, 1.7, 0.62, "Telemetry\nprocessor", P.primary, P.white, 10);
  connect(s, 9.7, 2.66, 9.95, 2.66, { color: P.teal });
  svc(9.95, 2.35, 1.2, 0.62, "Extensions");
  connect(s, 11.15, 2.66, 11.4, 2.66, { color: P.teal });
  svc(11.4, 2.35, 1.31, 0.62, "External\nSystems", ext, P.white, 10);
  // ブランドB パススルー経路
  connect(s, 5.45, 3.86, 5.85, 4.2, { color: P.teal });
  svc(5.85, 3.9, 2.1, 0.6, "Passthrough Processor", P.primary, P.white, 10);
  connect(s, 7.95, 4.2, 8.3, 4.2, { color: P.teal });
  svc(8.3, 3.9, 2.5, 0.6, "外部システム", ext, P.white, 10);
  // 凡例
  s.addText("青 = Azure サービス ／ 緑 = 外部システム（原図を簡略化して作図）", { x: MX, y: 4.56, w: CW, h: 0.24, fontFace: JP, fontSize: 9.5, italic: true, color: P.muted, margin: 0 });

  // 図から読み解く3つの設計判断
  const cards = [
    ["接続先の分離", "ブランド・拠点など、どの単位で接続先と運用を分けるか"],
    ["優先度別の処理", "急ぐ経路と通常経路を分け、混雑時の処理時間をどう守るか"],
    ["責任分界", "どこまで到達で業務完了とし、誰が再処理・復旧を担うか"],
  ];
  const cw = (CW - 0.6) / 3, chh = 0.82, cy = 4.86;
  cards.forEach((c, i) => {
    const x = MX + i * (cw + 0.3);
    s.addShape(S.roundRect, { x, y: cy, w: cw, h: chh, rectRadius: 0.06, fill: { color: P.softer }, line: { color: P.teal, width: 1.25 } });
    s.addShape(S.rect, { x, y: cy, w: 0.09, h: chh, fill: { color: P.teal }, line: { type: "none" } });
    s.addText(c[0], { x: x + 0.22, y: cy + 0.05, w: cw - 0.34, h: 0.28, fontFace: JP, fontSize: 12, bold: true, color: P.primary, margin: 0, valign: "middle" });
    s.addText(c[1], { x: x + 0.22, y: cy + 0.33, w: cw - 0.34, h: chh - 0.4, fontFace: JP, fontSize: 10.5, color: P.ink, margin: 0, valign: "top" });
  });
  callout(s, "図だけでは、認証・ネットワーク・冗長化・再試行・重複対策・監視の実装状況は判断できない。事例構成であり共通の必須構成ではない。", 5.82, CW, MX, P.cyan);
  noteSource(s, "参考: 社内事例「IoT Readiness Refresher 2025 - Day 01」スライド11 を基に簡略化して作図（固有名詞は匿名化）", 6.6);
  footer(s, 12);
}

// ---- 07-12 本番移行判定チェックリスト ----------------------------------
function s10() {
  const s = pptx.addSlide(); header(s, "12", "本番移行判定", "本番移行判定チェックリスト");
  lead(s, "必須項目が未定義なら、機能デモが成功していても本番移行のリスクは高い。");
  const rows = [
    ["必須", "脅威モデルとデータ分類をレビューした"],
    ["必須", "デバイス固有 ID、資格情報の更新・失効、交換・廃棄の手順と責任者を決めた"],
    ["必須", "配送先の主体・権限・対象範囲・ネットワーク方式を承認済み構成で検証した"],
    ["必須", "エンドツーエンドの SLO・RTO・RPO と、再送・重複の扱いを合意した"],
    ["推奨", "平常時・ピーク・登録/再接続集中を含む容量試験を実施した"],
    ["推奨", "DPS・IoT Hub・配送先・業務処理の監視・アラート・Runbook を動作確認した"],
    ["推奨", "月額予算・データ/ログ保持・コストアラートを設定した"],
    ["発展", "Hub 分割・リージョン障害・復旧/フェールオーバーを演習した"],
  ];
  const colorOf = { "必須": P.primary, "推奨": P.teal, "発展": P.cyan };
  const body = [];
  body.push([
    { text: "重要度", options: { fill: { color: P.primary }, color: P.white, bold: true, fontFace: JP, fontSize: 12, align: "center", valign: "middle" } },
    { text: "本番移行前の確認", options: { fill: { color: P.primary }, color: P.white, bold: true, fontFace: JP, fontSize: 12, align: "left", valign: "middle" } },
  ]);
  rows.forEach((r, ri) => {
    body.push([
      { text: r[0], options: { fill: { color: colorOf[r[0]] }, color: P.white, bold: true, fontFace: JP, fontSize: 11.5, align: "center", valign: "middle" } },
      { text: r[1], options: { fill: { color: ri % 2 ? P.softer : P.white }, color: P.ink, fontFace: JP, fontSize: 11.5, align: "left", valign: "middle" } },
    ]);
  });
  s.addTable(body, { x: MX, y: 2.0, w: CW, colW: [1.5, CW - 1.5], rowH: 0.44, border: { pt: 0.75, color: P.line }, margin: [3, 6, 3, 6], valign: "middle", autoPage: false });
  callout(s, "確認: 目標値は測れるか。失敗時に誰が判断するか。実際の制約下で復旧まで試したか。次章で全体像と使い分けを振り返る。", 6.05, CW, MX, P.cyan);
  footer(s, 13);
}

cover();
s01(); s02(); s03(); s04(); sNet(); sReli(); s05(); sMethods(); s07(); s08(); s09(); s10();

pptx.writeFile({ fileName: "docs/sections/07-non-functional-requirements/v1/v1-07-non-functional-requirements.pptx" }).then((f) => console.log("written:", f));
