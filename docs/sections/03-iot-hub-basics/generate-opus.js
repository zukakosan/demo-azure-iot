// 第3章スライド: テンプレート/デザインガイドを参照せず、slide.md の内容だけを素材に
// 私（Opus）の設計で一から作る。pptxgenjs でネイティブ図形として生成する。
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
const MX = 0.62;                 // 左右マージン
const CW = 13.33 - MX * 2;       // 本文幅
const RIGHT = 13.33 - MX;

const pptx = new pptxgen();
pptx.defineLayout({ name: "W", width: 13.33, height: 7.5 });
pptx.layout = "W";
pptx.author = "Azure IoT Workshop";
pptx.title = "第3章 IoT Hub の基本";

const S = { rect: "rect", roundRect: "roundRect", line: "line", oval: "ellipse" };

// ---- 共通パーツ ----------------------------------------------------------
function footer(slide, n) {
  slide.addShape(S.line, { x: MX, y: 7.02, w: CW, h: 0, line: { color: P.line, width: 1 } });
  slide.addText("第3章  IoT Hub の基本 — 登録・接続・送受信", {
    x: MX, y: 7.06, w: 8, h: 0.3, fontFace: JP, fontSize: 9, color: P.muted, margin: 0, valign: "middle",
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

function chip(slide, text, x, y, w, dot) {
  const h = 0.34;
  slide.addShape(S.roundRect, { x, y, w, h, rectRadius: 0.17, fill: { color: P.white }, line: { color: P.line, width: 1 } });
  if (dot) slide.addShape(S.oval, { x: x + 0.14, y: y + h / 2 - 0.05, w: 0.1, h: 0.1, fill: { color: dot }, line: { type: "none" } });
  slide.addText(text, { x: x + (dot ? 0.3 : 0.14), y, w: w - (dot ? 0.4 : 0.24), h, fontFace: JP, fontSize: 11, color: P.ink, margin: 0, valign: "middle" });
}

function arrow(slide, x, y, w, label) {
  slide.addShape(S.line, { x, y, w, h: 0, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  if (label) slide.addText(label, { x: x - 0.1, y: y - 0.36, w: w + 0.2, h: 0.3, fontFace: JP, fontSize: 10, color: P.muted, align: "center", margin: 0, valign: "middle" });
}

function entityCard(slide, x, y, w, h, title, dot, body) {
  slide.addShape(S.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: P.softer }, line: { color: P.line, width: 1 } });
  slide.addShape(S.rect, { x, y, w, h: 0.5, fill: { color: P.primary }, line: { type: "none" } });
  if (dot) slide.addShape(S.oval, { x: x + 0.16, y: y + 0.19, w: 0.13, h: 0.13, fill: { color: dot }, line: { type: "none" } });
  slide.addText(title, { x: x + (dot ? 0.38 : 0.18), y, w: w - 0.4, h: 0.5, fontFace: JP, fontSize: 13, bold: true, color: P.white, margin: 0, valign: "middle" });
  slide.addText(body.map((t, i) => ({ text: t, options: { bullet: { code: "2022", indent: 12 }, breakLine: true, color: P.ink } })), {
    x: x + 0.2, y: y + 0.62, w: w - 0.36, h: h - 0.74, fontFace: JP, fontSize: 11.5, color: P.ink, margin: 0, valign: "top", lineSpacingMultiple: 1.05,
  });
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

// ---- 表紙 ----------------------------------------------------------------
function cover() {
  const s = pptx.addSlide();
  s.background = { color: P.primary };
  s.addShape(S.rect, { x: 0, y: 0, w: 13.33, h: 0.16, fill: { color: P.cyan }, line: { type: "none" } });
  s.addText("第 3 章", { x: 0.9, y: 1.5, w: 6, h: 0.5, fontFace: JP, fontSize: 18, bold: true, color: P.cyan, charSpacing: 3, margin: 0 });
  s.addText("IoT Hub の基本", { x: 0.9, y: 2.05, w: 11.5, h: 1.2, fontFace: JP, fontSize: 46, bold: true, color: P.white, margin: 0 });
  s.addText("デバイスの登録・接続・テレメトリの送受信を、役割と経路から理解する", {
    x: 0.9, y: 3.25, w: 11, h: 0.5, fontFace: JP, fontSize: 17, color: "BFE6EC", margin: 0,
  });
  s.addShape(S.line, { x: 0.92, y: 3.95, w: 3.2, h: 0, line: { color: P.cyan, width: 2.5 } });
  const items = ["登録", "接続", "認証・保護", "送受信の確認"];
  let cx = 0.9;
  items.forEach((t) => {
    const w = 0.5 + t.length * 0.24;
    s.addShape(S.roundRect, { x: cx, y: 4.35, w, h: 0.5, rectRadius: 0.25, fill: { color: "12508C" }, line: { color: P.cyan, width: 1 } });
    s.addText(t, { x: cx, y: 4.35, w, h: 0.5, fontFace: JP, fontSize: 13, color: P.white, align: "center", valign: "middle", margin: 0 });
    cx += w + 0.25;
  });
  s.addText("Azure IoT ワークショップ ／ 本編 25 分・12 枚", {
    x: 0.9, y: 6.5, w: 11, h: 0.4, fontFace: JP, fontSize: 12, color: "9FC7D1", margin: 0,
  });
}

// ---- 03-01 役割 ----------------------------------------------------------
function s01() {
  const s = pptx.addSlide(); header(s, "01", "全体像", "デバイス・IoT Hub・バックエンドの役割");
  lead(s, "デバイスアプリがデータを送り、IoT Hub が通信を仲介し、バックエンドがデータを利用する。");
  const y = 2.35, h = 2.35, w = 3.75, gap = (CW - w * 3) / 2;
  const x1 = MX, x2 = MX + w + gap, x3 = MX + (w + gap) * 2;
  entityCard(s, x1, y, w, h, "デバイスアプリ", P.cyan, ["測定値を作って送る", "受け取った操作・設定を実行する", "今回: ローカルPCの温度センサー役"]);
  entityCard(s, x2, y, w, h, "Azure IoT Hub", P.teal, ["デバイスを認証する", "双方向の通信を仲介する", "後続サービスへ配送する"]);
  entityCard(s, x3, y, w, h, "バックエンド", P.amber, ["テレメトリを読む", "保存・業務処理を行う", "デバイスへの操作を要求する"]);
  arrow(s, x1 + w + 0.06, y + h / 2, gap - 0.12, "送信");
  arrow(s, x2 + w + 0.06, y + h / 2, gap - 0.12, "受信");
  callout(s, "IoT Hub は接続・通信の基盤。長期保存・分析・デバイス上の処理はアプリや後続サービスが担う。", 5.1);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-concepts-and-iot-hub",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-sdks",
  ]);
  footer(s, 2);
}

// ---- 03-02 手順 ----------------------------------------------------------
function s02() {
  const s = pptx.addSlide(); header(s, "02", "接続までの段階", "Hub 作成からデバイス接続までの手順");
  lead(s, "Hub と Device ID を作っても、デバイスアプリが自動で接続するわけではない。");
  const steps = [
    ["1", "Hub 作成", "接続先の Hub"],
    ["2", "デバイス登録", "ID と認証方式"],
    ["3", "接続設定", "接続先と資格情報"],
    ["4", "接続", "認証を伴う接続"],
    ["5", "送受信確認", "対象のメッセージ"],
  ];
  const groups = [["クラウド側の準備", 0, 2], ["アプリ準備", 2, 3], ["実行と確認", 3, 5]];
  const y = 2.9, w = 2.16, gap = (CW - w * 5) / 4;
  groups.forEach(([g, a, b]) => {
    const gx = MX + a * (w + gap);
    const gw = (b - a) * w + (b - a - 1) * gap;
    s.addText(g, { x: gx, y: y - 0.42, w: gw, h: 0.3, fontFace: JP, fontSize: 11, bold: true, color: P.muted, align: "center", margin: 0 });
    s.addShape(S.line, { x: gx, y: y - 0.1, w: gw, h: 0, line: { color: P.line, width: 1 } });
  });
  steps.forEach(([n, t, d], i) => {
    const x = MX + i * (w + gap);
    s.addShape(S.roundRect, { x, y, w, h: 1.5, rectRadius: 0.08, fill: { color: P.softer }, line: { color: P.line, width: 1 } });
    s.addShape(S.oval, { x: x + w / 2 - 0.27, y: y + 0.18, w: 0.54, h: 0.54, fill: { color: P.primary }, line: { type: "none" } });
    s.addText(n, { x: x + w / 2 - 0.27, y: y + 0.18, w: 0.54, h: 0.54, fontFace: JP, fontSize: 18, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
    s.addText(t, { x, y: y + 0.78, w, h: 0.3, fontFace: JP, fontSize: 13, bold: true, color: P.primary, align: "center", margin: 0 });
    s.addText(d, { x: x + 0.1, y: y + 1.08, w: w - 0.2, h: 0.36, fontFace: JP, fontSize: 10.5, color: P.muted, align: "center", margin: 0 });
    if (i < 4) s.addShape(S.line, { x: x + w + 0.04, y: y + 0.45, w: gap - 0.08, h: 0, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  });
  callout(s, "登録済み ≠ 接続中。ポータルの状態欄だけを現在の接続の証明として扱わない。", 5.0);
  sources(s, ["https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-identity-registry"]);
  footer(s, 3);
}

// ---- 03-03 資格情報 ------------------------------------------------------
function s03() {
  const s = pptx.addSlide(); header(s, "03", "識別子と資格情報", "Device ID とデバイスの資格情報");
  lead(s, "Device ID は名前。資格情報は、そのデバイスとして認証するために使う。");
  tableAt(s, ["要素", "今回の説明例", "意味"], [
    ["接続先", "iot-training-hub.azure-devices.net", "どの Hub に接続するか"],
    ["Device ID", "temp-sensor-01", "Hub 内のどのデバイスか"],
    ["資格情報", "対称キー / 証明書と秘密鍵", "そのデバイスとして認証する材料"],
  ], 2.3, { colW: [2.3, 5.2, 4.59], rowH: 0.5 });
  s.addText("説明用・接続不可（実際は1行）", { x: MX, y: 4.35, w: 5, h: 0.24, fontFace: JP, fontSize: 10, color: P.muted, margin: 0 });
  codeBox(s, "HostName=iot-training-hub.azure-devices.net;DeviceId=temp-sensor-01;SharedAccessKey=<非表示>", MX, 4.62, CW, 0.62);
  callout(s, "接続文字列は URL ではなくキーを含む秘密情報。画面・コード・ログに公開しない。", 5.42);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/authenticate-authorize-sas",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/authenticate-authorize-x509",
  ]);
  footer(s, 4);
}

// ---- 03-04 認証・権限・保護 ---------------------------------------------
function s04() {
  const s = pptx.addSlide(); header(s, "04", "接続の基礎", "認証・権限・通信保護の違い");
  lead(s, "誰として接続するか、何を許可するか、通信内容をどう守るかは別の問い。");
  const y = 2.35, h = 1.95, w = 3.75, gap = (CW - w * 3) / 2;
  const cards = [
    ["認証", "誰として接続するか", "temp-sensor-01 として資格情報を検証", P.cyan],
    ["認可・権限", "その主体に何を許すか", "自分の送信とサービス側の操作を分ける", P.teal],
    ["通信保護", "経路上で内容を守れるか", "TLS で通信を暗号化する", P.amber],
  ];
  cards.forEach(([t, q, ex, dot], i) => {
    const x = MX + i * (w + gap);
    s.addShape(S.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: P.softer }, line: { color: P.line, width: 1 } });
    s.addShape(S.oval, { x: x + 0.2, y: y + 0.22, w: 0.16, h: 0.16, fill: { color: dot }, line: { type: "none" } });
    s.addText(t, { x: x + 0.46, y: y + 0.12, w: w - 0.6, h: 0.36, fontFace: JP, fontSize: 15, bold: true, color: P.primary, margin: 0, valign: "middle" });
    s.addText(q, { x: x + 0.24, y: y + 0.6, w: w - 0.46, h: 0.34, fontFace: JP, fontSize: 12, bold: true, color: P.teal, margin: 0 });
    s.addText(ex, { x: x + 0.24, y: y + 0.98, w: w - 0.46, h: 0.8, fontFace: JP, fontSize: 12, color: P.ink, margin: 0, valign: "top" });
  });
  s.addText("デバイス側は SAS / X.509。サービス API は Entra ID + Azure RBAC、または共有アクセスポリシーの SAS。Entra ID 認証はデバイス API には使えない。", {
    x: MX, y: 4.55, w: CW, h: 0.55, fontFace: JP, fontSize: 12.5, color: P.ink, margin: 0, valign: "top",
  });
  callout(s, "デバイス用とサービス側の資格情報を分ける。TLS を使っていても、キーの公開が安全になるわけではない。", 5.25);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/authenticate-authorize-azure-ad",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-tls-support",
  ]);
  footer(s, 5);
}

