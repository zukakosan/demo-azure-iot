// 第5章スライド: slides.md を素材に、pptxgenjs でネイティブ図形として生成する。
// 第4章 (generate-opus.js) と同じデザイン言語・ヘルパーを踏襲する。
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
pptx.title = "第5章 メッセージルーティング";

const S = { rect: "rect", roundRect: "roundRect", line: "line", oval: "ellipse" };

// ---- 共通パーツ ----------------------------------------------------------
function footer(slide, n) {
  slide.addShape(S.line, { x: MX, y: 7.02, w: CW, h: 0, line: { color: P.line, width: 1 } });
  slide.addText("第5章  メッセージルーティング — ルート・エンドポイント・配送先", {
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

// 2点を結ぶ矢印（分岐図用）。始点(x1,y1)→終点(x2,y2)。矢頭は終点側に付く。
function connect(slide, x1, y1, x2, y2, opts = {}) {
  const x = Math.min(x1, x2), y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
  slide.addShape(S.line, {
    x, y, w, h, flipH: x2 < x1, flipV: y2 < y1,
    line: { color: opts.color || P.teal, width: opts.width || 2, endArrowType: opts.arrow === false ? "none" : "triangle" },
  });
}

// 汎用ノード（角丸ボックス + タイトル + 補足）
function node(slide, x, y, w, h, title, sub, opts = {}) {
  const border = opts.border || P.teal;
  slide.addShape(S.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: opts.fill || P.softer }, line: { color: border, width: opts.lw || 1.25 } });
  const ty = sub ? y + 0.08 : y;
  const th = sub ? 0.34 : h;
  slide.addText(title, { x: x + 0.12, y: ty, w: w - 0.24, h: th, fontFace: JP, fontSize: opts.size || 12.5, bold: true, color: opts.color || P.primary, align: "center", valign: "middle", margin: 0 });
  if (sub) slide.addText(sub, { x: x + 0.12, y: y + 0.36, w: w - 0.24, h: h - 0.42, fontFace: JP, fontSize: 10.5, color: P.muted, align: "center", valign: "top", margin: 0 });
}

// ---- 表紙 ----------------------------------------------------------------
function cover() {
  const s = pptx.addSlide();
  s.background = { color: P.primary };
  s.addShape(S.rect, { x: 0, y: 0, w: 13.33, h: 0.16, fill: { color: P.cyan }, line: { type: "none" } });
  s.addText("第 5 章", { x: 0.9, y: 1.5, w: 6, h: 0.5, fontFace: JP, fontSize: 18, bold: true, color: P.cyan, charSpacing: 3, margin: 0 });
  s.addText("メッセージルーティング", { x: 0.9, y: 2.05, w: 11.5, h: 1.2, fontFace: JP, fontSize: 44, bold: true, color: P.white, margin: 0 });
  s.addText("IoT Hub が受け取った D2C メッセージを、条件に応じて後続サービスへ配送する", {
    x: 0.9, y: 3.25, w: 11.5, h: 0.5, fontFace: JP, fontSize: 17, color: "BFE6EC", margin: 0,
  });
  s.addShape(S.line, { x: 0.92, y: 3.95, w: 3.2, h: 0, line: { color: P.cyan, width: 2.5 } });
  const items = ["ルート / エンドポイント", "配送先の選択", "ホット / コールドパス", "到達確認"];
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

// ---- 05-01 IoT Hub の後ろに何をつなぐか ---------------------------------
function s01() {
  const s = pptx.addSlide(); header(s, "01", "ルーティングの役割", "IoT Hub の後ろに何をつなぐか");
  lead(s, "IoT Hub は取り込み口であり、保存・分析・可視化は後続サービスと組み合わせる。");
  // 左: IoT Hub、右: 主な配送先を縦に分岐
  const dests = [
    ["Azure Storage", P.teal],
    ["Azure Event Hubs", P.teal],
    ["Azure Service Bus", P.teal],
    ["Azure Cosmos DB", P.teal],
    ["Microsoft Fabric Eventstreams（プレビュー）", P.amber],
  ];
  const dx = 7.3, dw = RIGHT - 7.3, dh = 0.5, top = 2.35, step = 0.62;
  const cy = top + (dests.length - 1) * step / 2 + dh / 2;
  const ihW = 2.9, ihH = 1.5, ihX = MX, ihY = cy - ihH / 2;
  s.addShape(S.roundRect, { x: ihX, y: ihY, w: ihW, h: ihH, rectRadius: 0.08, fill: { color: P.primary }, line: { type: "none" } });
  s.addText("IoT Hub", { x: ihX, y: ihY + 0.28, w: ihW, h: 0.5, fontFace: JP, fontSize: 20, bold: true, color: P.white, align: "center", margin: 0 });
  s.addText("取り込み口（D2C 受信）", { x: ihX, y: ihY + 0.86, w: ihW, h: 0.4, fontFace: JP, fontSize: 11.5, color: "BFE6EC", align: "center", margin: 0 });
  const busX = 5.7;
  connect(s, ihX + ihW, cy, busX, cy, { arrow: false, color: P.line, width: 1.5 });
  dests.forEach((d, i) => {
    const y = top + i * step;
    const dcY = y + dh / 2;
    connect(s, busX, cy, dx, dcY, { color: P.teal });
    s.addShape(S.roundRect, { x: dx, y, w: dw, h: dh, rectRadius: 0.06, fill: { color: P.softer }, line: { color: d[1], width: 1.25 } });
    s.addShape(S.oval, { x: dx + 0.2, y: y + dh / 2 - 0.06, w: 0.12, h: 0.12, fill: { color: d[1] }, line: { type: "none" } });
    s.addText(d[0], { x: dx + 0.44, y, w: dw - 0.6, h: dh, fontFace: JP, fontSize: 12.5, bold: true, color: P.primary, valign: "middle", margin: 0 });
  });
  callout(s, "一つのメッセージは、条件に一致する複数の配送先へ送れる。1つの配送先だけに振り分ける仕組みではない。", 5.6, CW, MX, P.cyan);
  sources(s, ["https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c#routing-endpoints"]);
  footer(s, 2);
}

// ---- 05-02 データソース・ルート・エンドポイント -------------------------
function s02() {
  const s = pptx.addSlide(); header(s, "02", "設定の3要素", "データソース・ルート・エンドポイント");
  lead(s, "ルートは配送ルール、エンドポイントは配送先の設定。データソースは配送対象の種類を選ぶ。");
  tableAt(s, ["用語", "決めること", "今回の例"], [
    ["データソース", "何を配送対象にするか", "デバイスのテレメトリ"],
    ["エンドポイント", "どこへ送るか", "Blob Storage のコンテナーを指す設定"],
    ["ルート", "対象・条件・配送先を結び付けるルール", "温度28度以上のテレメトリを保存先へ送る"],
  ], 2.15, { colW: [3.0, 4.5, 4.59], rowH: 0.58 });
  // データソースは「何を送ったか」で決まる
  s.addText("データソースは「何を送ったか」で決まる", { x: MX, y: 4.5, w: CW, h: 0.3, fontFace: JP, fontSize: 12.5, bold: true, color: P.teal, margin: 0, valign: "middle" });
  const chipW = (CW - 0.4) / 2;
  node(s, MX, 4.85, chipW, 0.62, "send_message() の温度・湿度", "→ デバイス テレメトリ メッセージ", { border: P.teal, size: 12 });
  node(s, MX + chipW + 0.4, 4.85, chipW, 0.62, "Reported プロパティの更新", "→ デバイス ツイン変更イベント", { border: P.cyan, size: 12 });
  callout(s, "エンドポイント名とストレージアカウント名は別で、同じ名前にする必要はない。設定は Portal の「メッセージ ルーティング」で行う。", 5.7);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/how-to-routing-portal?tabs=storage",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c",
  ]);
  footer(s, 3);
}

