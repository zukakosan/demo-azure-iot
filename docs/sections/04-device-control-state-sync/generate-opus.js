// 第4章スライド: slides.md を素材に、pptxgenjs でネイティブ図形として生成する。
// 第3章 v3 (generate-opus.js) と同じデザイン言語・ヘルパーを踏襲する。
const pptxgen = require("pptxgenjs");

const P = {
  ink: "16232E",
  primary: "0B4C8C",   // 深い Azure ブルー（ドミナント）
  teal: "1470C4",      // 中間の Azure ブルー（リード文・矢印・アクセント）
  cyan: "4FA3E3",      // 明るいアズール（表紙アクセント）
  amber: "E0873A",     // 温色アクセント（注意・強調に限定）
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
pptx.title = "第4章 デバイスの制御と状態同期";

const S = { rect: "rect", roundRect: "roundRect", line: "line", oval: "ellipse" };

// ---- 共通パーツ ----------------------------------------------------------
function footer(slide, n) {
  slide.addShape(S.line, { x: MX, y: 7.02, w: CW, h: 0, line: { color: P.line, width: 1 } });
  slide.addText("第4章  デバイスの制御と状態同期 — Direct Method・Device Twin・C2D", {
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
  slide.addText(title, { x: MX + 0.82, y: 0.68, w: CW - 0.9, h: 0.5, fontFace: JP, fontSize: 24, bold: true, color: P.primary, margin: 0, valign: "middle" });
  slide.addShape(S.line, { x: MX, y: 1.42, w: CW, h: 0, line: { color: P.line, width: 1.25 } });
}

function lead(slide, text, y = 1.62) {
  slide.addText(text, { x: MX, y, w: CW, h: 0.4, fontFace: JP, fontSize: 15, bold: true, color: P.teal, margin: 0, valign: "middle" });
}

function sources(slide, arr) {
  if (!arr || !arr.length) return;
  const runs = [];
  arr.forEach((u, i) => {
    runs.push({ text: `[${i + 1}] `, options: { color: P.muted, bold: true } });
    runs.push({ text: u, options: { color: P.muted, hyperlink: { url: u } } });
    if (i < arr.length - 1) runs.push({ text: "   ", options: {} });
  });
  slide.addText(runs, { x: MX, y: 6.62, w: CW, h: 0.34, fontFace: JP, fontSize: 8, margin: 0, valign: "middle" });
}

function callout(slide, text, y, w = CW, x = MX, color = P.amber) {
  const h = 0.62;
  slide.addShape(S.rect, { x, y, w, h, fill: { color: P.soft }, line: { type: "none" } });
  slide.addShape(S.rect, { x, y, w: 0.09, h, fill: { color }, line: { type: "none" } });
  slide.addText(text, { x: x + 0.24, y, w: w - 0.4, h, fontFace: JP, fontSize: 13, bold: true, color: P.ink, margin: 0, valign: "middle" });
  return y + h;
}

function arrow(slide, x, y, w, label) {
  slide.addShape(S.line, { x, y, w, h: 0, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  if (label) slide.addText(label, { x: x - 0.1, y: y - 0.36, w: w + 0.2, h: 0.3, fontFace: JP, fontSize: 10, color: P.muted, align: "center", margin: 0, valign: "middle" });
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
  slide.addText(code, { x: x + 0.16, y: y + 0.08, w: w - 0.3, h: h - 0.16, fontFace: MONO, fontSize: 13, color: "DCEBFA", margin: 0, valign: "middle" });
}

// 目的シナリオカード（タイトル + 例 + 手段バッジ）
function scenarioCard(slide, x, y, w, h, title, ex, means, dot) {
  slide.addShape(S.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: P.softer }, line: { color: P.line, width: 1 } });
  slide.addShape(S.rect, { x, y, w, h: 0.5, fill: { color: P.primary }, line: { type: "none" } });
  slide.addText(title, { x: x + 0.18, y, w: w - 0.36, h: 0.5, fontFace: JP, fontSize: 13.5, bold: true, color: P.white, margin: 0, valign: "middle" });
  slide.addText(ex, { x: x + 0.2, y: y + 0.64, w: w - 0.4, h: 0.95, fontFace: JP, fontSize: 12.5, color: P.ink, margin: 0, valign: "top", lineSpacingMultiple: 1.05 });
  slide.addShape(S.roundRect, { x: x + 0.2, y: y + h - 0.6, w: w - 0.4, h: 0.42, rectRadius: 0.06, fill: { color: P.white }, line: { color: dot, width: 1.25 } });
  slide.addShape(S.oval, { x: x + 0.34, y: y + h - 0.6 + 0.16, w: 0.1, h: 0.1, fill: { color: dot }, line: { type: "none" } });
  slide.addText(means, { x: x + 0.52, y: y + h - 0.6, w: w - 0.7, h: 0.42, fontFace: JP, fontSize: 12.5, bold: true, color: P.primary, margin: 0, valign: "middle" });
}

// ---- 表紙 ----------------------------------------------------------------
function cover() {
  const s = pptx.addSlide();
  s.background = { color: P.primary };
  s.addShape(S.rect, { x: 0, y: 0, w: 13.33, h: 0.16, fill: { color: P.cyan }, line: { type: "none" } });
  s.addText("第 4 章", { x: 0.9, y: 1.5, w: 6, h: 0.5, fontFace: JP, fontSize: 18, bold: true, color: P.cyan, charSpacing: 3, margin: 0 });
  s.addText("デバイスの制御と状態同期", { x: 0.9, y: 2.05, w: 11.5, h: 1.2, fontFace: JP, fontSize: 44, bold: true, color: P.white, margin: 0 });
  s.addText("クラウドからデバイスへ働きかける手段を、用途とオフライン時の挙動で使い分ける", {
    x: 0.9, y: 3.25, w: 11.5, h: 0.5, fontFace: JP, fontSize: 17, color: "BFE6EC", margin: 0,
  });
  s.addShape(S.line, { x: 0.92, y: 3.95, w: 3.2, h: 0, line: { color: P.cyan, width: 2.5 } });
  const items = ["Direct Method", "Device Twin", "C2D メッセージ", "成功の確認"];
  let cx = 0.9;
  items.forEach((t) => {
    const w = 0.5 + t.length * 0.2;
    s.addShape(S.roundRect, { x: cx, y: 4.35, w, h: 0.5, rectRadius: 0.25, fill: { color: "12508C" }, line: { color: P.cyan, width: 1 } });
    s.addText(t, { x: cx, y: 4.35, w, h: 0.5, fontFace: JP, fontSize: 13, color: P.white, align: "center", valign: "middle", margin: 0 });
    cx += w + 0.25;
  });
  s.addText("Azure IoT ワークショップ ／ 本編 15 分・8 枚", {
    x: 0.9, y: 6.5, w: 11, h: 0.4, fontFace: JP, fontSize: 12, color: "9FC7D1", margin: 0,
  });
}

// ---- 04-01 3つの目的 -----------------------------------------------------
function s01() {
  const s = pptx.addSlide(); header(s, "01", "使い分けの軸", "クラウドからデバイスへ働きかける3つの目的");
  lead(s, "クラウドからデバイスへ働きかける操作は、目的とオフライン時の要件で使い分ける。");
  const y = 2.4, h = 2.85, w = 3.75, gap = (CW - w * 3) / 2;
  const x1 = MX, x2 = MX + w + gap, x3 = MX + (w + gap) * 2;
  scenarioCard(s, x1, y, w, h, "今すぐ操作したい", "ファンを今止め、結果を\nその場で確認する", "Direct Method", P.cyan);
  scenarioCard(s, x2, y, w, h, "設定を変えたい", "送信間隔を10秒に変え、\nその状態を保ちたい", "Device Twin", P.teal);
  scenarioCard(s, x3, y, w, h, "通知・依頼を届けたい", "メンテナンス予定や\n診断ログ依頼を届ける", "C2D メッセージ", P.amber);
  callout(s, "「今やって結果を教えて」は Direct Method、「この状態にしておいて」は Twin、「この通知・依頼を届けて」は C2D。", 5.55, CW, MX, P.cyan);
  sources(s, ["https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-c2d-guidance"]);
  footer(s, 2);
}

// ---- 04-02 使い分け ------------------------------------------------------
function s02() {
  const s = pptx.addSlide(); header(s, "02", "3手段の比較", "Direct Method・Device Twin・C2D の使い分け");
  lead(s, "同じ「クラウド→デバイス」でも、要求の形とオフライン時の扱いが異なる。");
  tableAt(s, ["方法", "主な用途", "オフライン時の扱い"], [
    ["Direct Method", "即時操作し、その場で応答を確認する", "接続待ち内に接続できなければ失敗。後日配送用のキューは持たない"],
    ["Device Twin (Desired)", "最終的に期待する構成へ合わせる", "期待値が保持され、再接続時に適用できる"],
    ["C2D メッセージ", "デバイスへの一方向の通知・依頼", "一定期間キューに保持（既定 TTL 1時間・最大2日）"],
  ], 2.35, { colW: [2.85, 4.0, 5.24], rowH: 0.72 });
  callout(s, "継続的に維持する構成は Twin に期待値として保持し、個別の通知・依頼は C2D で届ける。すべてを C2D にはしない。", 5.45);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-c2d-guidance#comparison-of-cloud-to-device-communication-options",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-c2d",
  ]);
  footer(s, 3);
}

// ---- 04-03 C2D でも制御できるが違う -------------------------------------
function s03() {
  const s = pptx.addSlide(); header(s, "03", "制御可否ではない違い", "C2D でも制御できるが、Direct Method と何が違うか");
  lead(s, "C2D でも開始・停止は実装できる。違いは要求・応答と未接続時の扱いにある。");
  codeBox(s, 'C2D で {"action": "start"} を送り、受信ハンドラで送信を開始できる', MX, 2.28, CW, 0.5);
  tableAt(s, ["比較", "Direct Method", "C2D メッセージ"], [
    ["基本の形", "要求と応答", "一方向のメッセージ配送"],
    ["実行結果の確認", "応答でステータス・本文を返せる", "返送と要求の対応付けをアプリで実装"],
    ["未接続時の扱い", "長期キューには保持しない", "有効期限内はキューに保持できる"],
    ["選ぶときの意図", "「今、開始して。結果を教えて」", "「これを届けて。受信したら処理して」"],
  ], 2.95, { colW: [2.7, 4.2, 5.19], rowH: 0.5 });
  callout(s, "遅れて届いた操作を実行してよいかも選定基準。停止中に届いた「開始」を再接続後に実行すると意図と異なる場合がある。", 5.45);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-c2d-guidance#comparison-of-cloud-to-device-communication-options",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-c2d",
  ]);
  footer(s, 4);
}

