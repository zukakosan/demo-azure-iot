// 第2章スライド: design-template.md のルールに準拠し、slide.md の本文・表・図の指定を素材に
// pptxgenjs でネイティブ図形として一から作る。第3章 opus 版と同じ設計言語を用いる。
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
pptx.title = "第2章 接続パターンとサービスの選択";

const S = { rect: "rect", roundRect: "roundRect", line: "line", oval: "ellipse" };
const RUNNING = "第2章  接続パターンとサービスの選択 — 要件から接続先を選ぶ";

// ---- 共通パーツ ----------------------------------------------------------
function footer(slide, n) {
  slide.addShape(S.line, { x: MX, y: 7.02, w: CW, h: 0, line: { color: P.line, width: 1 } });
  slide.addText(RUNNING, {
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
  slide.addText(kicker.toUpperCase(), { x: MX + 0.82, y: 0.46, w: 10.5, h: 0.24, fontFace: JP, fontSize: 11, bold: true, color: P.cyan, charSpacing: 2, margin: 0, valign: "middle" });
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
  slide.addText(runs, { x: MX, y: 6.6, w: CW, h: 0.36, fontFace: JP, fontSize: 8, margin: 0, valign: "middle" });
}

function callout(slide, text, y, w = CW, x = MX, color = P.amber) {
  const h = 0.62;
  slide.addShape(S.rect, { x, y, w, h, fill: { color: P.soft }, line: { type: "none" } });
  slide.addShape(S.rect, { x, y, w: 0.09, h, fill: { color }, line: { type: "none" } });
  slide.addText(text, { x: x + 0.24, y, w: w - 0.4, h, fontFace: JP, fontSize: 13, bold: true, color: P.ink, margin: 0, valign: "middle" });
  return y + h;
}

function arrow(slide, x, y, w, label, color = P.teal) {
  slide.addShape(S.line, { x, y, w, h: 0, line: { color, width: 2, endArrowType: "triangle" } });
  if (label) slide.addText(label, { x: x - 0.1, y: y - 0.34, w: w + 0.2, h: 0.28, fontFace: JP, fontSize: 10, color: P.muted, align: "center", margin: 0, valign: "middle" });
}

function nodeBox(slide, x, y, w, h, title, sub, opts = {}) {
  const fill = opts.fill || P.softer;
  const titleColor = opts.titleColor || P.primary;
  slide.addShape(S.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: opts.border || P.line, width: opts.borderW || 1 } });
  if (sub) {
    slide.addText(title, { x: x + 0.12, y: y + 0.1, w: w - 0.24, h: h * 0.5 - 0.06, fontFace: JP, fontSize: opts.tSize || 13, bold: true, color: titleColor, align: "center", valign: "bottom", margin: 0 });
    slide.addText(sub, { x: x + 0.12, y: y + h * 0.5 - 0.02, w: w - 0.24, h: h * 0.5 - 0.06, fontFace: JP, fontSize: opts.sSize || 10.5, color: opts.subColor || P.muted, align: "center", valign: "top", margin: 0 });
  } else {
    slide.addText(title, { x: x + 0.12, y, w: w - 0.24, h, fontFace: JP, fontSize: opts.tSize || 13, bold: true, color: titleColor, align: "center", valign: "middle", margin: 0 });
  }
}

function tableAt(slide, head, rows, y, opts = {}) {
  const colW = opts.colW;
  const x = opts.x != null ? opts.x : MX;
  const w = opts.w != null ? opts.w : CW;
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
    x, y, w, colW, rowH: opts.rowH || 0.42,
    border: { pt: 0.75, color: P.line }, margin: [3, 6, 3, 6], valign: "middle", autoPage: false,
  });
}

// 3列の説明カード（見出し＋箇条書き）
function pointCard(slide, x, y, w, h, title, dot, body) {
  slide.addShape(S.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: P.softer }, line: { color: P.line, width: 1 } });
  slide.addShape(S.oval, { x: x + 0.2, y: y + 0.22, w: 0.16, h: 0.16, fill: { color: dot }, line: { type: "none" } });
  slide.addText(title, { x: x + 0.46, y: y + 0.12, w: w - 0.6, h: 0.36, fontFace: JP, fontSize: 14, bold: true, color: P.primary, margin: 0, valign: "middle" });
  slide.addText(body, { x: x + 0.24, y: y + 0.58, w: w - 0.46, h: h - 0.72, fontFace: JP, fontSize: 12, color: P.ink, margin: 0, valign: "top", lineSpacingMultiple: 1.06 });
}