// ---- 03-05 プロトコル ----------------------------------------------------
function s05() {
  const s = pptx.addSlide(); header(s, "05", "通信プロトコル", "IoT Hub の通信プロトコルと選び分け");
  lead(s, "通信プロトコルはデータをやり取りする方式。デバイスの制約と受信方法で選ぶ。");
  tableAt(s, ["観点", "MQTT", "AMQP", "HTTPS"], [
    ["主な選択場面", "一般的な直接接続", "複数デバイスの集約", "他方式が使えない場合"],
    ["C2D の受信", "サーバーからプッシュ", "サーバーからプッシュ", "デバイスからポーリング"],
    ["1接続のデバイスID", "1つ", "複数を多重化", "1つ"],
    ["送信先ポート", "8883 / 443(WS)", "5671 / 443(WS)", "443"],
  ], 2.3, { colW: [3.0, 3.03, 3.03, 3.03], rowH: 0.46 });
  callout(s, "443番ポート＝HTTPS方式ではない。MQTT / AMQP も WebSocket 経由で 443 を使える。", 4.9);
  callout(s, "IoT Hub の MQTT 対応は機能が限定され、汎用 MQTT ブローカーとは異なる。", 5.62);
  sources(s, ["https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-protocols"]);
  footer(s, 6);
}