// ---- 04-04 送信・応答・実行の区別 ---------------------------------------
function s04() {
  const s = pptx.addSlide(); header(s, "04", "成功の意味", "送信成功・応答・実行成功は同じではない");
  lead(s, "クラウドへの送信成功、デバイスからの応答、アプリの実行完了は別の事実。");
  tableAt(s, ["観点", "Direct Method", "C2D メッセージ"], [
    ["クラウドが確認するもの", "要求に対するデバイスの応答", "IoT Hub への送信・キューへの受け付け"],
    ["未接続時", "接続待ち内に接続できなければ失敗", "キューに保持し、有効期限内の受信を待てる"],
    ["結果の解釈", "応答タイムアウトでも未実行とは限らない", "送信成功でも受信・処理成功とは限らない"],
  ], 2.35, { colW: [3.1, 4.3, 4.69], rowH: 0.55 });
  // 3段階の観測範囲
  const stages = ["クラウドへ送信成功", "デバイスで受信", "アプリの処理完了"];
  const sw = (CW - 1.0) / 3, sy = 4.7;
  stages.forEach((t, i) => {
    const x = MX + i * (sw + 0.5);
    const last = i === 2;
    s.addShape(S.roundRect, { x, y: sy, w: sw, h: 0.6, rectRadius: 0.08, fill: { color: last ? P.soft : P.softer }, line: { color: last ? P.amber : P.line, width: last ? 1.5 : 1 } });
    s.addText(last ? t + "（別に確認）" : t, { x, y: sy, w: sw, h: 0.6, fontFace: JP, fontSize: 12, bold: true, color: last ? P.ink : P.primary, align: "center", valign: "middle", margin: 0 });
    if (i < 2) s.addShape(S.line, { x: x + sw + 0.08, y: sy + 0.3, w: 0.34, h: 0, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  });
  callout(s, "応答タイムアウトは「期限内に結果を確認できなかった」、C2D の送信成功は「IoT Hub が受け付けた」までを意味する。", 5.5);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-direct-methods#invoke-a-direct-method-from-a-back-end-app",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-c2d",
  ]);
  footer(s, 5);
}