// ---- 05-03 目的から配送先を選ぶ -----------------------------------------
function s03() {
  const s = pptx.addSlide(); header(s, "03", "配送先の使い分け", "目的から配送先を選ぶ");
  lead(s, "配送先は、アプリでの受信・履歴保存・検索・ストリーム分析・業務処理という目的で選ぶ。");
  tableAt(s, ["配送先", "主な目的", "温度・湿度データでの利用例"], [
    ["組み込みエンドポイント", "アプリがメッセージを読み取る", "IoT Explorer 受信確認（保持: 既定1日・最大7日）"],
    ["Blob Storage / ADLS Gen2", "ファイルとして履歴を保存し後で分析", "全測定データを残し後日まとめて集計"],
    ["Cosmos DB", "DB に保存し条件を指定して取り出す", "特定デバイスの測定履歴を画面に表示"],
    ["Event Hubs", "大量の連続データをストリーム処理へ", "多数デバイスの温度を継続的に集計・分析"],
    ["Service Bus", "業務処理へメッセージを渡す", "高温通知から保守チケットを作成"],
  ], 2.15, { colW: [3.1, 3.7, 5.29], rowH: 0.56, size: 11.5 });
  callout(s, "組み込みは期限付きの読み取り口で、長期保存は別の配送先が必要。目的に応じて複数の配送先へ同時に送れる。", 5.6);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-endpoints#custom-endpoints-for-message-routing",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-read-builtin",
  ]);
  footer(s, 4);
}