// ---- 03-06 SDK -----------------------------------------------------------
function s06() {
  const s = pptx.addSlide(); header(s, "06", "SDK の位置づけ", "SDK の役割と用途別の使い分け");
  lead(s, "プロトコルは通信の方式。SDK は、その通信機能をアプリから使うためのライブラリ。");
  const stackX = MX, stackW = 3.5, y = 2.35;
  const layers = [["デバイスアプリ", P.softer, P.primary], ["デバイス SDK", P.soft, P.primary], ["通信プロトコル(MQTT など)", P.soft, P.primary], ["IoT Hub", P.primary, P.white]];
  layers.forEach((l, i) => {
    const ly = y + i * 0.86;
    s.addShape(S.roundRect, { x: stackX, y: ly, w: stackW, h: 0.68, rectRadius: 0.06, fill: { color: l[1] }, line: { color: P.line, width: 1 } });
    s.addText(l[0], { x: stackX, y: ly, w: stackW, h: 0.68, fontFace: JP, fontSize: 12.5, bold: true, color: l[2], align: "center", valign: "middle", margin: 0 });
    if (i < 3) s.addShape(S.line, { x: stackX + stackW / 2, y: ly + 0.68, w: 0, h: 0.18, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  });
  const tx = MX + stackW + 0.5;
  const tw = CW - stackW - 0.5;
  const rows = [
    [{ text: "やりたいこと", options: { fill: { color: P.primary }, color: P.white, bold: true, fontFace: JP, fontSize: 12.5 } }, { text: "使うライブラリ", options: { fill: { color: P.primary }, color: P.white, bold: true, fontFace: JP, fontSize: 12.5 } }],
    ...[
      ["デバイスから送信・指示受信", "IoT Hub デバイス SDK"],
      ["デバイス管理・操作要求", "IoT Hub サービス SDK"],
      ["Hub リソースの作成・管理", "IoT Hub 管理 SDK"],
      ["組み込みEPから D2C を読む", "Event Hubs SDK"],
    ].map((r, i) => r.map((c, ci) => ({ text: c, options: { fill: { color: i % 2 ? P.softer : P.white }, color: ci === 0 ? P.ink : P.primary, bold: ci === 1, fontFace: JP, fontSize: 12 } }))),
  ];
  s.addTable(rows, { x: tx, y: 2.5, w: tw, colW: [tw * 0.56, tw * 0.44], rowH: 0.62, border: { pt: 0.75, color: P.line }, margin: [3, 6, 3, 6], valign: "middle", autoPage: false });
  callout(s, "SDK は実行する役割に合わせて選ぶ。D2C はデバイスからクラウドへの通信を指す。", 5.55);
  sources(s, ["https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-sdks"]);
  footer(s, 7);
}

// ---- 03-07 テレメトリ送信 -----------------------------------------------
function s07() {
  const s = pptx.addSlide(); header(s, "07", "D2C の送信", "テレメトリの本文と送信処理");
  lead(s, "テレメトリはデバイスから送るデータ。本文はデバイスアプリが作る。");
  s.addText("温度・湿度はデモ用サンプル。アプリが作った JSON 本文をメッセージにして送る。", { x: MX, y: 2.28, w: CW, h: 0.34, fontFace: JP, fontSize: 13, color: P.ink, margin: 0, valign: "middle" });
  codeBox(s, 'msg = Message(json.dumps({"temperature": 25, "humidity": 45}))', MX, 2.74, CW, 0.66);
  const stx = MX, sw = (CW - 1.0) / 3, sy = 3.82;
  ["アプリが値を用意する", "JSON をメッセージ化する", "デバイス SDK で送信する"].forEach((t, i) => {
    const x = stx + i * (sw + 0.5);
    s.addShape(S.oval, { x, y: sy, w: 0.5, h: 0.5, fill: { color: P.teal }, line: { type: "none" } });
    s.addText(String(i + 1), { x, y: sy, w: 0.5, h: 0.5, fontFace: JP, fontSize: 15, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
    s.addText(t, { x: x + 0.62, y: sy, w: sw - 0.62, h: 0.5, fontFace: JP, fontSize: 12.5, color: P.ink, valign: "middle", margin: 0 });
    if (i < 2) s.addShape(S.line, { x: x + sw + 0.08, y: sy + 0.25, w: 0.34, h: 0, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  });
  callout(s, "既存デモは 接続 → start の操作後に送信する。本文の項目・単位はアプリ側で決める。", 4.7);
  callout(s, "IoT Hub への送信だけで分析が完了するわけではない。", 5.42);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-construct",
    "https://github.com/zukakosan/demo-azure-iot/blob/main/demo/01_iothub-send-tel.py",
  ]);
  footer(s, 8);
}

// ---- 03-08 組み込みエンドポイント ---------------------------------------
function s08() {
  const s = pptx.addSlide(); header(s, "08", "受信の入口", "D2C を読む組み込みエンドポイント");
  lead(s, "受信アプリは、IoT Hub に用意された D2C の読み取り口を使える。");
  const y = 2.5, h = 1.5;
  const dw = 2.6, hw = 4.6, rw = 2.6, gap = (CW - dw - hw - rw) / 2;
  const dx = MX, hx = MX + dw + gap, rx = MX + dw + gap + hw + gap;
  s.addShape(S.roundRect, { x: dx, y, w: dw, h, rectRadius: 0.08, fill: { color: P.softer }, line: { color: P.line, width: 1 } });
  s.addText("デバイス", { x: dx, y, w: dw, h, fontFace: JP, fontSize: 14, bold: true, color: P.primary, align: "center", valign: "middle", margin: 0 });
  s.addShape(S.roundRect, { x: hx, y: y - 0.2, w: hw, h: h + 0.4, rectRadius: 0.08, fill: { color: P.white }, line: { color: P.teal, width: 1.5 } });
  s.addText("Azure IoT Hub", { x: hx + 0.2, y: y - 0.05, w: hw - 0.4, h: 0.35, fontFace: JP, fontSize: 13, bold: true, color: P.teal, margin: 0 });
  s.addShape(S.roundRect, { x: hx + 0.35, y: y + 0.42, w: hw - 0.7, h: 0.78, rectRadius: 0.06, fill: { color: P.soft }, line: { color: P.line, width: 1 } });
  s.addText([{ text: "組み込みエンドポイント ", options: { bold: true } }, { text: "messages/events", options: { fontFace: MONO } }, { text: "\nEvent Hubs 互換", options: { color: P.muted, fontSize: 11 } }], { x: hx + 0.35, y: y + 0.42, w: hw - 0.7, h: 0.78, fontFace: JP, fontSize: 12.5, color: P.ink, align: "center", valign: "middle", margin: 0 });
  s.addShape(S.roundRect, { x: rx, y, w: rw, h, rectRadius: 0.08, fill: { color: P.softer }, line: { color: P.line, width: 1 } });
  s.addText("受信アプリ・ツール", { x: rx, y, w: rw, h, fontFace: JP, fontSize: 13, bold: true, color: P.primary, align: "center", valign: "middle", margin: 0 });
  s.addShape(S.line, { x: dx + dw + 0.05, y: y + h / 2, w: gap - 0.1, h: 0, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  s.addShape(S.line, { x: hx + hw + 0.05, y: y + h / 2, w: gap - 0.1, h: 0, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  s.addText("前提: ルート未追加・既定の配送が有効／別の Event Hubs リソースは不要", { x: MX, y: 4.45, w: CW, h: 0.34, fontFace: JP, fontSize: 12, color: P.muted, margin: 0 });
  callout(s, "この読み取り口は共有アクセスキー方式で接続する。サービス API の Entra ID 認証やデバイス用接続文字列とは別。", 4.9);
  sources(s, ["https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-read-builtin"]);
  footer(s, 9);
}

// ---- 03-09 照合 ----------------------------------------------------------
function s09() {
  const s = pptx.addSlide(); header(s, "09", "送信と受信の照合", "送信ログと受信データの照合");
  lead(s, "送信ログと受信データを対応させる。値の一致だけでは1件を特定できない。");
  const colW = (CW - 0.4) / 2;
  s.addText("送信側の表示（説明用）", { x: MX, y: 2.24, w: colW, h: 0.3, fontFace: JP, fontSize: 12, bold: true, color: P.teal, margin: 0 });
  codeBox(s, "Device connected to IoT Hub.\nSent telemetry: {'temperature': 25, 'humidity': 45}", MX, 2.54, colW, 0.86);
  s.addText("受信側で見る項目", { x: MX + colW + 0.4, y: 2.24, w: colW, h: 0.3, fontFace: JP, fontSize: 12, bold: true, color: P.teal, margin: 0 });
  s.addTable([
    [{ text: "確認項目", options: { fill: { color: P.primary }, color: P.white, bold: true, fontFace: JP, fontSize: 12 } }, { text: "表示例", options: { fill: { color: P.primary }, color: P.white, bold: true, fontFace: JP, fontSize: 12 } }],
    [{ text: "送信元メタデータ", options: { fontFace: JP, fontSize: 12, color: P.ink } }, { text: "temp-sensor-01", options: { fontFace: MONO, fontSize: 12, color: P.ink } }],
    [{ text: "メッセージ本文", options: { fontFace: JP, fontSize: 12, color: P.ink, fill: { color: P.softer } } }, { text: '{"temperature":25,"humidity":45}', options: { fontFace: MONO, fontSize: 11, color: P.ink, fill: { color: P.softer } } }],
  ], { x: MX + colW + 0.4, y: 2.54, w: colW, colW: [colW * 0.42, colW * 0.58], rowH: 0.42, border: { pt: 0.75, color: P.line }, margin: [3, 6, 3, 6], valign: "middle", autoPage: false });
  s.addText("1件を一意に識別・突き合わせるには（値の一致に頼らない）", { x: MX, y: 3.86, w: CW, h: 0.3, fontFace: JP, fontSize: 12.5, bold: true, color: P.teal, margin: 0 });
  const g = CW / 3;
  const gcell = (t, opt) => ({ text: t, options: Object.assign({ fontFace: JP, fontSize: 11, color: P.ink, valign: "middle" }, opt) });
  s.addTable([
    [gcell("送信元の特定", { fill: { color: P.primary }, color: P.white, bold: true }), gcell("メッセージの識別", { fill: { color: P.primary }, color: P.white, bold: true }), gcell("時刻の基準", { fill: { color: P.primary }, color: P.white, bold: true })],
    [gcell("iothub-connection-device-id", { fontFace: MONO, fontSize: 10.5, bold: true, color: P.primary }), gcell("message-id", { fontFace: MONO, fontSize: 10.5, bold: true, color: P.primary, fill: { color: P.softer } }), gcell("enqueuedTime", { fontFace: MONO, fontSize: 10.5, bold: true, color: P.primary })],
    [gcell("Hub が刻む送信元ID。本文のIDは根拠にしない"), gcell("デバイスが各件に一意付与。重複検知の起点", { fill: { color: P.softer } }), gcell("到着時刻・送信時刻で並べる")],
  ], { x: MX, y: 4.18, w: CW, colW: [g, g, g], rowH: 0.4, border: { pt: 0.75, color: P.line }, margin: [3, 6, 3, 6], valign: "middle", autoPage: false });
  callout(s, "送信元IDは Hub が刻む。一意なID・重複排除はデバイスが message-id を付けて成立。受信確認と DB保存・業務完了は別。", 5.6);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-construct",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-read-builtin",
  ]);
  footer(s, 10);
}

// ---- 03-10 双方向 --------------------------------------------------------
function s10() {
  const s = pptx.addSlide(); header(s, "10", "双方向と後続配送", "デバイス操作・設定変更・後続配送");
  lead(s, "温度を集める D2C に加えて、操作・状態同期・後続配送の機能がある。");
  const dw = 2.6, hw = 2.6, gap = 1.2, y = 2.35;
  const dx = MX, hx = MX + dw + gap;
  s.addShape(S.roundRect, { x: dx, y: y + 0.35, w: dw, h: 0.8, rectRadius: 0.08, fill: { color: P.softer }, line: { color: P.line, width: 1 } });
  s.addText("デバイス", { x: dx, y: y + 0.35, w: dw, h: 0.8, fontFace: JP, fontSize: 13, bold: true, color: P.primary, align: "center", valign: "middle", margin: 0 });
  s.addShape(S.roundRect, { x: hx, y: y + 0.35, w: hw, h: 0.8, rectRadius: 0.08, fill: { color: P.primary }, line: { type: "none" } });
  s.addText("IoT Hub", { x: hx, y: y + 0.35, w: hw, h: 0.8, fontFace: JP, fontSize: 13, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
  s.addShape(S.line, { x: dx + dw + 0.05, y: y + 0.55, w: gap - 0.1, h: 0, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  s.addText("D2C 送信", { x: dx + dw, y: y + 0.16, w: gap, h: 0.26, fontFace: JP, fontSize: 10, color: P.muted, align: "center", margin: 0 });
  s.addShape(S.line, { x: dx + dw + 0.05, y: y + 0.95, w: gap - 0.1, h: 0, line: { color: P.amber, width: 2, beginArrowType: "triangle", endArrowType: "none" } });
  s.addText("操作要求", { x: dx + dw, y: y + 1.06, w: gap, h: 0.26, fontFace: JP, fontSize: 10, color: P.amber, align: "center", margin: 0 });
  const tx = MX + dw + gap + hw + 0.6;
  const tw = RIGHT - tx;
  s.addTable([
    [{ text: "追加したい要求", options: { fill: { color: P.primary }, color: P.white, bold: true, fontFace: JP, fontSize: 11.5 } }, { text: "機能", options: { fill: { color: P.primary }, color: P.white, bold: true, fontFace: JP, fontSize: 11.5 } }, { text: "章", options: { fill: { color: P.primary }, color: P.white, bold: true, fontFace: JP, fontSize: 11.5 } }],
    ...[["開始・停止", "Direct Method", "第4章"], ["間隔変更・状態", "Device Twin", "第4章"], ["通知・依頼", "C2D メッセージ", "第4章"], ["保存先へ配送", "メッセージルーティング", "第5章"]].map((r, i) => r.map((c, ci) => ({ text: c, options: { fill: { color: i % 2 ? P.softer : P.white }, color: ci === 0 ? P.ink : P.primary, bold: ci !== 0, fontFace: JP, fontSize: 11.5 } }))),
  ], { x: tx, y: 2.35, w: tw, colW: [tw * 0.4, tw * 0.4, tw * 0.2], rowH: 0.5, border: { pt: 0.75, color: P.line }, margin: [3, 6, 3, 6], valign: "middle", autoPage: false });
  callout(s, "これらは IoT Hub の異なる機能。操作や設定の実際の適用処理はデバイスアプリ側に必要。", 5.35);
  sources(s, ["https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-concepts-and-iot-hub"]);
  footer(s, 11);
}

// ---- 03-11 SKU -----------------------------------------------------------
function s11() {
  const s = pptx.addSlide(); header(s, "11", "SKU の入口", "Basic・Standard・Free の機能差");
  lead(s, "使う機能を選ぶことと、必要な容量を見積もることは別。");
  tableAt(s, ["今回確認する機能", "Basic", "Standard", "Free（評価用）"], [
    ["D2C・メッセージルーティング", "対応", "対応", "対応"],
    ["Direct Method・Twin・C2D", "非対応", "対応", "対応"],
    ["位置づけ", "データ収集中心", "双方向・デバイス管理", "小容量で評価"],
  ], 2.3, { colW: [4.2, 2.63, 2.63, 2.63], rowH: 0.55 });
  callout(s, "Basic と Standard の認証・セキュリティ機能は同じ。Free は評価用で容量が限られ、Basic / Standard へ直接アップグレードできない。", 4.6);
  callout(s, "今回の開始・停止と設定変更には Standard 相当の機能が必要。Basic では双方向デモを実施できない。", 5.32);
  sources(s, ["https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-scaling"]);
  footer(s, 12);
}

// ---- 03-12 確認問題 ------------------------------------------------------
function s12() {
  const s = pptx.addSlide(); header(s, "12", "理解度の確認", "登録・接続・送受信の確認問題");
  lead(s, "次の3つの場面で、何が不足しているか説明してください。");
  const qs = [
    "Hub に temp-sensor-01 を登録した。アプリには Device ID だけ渡せば接続できるか。",
    "デバイス側に送信ログが出た。受信担当はどこを読み、何を照合するか。",
    "受信ツールで温度を確認できた。DB 保存は完了しているか。停止は誰が要求し、誰が実行するか。",
  ];
  const y = 2.4, h = 1.05, gap = 0.28;
  qs.forEach((q, i) => {
    const yy = y + i * (h + gap);
    s.addShape(S.roundRect, { x: MX, y: yy, w: CW, h, rectRadius: 0.06, fill: { color: P.softer }, line: { color: P.line, width: 1 } });
    s.addShape(S.rect, { x: MX, y: yy, w: 0.09, h, fill: { color: P.teal }, line: { type: "none" } });
    s.addShape(S.oval, { x: MX + 0.28, y: yy + h / 2 - 0.28, w: 0.56, h: 0.56, fill: { color: P.primary }, line: { type: "none" } });
    s.addText(String(i + 1), { x: MX + 0.28, y: yy + h / 2 - 0.28, w: 0.56, h: 0.56, fontFace: JP, fontSize: 18, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
    s.addText(q, { x: MX + 1.1, y: yy, w: CW - 1.4, h, fontFace: JP, fontSize: 13.5, color: P.ink, valign: "middle", margin: 0 });
  });
  callout(s, "次章: Direct Method・Device Twin・C2D を、操作と状態同期の用途で使い分ける。", 6.15, CW, MX, P.cyan);
  footer(s, 13);
}

cover();
s01(); s02(); s03(); s04(); s05(); s06(); s07(); s08(); s09(); s10(); s11(); s12();

pptx.writeFile({ fileName: "docs/sections/03-iot-hub-basics/slides/v3/v3-03-iot-hub-basics-opus.pptx" }).then((f) => console.log("written:", f));