// ---- 04-05 C2D の保持と再接続（シーケンス） -----------------------------
function s05() {
  const s = pptx.addSlide(); header(s, "05", "保持と再接続", "C2D の保持と再接続後の受信");
  lead(s, "C2D は IoT Hub のデバイス別キューに保持され、有効期限内に再接続すれば受信できる。");
  // 4 レーン
  const lanes = [
    ["クラウド送信ツール", P.teal],
    ["IoT Hub のキュー", P.primary],
    ["デバイスアプリ", P.teal],
    ["C2D ハンドラ", P.muted],
  ];
  const laneY = 2.2, laneH = 0.5, lifeTop = laneY + laneH, lifeBot = 5.15;
  const lw = 2.7, lgap = (CW - lw * 4) / 3;
  const cx = lanes.map((_, i) => MX + i * (lw + lgap) + lw / 2);
  lanes.forEach((l, i) => {
    const x = MX + i * (lw + lgap);
    s.addShape(S.roundRect, { x, y: laneY, w: lw, h: laneH, rectRadius: 0.06, fill: { color: P.softer }, line: { color: l[1], width: 1.25 } });
    s.addText(l[0], { x, y: laneY, w: lw, h: laneH, fontFace: JP, fontSize: 12, bold: true, color: P.ink, align: "center", valign: "middle", margin: 0 });
    s.addShape(S.line, { x: cx[i], y: lifeTop, w: 0, h: lifeBot - lifeTop, line: { color: P.line, width: 1, dashType: "dash" } });
  });
  function msg(fromI, toI, y, label) {
    const x1 = cx[fromI], x2 = cx[toI];
    const left = Math.min(x1, x2), w = Math.abs(x2 - x1);
    const rev = x2 < x1;
    s.addShape(S.line, { x: left, y, w, h: 0, line: { color: P.teal, width: 2, beginArrowType: rev ? "triangle" : "none", endArrowType: rev ? "none" : "triangle" } });
    s.addText(label, { x: left, y: y - 0.3, w, h: 0.26, fontFace: JP, fontSize: 10.5, color: P.ink, align: "center", margin: 0, valign: "middle" });
  }
  s.addText("デバイス停止中（未接続）にキューへ保持", { x: cx[0] - 0.2, y: 2.95, w: cx[1] - cx[0] + 2.0, h: 0.24, fontFace: JP, fontSize: 10.5, italic: true, color: P.muted, align: "center", margin: 0 });
  msg(0, 1, 3.42, "Device ID 指定で C2D 送信");
  msg(2, 1, 3.96, "再接続 + ハンドラ登録");
  msg(1, 3, 4.5, "保持していた C2D を配送");
  // 2 分岐
  const by = 5.3, bw = (CW - 0.4) / 2;
  s.addShape(S.roundRect, { x: MX, y: by, w: bw, h: 0.62, rectRadius: 0.06, fill: { color: P.soft }, line: { color: P.teal, width: 1 } });
  s.addText("有効期限内に再接続 → 未受信の C2D を受け取れる", { x: MX + 0.16, y: by, w: bw - 0.3, h: 0.62, fontFace: JP, fontSize: 11.5, bold: true, color: P.ink, valign: "middle", margin: 0 });
  s.addShape(S.roundRect, { x: MX + bw + 0.4, y: by, w: bw, h: 0.62, rectRadius: 0.06, fill: { color: P.softer }, line: { color: P.amber, width: 1 } });
  s.addText("受信前に TTL 切れ → 後から再接続しても受信できない", { x: MX + bw + 0.56, y: by, w: bw - 0.3, h: 0.62, fontFace: JP, fontSize: 11.5, bold: true, color: P.ink, valign: "middle", margin: 0 });
  s.addText("既定 TTL 1時間・最大2日。保持するのは停止中のアプリではなく IoT Hub。", { x: MX, y: 6.08, w: CW, h: 0.3, fontFace: JP, fontSize: 11, color: P.muted, margin: 0 });
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-c2d",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/how-to-cloud-to-device-messaging?pivots=programming-language-python#create-a-device-application",
  ]);
  footer(s, 6);
}