// ---- 05-04 ホット/コールドパスに同時配送 --------------------------------
function s04() {
  const s = pptx.addSlide(); header(s, "04", "2経路への同時配送", "ホットパスとコールドパスに同時配送する");
  lead(s, "同じテレメトリを、低遅延で活用するホットパスと、蓄積して後から分析するコールドパスへ配送できる。");
  // IoT Hub 左、上=ホット、下=コールド
  const hotY = 2.5, coldY = 4.9, bh = 0.64;
  const ihX = MX, ihW = 2.7, ihY = 3.5, ihH = 1.3;
  const ihCy = ihY + ihH / 2;
  s.addShape(S.roundRect, { x: ihX, y: ihY, w: ihW, h: ihH, rectRadius: 0.08, fill: { color: P.primary }, line: { type: "none" } });
  s.addText("IoT Hub", { x: ihX, y: ihY + 0.32, w: ihW, h: 0.5, fontFace: JP, fontSize: 18, bold: true, color: P.white, align: "center", margin: 0 });
  s.addText("D2C を2ルートへ", { x: ihX, y: ihY + 0.82, w: ihW, h: 0.35, fontFace: JP, fontSize: 11, color: "BFE6EC", align: "center", margin: 0 });
  const busX = 4.0, b1x = 4.5, b1w = 3.1, b2x = 8.0, b2w = RIGHT - 8.0;
  connect(s, ihX + ihW, ihCy, busX, ihCy, { arrow: false, color: P.line, width: 1.5 });
  // ホットパス
  s.addText("ホットパス", { x: b1x, y: hotY - 0.36, w: 3.0, h: 0.3, fontFace: JP, fontSize: 12, bold: true, color: P.teal, margin: 0 });
  connect(s, busX, ihCy, b1x, hotY + bh / 2, { color: P.teal });
  s.addText("true", { x: busX - 0.1, y: (ihCy + hotY + bh / 2) / 2 - 0.28, w: 0.9, h: 0.24, fontFace: MONO, fontSize: 10, color: P.muted, margin: 0 });
  node(s, b1x, hotY, b1w, bh, "Event Hubs", null, { border: P.teal });
  connect(s, b1x + b1w, hotY + bh / 2, b2x, hotY + bh / 2, { color: P.teal });
  node(s, b2x, hotY, b2w, bh, "ストリーム処理・通知", null, { border: P.line, color: P.ink });
  // コールドパス
  s.addText("コールドパス", { x: b1x, y: coldY - 0.36, w: 3.0, h: 0.3, fontFace: JP, fontSize: 12, bold: true, color: P.primary, margin: 0 });
  connect(s, busX, ihCy, b1x, coldY + bh / 2, { color: P.teal });
  s.addText("true", { x: busX - 0.1, y: (ihCy + coldY + bh / 2) / 2 - 0.02, w: 0.9, h: 0.24, fontFace: MONO, fontSize: 10, color: P.muted, margin: 0 });
  node(s, b1x, coldY, b1w, bh, "Blob Storage / ADLS", null, { border: P.primary });
  connect(s, b1x + b1w, coldY + bh / 2, b2x, coldY + bh / 2, { color: P.teal });
  node(s, b2x, coldY, b2w, bh, "バッチ分析", null, { border: P.line, color: P.ink });
  callout(s, "ホット／コールドは処理経路の呼び方で IoT Hub の専用モードではない。配送だけで KPI 計算やアラートは完成しない。", 5.85);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/architecture/databases/guide/big-data-architectures",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c#routing-endpoints",
  ]);
  footer(s, 5);
}