// ---- 表紙 ----------------------------------------------------------------
function cover() {
  const s = pptx.addSlide();
  s.background = { color: P.primary };
  s.addShape(S.rect, { x: 0, y: 0, w: 13.33, h: 0.16, fill: { color: P.cyan }, line: { type: "none" } });
  s.addText("第 2 章", { x: 0.9, y: 1.5, w: 6, h: 0.5, fontFace: JP, fontSize: 18, bold: true, color: P.cyan, charSpacing: 3, margin: 0 });
  s.addText("接続パターンとサービスの選択", { x: 0.9, y: 2.05, w: 11.5, h: 1.2, fontFace: JP, fontSize: 44, bold: true, color: P.white, margin: 0 });
  s.addText("クラウド直接接続とエッジ経由接続を要件から選び、今回は IoT Hub への直接接続を扱う", {
    x: 0.9, y: 3.25, w: 11.5, h: 0.5, fontFace: JP, fontSize: 17, color: "BFE6EC", margin: 0,
  });
  s.addShape(S.line, { x: 0.92, y: 3.95, w: 3.2, h: 0, line: { color: P.cyan, width: 2.5 } });
  const items = ["クラウド直接接続", "エッジ経由接続", "ハイブリッド", "今回: IoT Hub"];
  let cx = 0.9;
  items.forEach((t) => {
    const w = 0.5 + t.length * 0.235;
    s.addShape(S.roundRect, { x: cx, y: 4.35, w, h: 0.5, rectRadius: 0.25, fill: { color: "12508C" }, line: { color: P.cyan, width: 1 } });
    s.addText(t, { x: cx, y: 4.35, w, h: 0.5, fontFace: JP, fontSize: 13, color: P.white, align: "center", valign: "middle", margin: 0 });
    cx += w + 0.25;
  });
  s.addText("Azure IoT ワークショップ ／ 本編 7 分・4 枚", {
    x: 0.9, y: 6.5, w: 11, h: 0.4, fontFace: JP, fontSize: 12, color: "9FC7D1", margin: 0,
  });
}

// ---- 02-01 接続パターンを決める3つの要件 --------------------------------
function s01() {
  const s = pptx.addSlide(); header(s, "01", "接続先を決める前提", "接続パターンを決める3つの要件");
  lead(s, "同じ温度データでも、現場の条件によって接続先が変わる。");

  // 左: 3つの要件（表）
  tableAt(s, ["確認する要件", "具体的な問い"], [
    ["通信方式", "デバイスはクラウド向けに通信できるか。設備との通信に OPC UA などを使うか。"],
    ["ネットワーク", "デバイスからクラウドへの接続を許可できるか。現場のネットワーク内に限定する必要があるか。"],
    ["処理する場所", "クラウドで処理できるか。通信遅延や切断に備えて、現場側で処理する必要があるか。"],
  ], 2.35, { x: MX, w: 6.9, colW: [1.7, 5.2], rowH: [0.5, 0.78, 0.78, 0.78], size: 11.5, hsize: 12 });

  // 右: 要件 → 接続パターンの分岐
  const bx = MX + 7.25, bw = RIGHT - (MX + 7.25);
  nodeBox(s, bx, 2.35, bw, 0.78, "通信・ネットワーク・処理場所の要件", null, { fill: P.soft, titleColor: P.primary, border: P.teal, borderW: 1.25, tSize: 12.5 });
  // 分岐線: 要件ボックスから下の2つの候補へ1本で下ろす
  s.addShape(S.line, { x: bx + bw / 2, y: 3.13, w: 0, h: 0.69, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  nodeBox(s, bx, 3.82, bw, 0.96, "クラウド直接接続", "Azure IoT Hub", { fill: P.softer, titleColor: P.primary, border: P.line, tSize: 13.5, sSize: 12, subColor: P.teal });
  nodeBox(s, bx, 4.94, bw, 1.12, "エッジ経由接続", "Azure IoT Operations\nAzure IoT Edge", { fill: P.softer, titleColor: P.primary, border: P.line, tSize: 13.5, sSize: 12, subColor: P.teal });

  callout(s, "接続パターンは、サービス名ではなく通信・ネットワーク・処理場所の要件から考える。", 5.42, 6.9, MX);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot/iot-introduction",
    "https://learn.microsoft.com/ja-jp/azure/iot-edge/about-iot-edge",
  ]);
  footer(s, 2);
}