// ---- 04-06 Device Twin の構造 -------------------------------------------
function s06() {
  const s = pptx.addSlide(); header(s, "06", "状態同期の基礎", "Device Twin の構造（Desired・Reported・Tags）");
  lead(s, "Device Twin は、期待する構成・報告された状態・分類情報を保持する。");
  // 中央 Twin、左=クラウド、右=デバイス
  const twinW = 3.0, twinH = 3.1, twinX = MX + (CW - twinW) / 2, twinY = 2.4;
  s.addShape(S.roundRect, { x: twinX, y: twinY, w: twinW, h: twinH, rectRadius: 0.08, fill: { color: P.white }, line: { color: P.teal, width: 1.5 } });
  s.addText("Device Twin", { x: twinX, y: twinY + 0.14, w: twinW, h: 0.4, fontFace: JP, fontSize: 14, bold: true, color: P.teal, align: "center", margin: 0 });
  function prop(y, name, who, ex, dot) {
    s.addShape(S.roundRect, { x: twinX + 0.24, y, w: twinW - 0.48, h: 0.8, rectRadius: 0.06, fill: { color: P.softer }, line: { color: P.line, width: 1 } });
    s.addShape(S.oval, { x: twinX + 0.4, y: y + 0.14, w: 0.12, h: 0.12, fill: { color: dot }, line: { type: "none" } });
    s.addText(name, { x: twinX + 0.6, y: y + 0.05, w: twinW - 0.8, h: 0.3, fontFace: JP, fontSize: 12.5, bold: true, color: P.primary, margin: 0, valign: "middle" });
    s.addText(ex, { x: twinX + 0.4, y: y + 0.36, w: twinW - 0.6, h: 0.4, fontFace: JP, fontSize: 10.5, color: P.muted, margin: 0, valign: "middle" });
  }
  prop(twinY + 0.62, "Desired Properties", "cloud", "例: 送信間隔を5分に", P.teal);
  prop(twinY + 1.5, "Reported Properties", "device", "例: 5分へ変更済みと報告", P.cyan);
  prop(twinY + 2.38, "Tags", "cloud", "拠点・機種・展開グループ", P.amber);
  // 左右のラベルと矢印
  s.addText("デバイスが書く", { x: MX, y: twinY + 0.5, w: (twinX - MX) - 0.2, h: 0.36, fontFace: JP, fontSize: 13, bold: true, color: P.cyan, align: "center", margin: 0 });
  s.addText("Reported", { x: MX, y: twinY + 0.9, w: (twinX - MX) - 0.2, h: 0.3, fontFace: JP, fontSize: 11, color: P.muted, align: "center", margin: 0 });
  s.addShape(S.line, { x: twinX - 0.95, y: twinY + 1.9, w: 0.9, h: 0, line: { color: P.cyan, width: 2, endArrowType: "triangle" } });
  s.addText("クラウドが書く", { x: twinX + twinW + 0.2, y: twinY + 0.5, w: RIGHT - (twinX + twinW) - 0.2, h: 0.36, fontFace: JP, fontSize: 13, bold: true, color: P.teal, align: "center", margin: 0 });
  s.addText("Desired / Tags", { x: twinX + twinW + 0.2, y: twinY + 0.9, w: RIGHT - (twinX + twinW) - 0.2, h: 0.3, fontFace: JP, fontSize: 11, color: P.muted, align: "center", margin: 0 });
  s.addShape(S.line, { x: twinX + twinW + 0.05, y: twinY + 1.02, w: 0.9, h: 0, line: { color: P.teal, width: 2, beginArrowType: "triangle", endArrowType: "none" } });
  callout(s, "Desired は期待状態、Reported は実状態、Tags はクラウド側の分類情報。Tags はデバイスへ配送しない。", 5.75);
  sources(s, ["https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-device-twins"]);
  footer(s, 7);
}