// ---- 05-05 本文を使う条件 -----------------------------------------------
function s05() {
  const s = pptx.addSlide(); header(s, "05", "本文に基づくクエリ", "本文を使う条件で対象を絞る");
  lead(s, "ルーティングクエリは各メッセージを評価し、結果が true のメッセージが配送対象になる。");
  codeBox(s, 'ルート条件の例:    true    /    $body.temperature >= 28', MX, 2.25, CW, 0.5);
  tableAt(s, ["メッセージ本文", "条件 true", "条件 $body.temperature >= 28"], [
    ['{"temperature":25,"humidity":45}', "対象", "対象外"],
    ['{"temperature":29,"humidity":45}', "対象", "対象"],
  ], 3.0, { colW: [5.2, 2.4, 4.49], rowH: 0.62, size: 12.5 });
  s.addText("一致時に配送するのは、湿度も含むメッセージ全体。列を抽出する SELECT ではなく、対象を絞る WHERE に相当する。", { x: MX, y: 5.0, w: CW, h: 0.4, fontFace: JP, fontSize: 12.5, color: P.ink, margin: 0, valign: "middle" });
  callout(s, "これは IoT Hub が評価する条件式で、デバイス側 Python の分岐ではない。contentType・contentEncoding が無いと本文が Base64 になり、条件で温度を読めない。", 5.55);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-routing-query-syntax#query-based-on-message-body",
  ]);
  footer(s, 6);
}

// ---- 05-06 Storage への保存 ---------------------------------------------
function s06() {
  const s = pptx.addSlide(); header(s, "06", "バッチ書き込みと形式", "Storage にいつ、どう保存されるか");
  lead(s, "Storage へは一件ずつ即時保存せず、時間経過かサイズ到達の、どちらか先に満たした方で書き出す。");
  tableAt(s, ["設定", "意味", "設定範囲"], [
    ["バッチ頻度", "たまったデータを書き出す時間間隔", "60〜720秒"],
    ["チャンクサイズ", "書き出しの基準となるデータ量", "10〜500 MB"],
  ], 2.15, { colW: [2.9, 6.0, 3.19], rowH: 0.55 });
  // 書き出しフロー
  const fy = 3.95, fh = 0.66;
  node(s, MX, fy, 3.4, fh, "メッセージが蓄積", null, { border: P.line, color: P.ink });
  connect(s, MX + 3.4, fy + fh / 2, MX + 4.0, fy + fh / 2, { color: P.teal });
  node(s, MX + 4.0, fy, 4.2, fh, "時間経過 または サイズ到達", null, { border: P.amber });
  connect(s, MX + 8.2, fy + fh / 2, MX + 8.8, fy + fh / 2, { color: P.teal });
  node(s, MX + 8.8, fy, CW - 8.8, fh, "Blob へ書き出し", null, { border: P.primary });
  // 形式チップ
  const chipW = (CW - 0.4) / 2;
  node(s, MX, 4.85, chipW, 0.58, "JSON", "内容を確認しやすい", { border: P.teal, size: 12 });
  node(s, MX + chipW + 0.4, 4.85, chipW, 0.58, "Avro", "対応ツール前提のコンパクトなバイナリ", { border: P.cyan, size: 12 });
  callout(s, "既存エンドポイントの保存形式は後から変更できない。JSON では contentType・contentEncoding を指定する（未指定だと Base64）。", 5.6);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-endpoints#azure-storage-as-a-routing-endpoint",
    "https://learn.microsoft.com/ja-jp/azure/templates/microsoft.devices/2019-11-04/iothubs",
  ]);
  footer(s, 7);
}