// ---- 02-02 IoT Hub へのクラウド直接接続 ---------------------------------
function s02() {
  const s = pptx.addSlide(); header(s, "02", "クラウド直接接続", "IoT Hub へのクラウド直接接続");
  lead(s, "デバイスアプリがクラウドへ直接接続し、IoT Hub を通じてデータを送受信する。");

  // 構成図: デバイス → IoT Hub → 後続サービス
  const y = 2.5, h = 1.2;
  const dw = 3.0, hw = 3.5, ow = 3.0;
  const gap = (CW - dw - hw - ow) / 2;
  const dx = MX, hx = MX + dw + gap, ox = MX + dw + gap + hw + gap;
  s.addText("デバイス側", { x: dx, y: y - 0.34, w: dw, h: 0.24, fontFace: JP, fontSize: 10.5, bold: true, color: P.muted, margin: 0 });
  s.addText("Azure", { x: hx, y: y - 0.34, w: ox + ow - hx, h: 0.24, fontFace: JP, fontSize: 10.5, bold: true, color: P.muted, margin: 0 });
  nodeBox(s, dx, y, dw, h, "温度センサー", "デバイスアプリ", { fill: P.softer, titleColor: P.primary, tSize: 14, sSize: 11.5 });
  slideHub(s, hx, y, hw, h);
  nodeBox(s, ox, y, ow, h, "後続サービス", "蓄積・分析・可視化", { fill: P.softer, titleColor: P.primary, tSize: 14, sSize: 11.5 });
  arrow(s, dx + dw + 0.06, y + h / 2, gap - 0.12, "温度データ\nMQTT・AMQP・HTTPS");
  arrow(s, hx + hw + 0.06, y + h / 2, gap - 0.12, "データを配送");

  // 3列の役割説明
  const cy = 4.15, ch = 1.5, cw = (CW - 0.5) / 3;
  pointCard(s, MX, cy, cw, ch, "接続するもの", P.cyan, "温度センサーなどのデバイス上で動くアプリ。IoT Hub は MQTT・AMQP・HTTPS によるデバイス接続をサポートする。");
  pointCard(s, MX + cw + 0.25, cy, cw, ch, "適する条件", P.teal, "デバイスからクラウドへ通信でき、分散したデバイスのデータをクラウド側へ集めたい場合に向く。");
  pointCard(s, MX + (cw + 0.25) * 2, cy, cw, ch, "役割の分担", P.amber, "IoT Hub はデバイスとの通信を担い、蓄積・分析・可視化は後続のサービスで行う。");

  callout(s, "今回の想定: ローカル PC のプログラムを温度センサーに見立て、IoT Hub に直接接続する。", 5.86);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-protocols",
    "https://learn.microsoft.com/ja-jp/azure/iot/iot-introduction",
  ]);
  footer(s, 3);
}