// ---- 04-07 状態同期のタイムライン ---------------------------------------
function s07() {
  const s = pptx.addSlide(); header(s, "07", "適用の確認", "Desired と Reported の状態同期");
  lead(s, "Desired の更新は適用完了を意味しない。実際の適用は Reported で確認する。");
  const steps = [
    ["1", "Desired 更新", "クラウドが送信間隔を5分に設定"],
    ["2", "デバイス適用", "変更を受け取り、送信間隔へ反映"],
    ["3", "Reported 更新", "適用結果を書き戻す"],
    ["4", "クラウド確認", "Reported を読み、期待値と照合"],
  ];
  const y = 2.7, w = 2.7, gap = (CW - w * 4) / 3;
  const who = [["クラウド側", P.teal], ["デバイス側", P.cyan], ["デバイス側", P.cyan], ["クラウド側", P.teal]];
  steps.forEach(([n, t, d], i) => {
    const x = MX + i * (w + gap);
    s.addText(who[i][0], { x, y: y - 0.4, w, h: 0.3, fontFace: JP, fontSize: 11, bold: true, color: who[i][1], align: "center", margin: 0 });
    s.addShape(S.roundRect, { x, y, w, h: 1.6, rectRadius: 0.08, fill: { color: P.softer }, line: { color: P.line, width: 1 } });
    s.addShape(S.oval, { x: x + w / 2 - 0.27, y: y + 0.2, w: 0.54, h: 0.54, fill: { color: P.primary }, line: { type: "none" } });
    s.addText(n, { x: x + w / 2 - 0.27, y: y + 0.2, w: 0.54, h: 0.54, fontFace: JP, fontSize: 18, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
    s.addText(t, { x, y: y + 0.82, w, h: 0.3, fontFace: JP, fontSize: 13, bold: true, color: P.primary, align: "center", margin: 0 });
    s.addText(d, { x: x + 0.12, y: y + 1.12, w: w - 0.24, h: 0.42, fontFace: JP, fontSize: 10.5, color: P.muted, align: "center", margin: 0, valign: "top" });
    if (i < 3) s.addShape(S.line, { x: x + w + 0.04, y: y + 0.47, w: gap - 0.08, h: 0, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  });
  callout(s, "Desired と Reported は非同期。更新した事実と、各デバイスでの適用成功は分けて確認する。", 5.15);
  sources(s, ["https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-device-twins#back-end-operations"]);
  footer(s, 8);
}

// ---- 04-08 確認問題 ------------------------------------------------------
function s08() {
  const s = pptx.addSlide(); header(s, "08", "理解度の確認", "登録した3手段を事例で選び分ける");
  lead(s, "次の場面で、どの手段を選ぶか説明してください。");
  const qs = [
    "ファンを今すぐ停止し、結果を確認したい。",
    "オフライン中のデバイスにも、送信間隔の変更を届けて保ちたい。",
    "「再接続後に診断ログを送ってほしい」と「送信間隔を10秒に保ってほしい」を選び分ける。",
    "応答タイムアウトと C2D の送信成功から、それぞれ何が分かり、何が分からないか。",
  ];
  const y = 2.35, h = 0.74, gap = 0.18;
  qs.forEach((q, i) => {
    const yy = y + i * (h + gap);
    s.addShape(S.roundRect, { x: MX, y: yy, w: CW, h, rectRadius: 0.06, fill: { color: P.softer }, line: { color: P.line, width: 1 } });
    s.addShape(S.rect, { x: MX, y: yy, w: 0.09, h, fill: { color: P.teal }, line: { type: "none" } });
    s.addShape(S.oval, { x: MX + 0.28, y: yy + h / 2 - 0.23, w: 0.46, h: 0.46, fill: { color: P.primary }, line: { type: "none" } });
    s.addText(String(i + 1), { x: MX + 0.28, y: yy + h / 2 - 0.23, w: 0.46, h: 0.46, fontFace: JP, fontSize: 16, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
    s.addText(q, { x: MX + 1.0, y: yy, w: CW - 1.3, h, fontFace: JP, fontSize: 13, color: P.ink, valign: "middle", margin: 0 });
  });
  callout(s, "次章: IoT Hub が受け取った D2C を、条件に応じて後続サービスへ配送するメッセージルーティングを扱う。", 6.05, CW, MX, P.cyan);
  footer(s, 9);
}

cover();
s01(); s02(); s03(); s04(); s05(); s06(); s07(); s08();

pptx.writeFile({ fileName: "docs/sections/04-device-control-state-sync/v1/v1-04-device-control-state-sync.pptx" }).then((f) => console.log("written:", f));