// ---- 05-07 配送経路の明示と到達確認 -------------------------------------
function s07() {
  const s = pptx.addSlide(); header(s, "07", "経路の明示と検証", "配送経路の明示と到達確認");
  lead(s, "必要な配送経路は、組み込みエンドポイントも含めて通常ルートで明示し、フォールバックだけに依存しない。");
  const py = 2.35, ph = 3.0, pw = (CW - 0.4) / 2;
  const lx = MX, rx = MX + pw + 0.4;
  // 左パネル: 明示ルート
  s.addShape(S.roundRect, { x: lx, y: py, w: pw, h: ph, rectRadius: 0.08, fill: { color: P.softer }, line: { color: P.teal, width: 1.25 } });
  s.addShape(S.rect, { x: lx, y: py, w: pw, h: 0.44, fill: { color: P.primary }, line: { type: "none" } });
  s.addText("明示ルート（推奨）", { x: lx, y: py, w: pw, h: 0.44, fontFace: JP, fontSize: 13, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
  const lc = lx + pw / 2;
  const lBoxW = pw / 2 - 0.35;
  const lLeftCx = lx + 0.25 + lBoxW / 2;
  const lRightCx = lc + 0.1 + lBoxW / 2;
  node(s, lc - 1.1, py + 0.62, 2.2, 0.5, "IoT Hub", null, { border: P.primary, fill: P.white });
  connect(s, lc, py + 1.12, lLeftCx, py + 1.65, { color: P.teal });
  connect(s, lc, py + 1.12, lRightCx, py + 1.65, { color: P.teal });
  node(s, lx + 0.25, py + 1.65, lBoxW, 0.72, "Storage 宛て", "条件 true", { border: P.teal, size: 11.5 });
  node(s, lc + 0.1, py + 1.65, lBoxW, 0.72, "events 宛て", "条件 true（組み込み）", { border: P.teal, size: 11.5 });
  s.addText("同じメッセージが両方へ同時配送", { x: lx + 0.2, y: py + 2.5, w: pw - 0.4, h: 0.4, fontFace: JP, fontSize: 11.5, color: P.ink, align: "center", valign: "middle", margin: 0 });
  // 右パネル: フォールバック
  s.addShape(S.roundRect, { x: rx, y: py, w: pw, h: ph, rectRadius: 0.08, fill: { color: P.softer }, line: { color: P.amber, width: 1.25 } });
  s.addShape(S.rect, { x: rx, y: py, w: pw, h: 0.44, fill: { color: P.amber }, line: { type: "none" } });
  s.addText("フォールバック", { x: rx, y: py, w: pw, h: 0.44, fontFace: JP, fontSize: 13, bold: true, color: P.white, align: "center", valign: "middle", margin: 0 });
  const rc = rx + pw / 2;
  node(s, rc - 1.1, py + 0.62, 2.2, 0.5, "IoT Hub", null, { border: P.primary, fill: P.white });
  connect(s, rc, py + 1.12, rc, py + 1.75, { color: P.amber });
  s.addText("どのルートにも不一致のときだけ", { x: rx + 0.2, y: py + 1.2, w: pw - 0.4, h: 0.3, fontFace: JP, fontSize: 10.5, italic: true, color: P.muted, align: "center", margin: 0 });
  node(s, rc - pw / 2 + 0.5, py + 1.75, pw - 1.0, 0.62, "組み込みエンドポイント", null, { border: P.amber, size: 12 });
  s.addText("配送先障害時の代替保存先ではない", { x: rx + 0.2, y: py + 2.5, w: pw - 0.4, h: 0.4, fontFace: JP, fontSize: 11.5, color: P.ink, align: "center", valign: "middle", margin: 0 });
  callout(s, "送信成功だけで完了とせず各宛先で到達確認。配送先の障害・遅延はメトリック・リソースログ・エンドポイントの正常性で監視。", 5.6);
  sources(s, [
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c#fallback-route",
    "https://learn.microsoft.com/ja-jp/azure/iot-hub/troubleshoot-message-routing",
  ]);
  footer(s, 8);
}

// ---- 05-08 確認問題 ------------------------------------------------------
function s08() {
  const s = pptx.addSlide(); header(s, "08", "理解度の確認", "配送先とルートの設計を事例で選び分ける");
  lead(s, "次の場面で、どう設計するか説明してください。");
  const qs = [
    "受信したテレメトリを長期保存したい。IoT Hub の組み込みエンドポイントだけで完結するか。",
    "同じ温度データをリアルタイム監視と日次集計に使う。どの2経路を用意し、どこで分析するか。",
    "しきい値28度を超えたデータだけ別の処理へ流す。何を使い、湿度の項目も配送されるか。",
    "Storage 向けルートを追加したら IoT Explorer に表示されなくなった。何を確認するか。",
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
  callout(s, "次章: 実際に IoT Hub を作成し、デバイスを接続してテレメトリ送信を確認するデモへ進む。", 6.05, CW, MX, P.cyan);
  footer(s, 9);
}

cover();
s01(); s02(); s03(); s04(); s05(); s06(); s07(); s08();

pptx.writeFile({ fileName: "docs/sections/05-message-routing/v1/v1-05-message-routing.pptx" }).then((f) => console.log("written:", f));