function slideHub(s, x, y, w, h) {
  s.addShape(S.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: P.primary }, line: { type: "none" } });
  s.addText("Azure IoT Hub", { x: x + 0.12, y: y + 0.2, w: w - 0.24, h: 0.4, fontFace: JP, fontSize: 16, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
  s.addText("デバイス接続 / 認証 / 双方向通信", { x: x + 0.12, y: y + 0.64, w: w - 0.24, h: 0.36, fontFace: JP, fontSize: 11, color: "CFE3F6", align: "center", valign: "middle", margin: 0 });
}

// ---- 02-03 エッジ経由接続: IoT Operations と IoT Edge -------------------
function s03() {
  const s = pptx.addSlide(); header(s, "03", "エッジ経由接続", "エッジ経由接続: IoT Operations と IoT Edge");
  lead(s, "IoT Operations の構成例: 設備のデータを現場で収集・加工し、クラウドへ送る。");

  // パイプライン: 設備 → [runtime: コネクタ → ブローカー → データフロー] → クラウド
  const y = 2.5, h = 0.85;
  const ew = 2.0, iw = 1.85, gi = 0.32, cw = 2.6;
  const rtX = MX + ew + 0.4;
  const rtW = iw * 3 + gi * 2 + 0.36;
  const boxX = rtX - 0.18, boxY = y - 0.34, boxH = h + 0.58;
  s.addShape(S.roundRect, { x: boxX, y: boxY, w: rtW, h: boxH, rectRadius: 0.08, fill: { color: "EEF6FE" }, line: { color: P.teal, width: 1.25 } });
  s.addText("工場・現場 ／ Azure IoT Operations（Azure Arc 対応 Kubernetes）", {
    x: boxX, y: boxY + 0.03, w: rtW, h: 0.24, fontFace: JP, fontSize: 10, bold: true, color: P.teal, align: "center", margin: 0,
  });
  const cx = rtX + iw + gi, dfx = rtX + (iw + gi) * 2, cloudX = boxX + rtW + 0.4;
  nodeBox(s, MX, y, ew, h, "設備", "OPC UA サーバー", { fill: P.softer, titleColor: P.primary, tSize: 12.5, sSize: 10 });
  nodeBox(s, rtX, y, iw, h, "OPC UA\nコネクタ", null, { fill: P.white, titleColor: P.primary, border: P.line, tSize: 11.5 });
  nodeBox(s, cx, y, iw, h, "MQTT\nブローカー", null, { fill: P.white, titleColor: P.primary, border: P.line, tSize: 11.5 });
  nodeBox(s, dfx, y, iw, h, "データフロー", null, { fill: P.white, titleColor: P.primary, border: P.line, tSize: 11.5 });
  nodeBox(s, cloudX, y, cw, h, "クラウド", "例: Microsoft Fabric", { fill: P.soft, titleColor: P.primary, border: P.line, tSize: 12.5, sSize: 10 });
  s.addShape(S.line, { x: MX + ew + 0.04, y: y + h / 2, w: rtX - (MX + ew) - 0.08, h: 0, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  s.addText("OPC UA", { x: MX + ew - 0.18, y: y + h / 2 - 0.34, w: 0.76, h: 0.2, fontFace: JP, fontSize: 8, color: P.muted, align: "center", margin: 0 });
  s.addShape(S.line, { x: rtX + iw + 0.03, y: y + h / 2, w: gi - 0.06, h: 0, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  s.addShape(S.line, { x: cx + iw + 0.03, y: y + h / 2, w: gi - 0.06, h: 0, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  s.addShape(S.line, { x: dfx + iw + 0.04, y: y + h / 2, w: cloudX - (dfx + iw) - 0.08, h: 0, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  s.addText("加工したデータ", { x: dfx + iw - 0.15, y: y + h / 2 - 0.32, w: cloudX - (dfx + iw) + 0.3, h: 0.2, fontFace: JP, fontSize: 8, color: P.muted, align: "center", margin: 0 });

  // 3つの検討ポイント
  const py = 3.78, ph = 0.98, pw = (CW - 0.5) / 3;
  pointCard(s, MX, py, pw, ph, "設備との接続", P.cyan, "OPC UA は産業機器のデータ交換の標準。コネクタが設備のデータを取得し、ブローカーへ発行する。");
  pointCard(s, MX + pw + 0.25, py, pw, ph, "現場での処理", P.teal, "MQTT ブローカー（仲介役）で受け渡し、データフローで加工・配送。基盤は Kubernetes（土台）。");
  pointCard(s, MX + (pw + 0.25) * 2, py, pw, ph, "検討する条件", P.amber, "産業プロトコル対応、現場での低遅延処理、設備の直接インターネット接続の制限がある場合。");

  callout(s, "IoT Operations の注意: オフライン動作は最大72時間で、機能が低下する可能性がある。完全閉域での無期限運用を前提にしない。", 4.9);

  // IoT Edge は別の選択肢として独立表示
  const ey = 5.64, eh = 0.78;
  s.addShape(S.roundRect, { x: MX, y: ey, w: CW, h: eh, rectRadius: 0.06, fill: { color: P.softer }, line: { color: P.amber, width: 1.25 } });
  s.addShape(S.rect, { x: MX, y: ey, w: 0.09, h: eh, fill: { color: P.amber }, line: { type: "none" } });
  s.addText([
    { text: "Azure IoT Edge: もう一つのエッジ接続の選択肢　", options: { bold: true, color: P.primary } },
    { text: "デバイス上でコンテナー化した処理を実行し、IoT Hub へのゲートウェイとしても利用できる。現在もサポートされている（2026-09-08 確認。本章では紹介のみ）。", options: { color: P.ink } },
  ], { x: MX + 0.26, y: ey, w: CW - 0.5, h: eh, fontFace: JP, fontSize: 11.5, margin: 0, valign: "middle", lineSpacingMultiple: 1.02 });

  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-operations/overview-iot-operations",
    "https://learn.microsoft.com/ja-jp/azure/iot-operations/discover-manage-assets/overview-opc-ua-connector",
    "https://learn.microsoft.com/ja-jp/azure/iot-edge/about-iot-edge",
  ]);
  footer(s, 4);
}

// ---- 02-04 ハイブリッド構成と今回の対象範囲 -----------------------------
function s04() {
  const s = pptx.addSlide(); header(s, "04", "使い分けと対象範囲", "ハイブリッド構成と今回の対象範囲");
  lead(s, "ハイブリッドは、クラウド直接接続とエッジ経由接続を組み合わせる構成。拠点や設備の要件に合わせて使い分ける。");

  // 左: 2経路の構成図
  const y1 = 2.55, y2 = 3.75, h = 0.9, nw = 2.5, sw = 2.55;
  const nx = MX, sx = MX + nw + 0.75;
  const dx = sx + sw + 0.7, dw = 1.05;
  nodeBox(s, nx, y1, nw, h, "拠点A: 温度センサー", "クラウドへ直接接続可能", { fill: P.softer, titleColor: P.primary, tSize: 12, sSize: 10 });
  nodeBox(s, sx, y1, sw, h, "Azure IoT Hub", "今回の対象", { fill: P.soft, titleColor: P.primary, border: P.amber, borderW: 1.5, tSize: 13, sSize: 10.5, subColor: P.amber });
  nodeBox(s, nx, y2, nw, h, "拠点B: 工場設備", "OPC UA で現場接続", { fill: P.softer, titleColor: P.primary, tSize: 12, sSize: 10 });
  nodeBox(s, sx, y2, sw, h, "Azure IoT Operations", "構成紹介のみ", { fill: P.softer, titleColor: P.primary, border: P.line, tSize: 12, sSize: 10 });
  const midY = (y1 + h / 2 + y2 + h / 2) / 2;
  nodeBox(s, dx, midY - 0.75, dw, 1.5, "後続の\n蓄積・分析・可視化", null, { fill: P.softer, titleColor: P.primary, tSize: 11.5 });
  arrow(s, nx + nw + 0.05, y1 + h / 2, 0.65, null);
  arrow(s, nx + nw + 0.05, y2 + h / 2, 0.65, null);
  s.addShape(S.line, { x: sx + sw + 0.04, y: y1 + h / 2, w: 0.32, h: 0, line: { color: P.teal, width: 2 } });
  s.addShape(S.line, { x: sx + sw + 0.04, y: y2 + h / 2, w: 0.32, h: 0, line: { color: P.teal, width: 2 } });
  s.addShape(S.line, { x: sx + sw + 0.36, y: y1 + h / 2, w: 0, h: (y2 + h / 2) - (y1 + h / 2), line: { color: P.teal, width: 2 } });
  s.addShape(S.line, { x: sx + sw + 0.36, y: midY, w: dx - (sx + sw + 0.36) - 0.04, h: 0, line: { color: P.teal, width: 2, endArrowType: "triangle" } });
  s.addText("後続サービスの連携設定は第05章以降で扱う", { x: nx, y: 4.86, w: dx + dw - nx, h: 0.26, fontFace: JP, fontSize: 9.5, color: P.muted, align: "center", margin: 0 });

  // 右: 比較表
  const tx = dx + dw + 0.5, tw = RIGHT - tx;
  s.addText("要件から接続パターンと中心サービスを選ぶ", { x: tx, y: 2.28, w: tw, h: 0.26, fontFace: JP, fontSize: 11, bold: true, color: P.teal, margin: 0 });
  tableAt(s, ["現場の要件", "接続パターン", "中心サービス"], [
    ["デバイスが直接クラウドへ接続できる", "クラウド直接接続", "Azure IoT Hub"],
    ["OPC UA などで設備に接続し、現場側で処理する", "エッジ経由接続", "Azure IoT Operations"],
    ["デバイス上でコンテナー処理を行い、IoT Hub へ接続する", "エッジ経由接続", "Azure IoT Edge + IoT Hub"],
    ["直接接続とエッジ経由の要件が混在する", "ハイブリッド", "要件に応じて組み合わせ"],
  ], 2.6, { x: tx, w: tw, colW: [tw * 0.44, tw * 0.28, tw * 0.28], rowH: 0.66, size: 10.5, hsize: 11 });

  callout(s, "今回扱う範囲: デバイスアプリ → IoT Hub → データの受信・デバイス操作。", 5.86, CW, MX, P.teal);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot/iot-services-and-technologies",
    "https://learn.microsoft.com/ja-jp/azure/iot-operations/overview-iot-operations",
  ]);
  footer(s, 5);
}

cover();
s01(); s02(); s03(); s04();

pptx.writeFile({ fileName: "docs/sections/02-connection-patterns/02-connection-patterns-opus.pptx" }).then((f) => console.log("written:", f));
