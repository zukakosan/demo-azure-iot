const pptxgen = require("pptxgenjs");
const {
  THEME,
  setupPresentation,
  addBackground,
  addTitle,
  addFooter,
  addCard,
  addPill,
  addLine,
  addDevice,
  addNote,
} = require("../../templates/azure-iot-workshop-theme");

const pptx = new pptxgen();
setupPresentation(pptx, "接続パターンとサービスの選択");

function addSlide1() {
  const slide = pptx.addSlide();
  addBackground(slide);
  addTitle(slide, "SECTION 02", "接続パターンは要件から決める", "サービス名ではなく、デバイスや設備をどこでどう接続するかから考える");

  slide.addText("接続パターンを決める主な問い", {
    x: 0.7, y: 1.38, w: 4.6, h: 0.28,
    fontFace: THEME.fonts.body, fontSize: 15, bold: true, color: THEME.colors.deepNavy, margin: 0,
  });

  const questions = [
    "直接クラウド接続できるか",
    "プロトコル変換が必要か",
    "低遅延 / オフラインが必要か",
    "拠点・設備ごとに条件が違うか",
    "前処理をどこで行うか",
  ];
  questions.forEach((q, i) => {
    addCard(slide, {
      x: 0.72, y: 1.82 + i * 0.72, w: 4.55, h: 0.52,
      title: q, body: "", color: i < 2 ? THEME.colors.azureBlue : THEME.colors.iotTeal,
    });
  });

  addPill(slide, "要件", 6.05, 2.0, 1.25, THEME.colors.deepNavy);
  addPill(slide, "接続パターン", 7.82, 2.0, 1.55, THEME.colors.azureBlue);
  addPill(slide, "Azure サービス", 10.0, 2.0, 1.65, THEME.colors.iotTeal);
  addLine(slide, 7.28, 2.17, 7.78, 2.17, THEME.colors.azureBlue, 1.5);
  addLine(slide, 9.35, 2.17, 9.95, 2.17, THEME.colors.azureBlue, 1.5);

  const patterns = [
    { t: "クラウド接続", b: "直接クラウドへ接続できるデバイス", c: THEME.colors.azureBlue, y: 2.82 },
    { t: "エッジ接続", b: "現場で収集・変換・低遅延処理", c: THEME.colors.iotTeal, y: 3.7 },
    { t: "ハイブリッド", b: "拠点や設備ごとに使い分け", c: THEME.colors.amber, y: 4.58 },
  ];
  patterns.forEach((p) => addCard(slide, { x: 6.35, y: p.y, w: 5.35, h: 0.68, title: p.t, body: p.b, color: p.c }));

  slide.addText("サービス名からではなく、要件から選ぶ", {
    x: 6.35, y: 5.68, w: 5.2, h: 0.32,
    fontFace: THEME.fonts.body, fontSize: 16, bold: true, color: THEME.colors.azureBlue, margin: 0,
  });

  addFooter(slide, 1);
  addNote(slide, [
    "IoT Hub と Azure IoT Operations を新旧や上下関係で比較しない。",
    "接続条件、現場ネットワーク、運用要件によって適した接続パターンが変わることを最初に置く。",
  ]);
}

function addSlide2() {
  const slide = pptx.addSlide();
  addBackground(slide, THEME.colors.azureBlue);
  addTitle(slide, "SECTION 02", "クラウド接続パターン", "デバイスがクラウドへ直接接続できる場合は Azure IoT Hub が中心になる");

  addDevice(slide, "D1", 0.9, 2.0);
  addDevice(slide, "D2", 1.75, 2.65);
  addDevice(slide, "D3", 0.9, 3.3);
  addDevice(slide, "D4", 1.75, 3.95);
  slide.addText("Devices", {
    x: 0.9, y: 4.65, w: 1.8, h: 0.2, fontFace: THEME.fonts.body,
    fontSize: 10, bold: true, color: THEME.colors.mutedText, align: "center", margin: 0,
  });

  addLine(slide, 2.75, 3.15, 4.25, 3.15, THEME.colors.azureBlue, 2);
  addPill(slide, "MQTT / AMQP / HTTPS", 3.0, 2.55, 2.0, THEME.colors.azureBlue);

  slide.addShape("roundRect", {
    x: 4.7, y: 2.05, w: 3.0, h: 2.2, rectRadius: 0.12,
    fill: { color: THEME.colors.azureBlue }, line: { color: THEME.colors.azureBlue },
    shadow: { type: "outer", color: "000000", blur: 2, offset: 1, angle: 45, opacity: 0.14 },
  });
  slide.addText("Azure IoT Hub", {
    x: 5.05, y: 2.75, w: 2.3, h: 0.35, fontFace: THEME.fonts.title,
    fontSize: 20, bold: true, color: THEME.colors.white, align: "center", margin: 0,
  });
  slide.addText("デバイス接続 / 認証 / 双方向通信", {
    x: 5.05, y: 3.2, w: 2.3, h: 0.25, fontFace: THEME.fonts.body,
    fontSize: 10, color: THEME.colors.white, align: "center", margin: 0,
  });

  addLine(slide, 7.85, 3.15, 8.65, 3.15, THEME.colors.azureBlue, 1.6);
  slide.addText("後続サービスへ", {
    x: 7.95, y: 2.58, w: 1.65, h: 0.22, fontFace: THEME.fonts.body,
    fontSize: 10.5, bold: true, color: THEME.colors.azureBlue, margin: 0,
  });
  slide.addShape("line", { x: 8.65, y: 2.23, w: 0, h: 1.84, line: { color: THEME.colors.azureBlue, width: 1.1 } });
  addLine(slide, 8.65, 2.23, 9.15, 2.23, THEME.colors.azureBlue, 1.1);
  addLine(slide, 8.65, 3.15, 9.15, 3.15, THEME.colors.azureBlue, 1.1);
  addLine(slide, 8.65, 4.07, 9.15, 4.07, THEME.colors.azureBlue, 1.1);
  addCard(slide, { x: 9.35, y: 1.85, w: 2.6, h: 0.74, title: "保存", body: "Storage / Lakehouse", color: THEME.colors.deepNavy });
  addCard(slide, { x: 9.35, y: 2.86, w: 2.6, h: 0.74, title: "分析", body: "Event Hubs / Fabric", color: THEME.colors.deepNavy });
  addCard(slide, { x: 9.35, y: 3.87, w: 2.6, h: 0.74, title: "可視化・通知", body: "Dashboard / App", color: THEME.colors.deepNavy });

  slide.addText("向いているシナリオ", {
    x: 0.85, y: 5.35, w: 2.2, h: 0.24, fontFace: THEME.fonts.body,
    fontSize: 12, bold: true, color: THEME.colors.deepNavy, margin: 0,
  });
  slide.addText("分散デバイス / クラウドで一元管理 / 現場側の変換要件が少ない", {
    x: 2.55, y: 5.34, w: 8.7, h: 0.25, fontFace: THEME.fonts.body,
    fontSize: 11.5, color: THEME.colors.text, margin: 0, fit: "shrink",
  });

  addFooter(slide, 2);
  addNote(slide, [
    "クラウド接続パターンでは、IoT Hub がデバイス接続の入口になる。",
    "IoT Hub はデバイス単位の ID と資格情報を持つ。保存や分析は後続サービスが担当する。",
  ]);
}

function addSlide3() {
  const slide = pptx.addSlide();
  addBackground(slide, THEME.colors.iotTeal);
  addTitle(slide, "SECTION 02", "エッジ接続パターン", "産業プロトコル、低遅延、オフライン、閉域網などの現場要件が強い場合に検討する");

  addCard(slide, { x: 0.78, y: 1.65, w: 2.2, h: 0.74, title: "PLC / 設備", body: "既存の工場設備", color: THEME.colors.deepNavy });
  addCard(slide, { x: 0.78, y: 2.7, w: 2.2, h: 0.74, title: "OPC UA", body: "産業プロトコル", color: THEME.colors.deepNavy });
  addCard(slide, { x: 0.78, y: 3.75, w: 2.2, h: 0.74, title: "現場ネットワーク", body: "閉域網 / 不安定な回線", color: THEME.colors.deepNavy });

  slide.addShape("roundRect", {
    x: 3.7, y: 1.45, w: 4.2, h: 3.55, rectRadius: 0.12,
    fill: { color: "E9FBFB" }, line: { color: THEME.colors.iotTeal, width: 1.6 },
  });
  slide.addText("Edge environment", {
    x: 4.0, y: 1.7, w: 3.55, h: 0.24, fontFace: THEME.fonts.body,
    fontSize: 12, bold: true, color: THEME.colors.iotTeal, margin: 0,
  });
  addCard(slide, { x: 4.15, y: 2.15, w: 3.3, h: 0.72, title: "Azure IoT Operations", body: "現場でデータを収集・変換・連携", color: THEME.colors.iotTeal });
  addPill(slide, "収集", 4.25, 3.35, 0.85, THEME.colors.iotTeal);
  addPill(slide, "変換", 5.25, 3.35, 0.85, THEME.colors.iotTeal);
  addPill(slide, "フィルタリング", 6.25, 3.35, 1.2, THEME.colors.iotTeal);
  addPill(slide, "クラウド連携", 5.25, 4.12, 1.45, THEME.colors.azureBlue);

  addLine(slide, 3.05, 2.02, 3.65, 2.02, THEME.colors.iotTeal, 1.2);
  addLine(slide, 3.05, 3.08, 3.65, 3.08, THEME.colors.iotTeal, 1.8);
  addLine(slide, 3.05, 4.12, 3.65, 4.12, THEME.colors.iotTeal, 1.2);
  addLine(slide, 5.1, 3.52, 5.22, 3.52, THEME.colors.iotTeal, 0.9);
  addLine(slide, 6.1, 3.52, 6.22, 3.52, THEME.colors.iotTeal, 0.9);
  addLine(slide, 5.95, 3.86, 5.95, 4.08, THEME.colors.azureBlue, 0.9);
  addLine(slide, 7.95, 3.1, 8.75, 3.1, THEME.colors.azureBlue, 1.8);
  slide.addText("Cloud", {
    x: 8.72, y: 1.42, w: 0.8, h: 0.2, fontFace: THEME.fonts.body,
    fontSize: 10, bold: true, color: THEME.colors.azureBlue, margin: 0,
  });
  addCard(slide, { x: 8.65, y: 1.75, w: 2.85, h: 0.78, title: "Azure", body: "クラウド連携", color: THEME.colors.azureBlue });
  addCard(slide, { x: 8.65, y: 2.86, w: 2.85, h: 0.78, title: "Fabric", body: "蓄積・分析・可視化", color: THEME.colors.azureBlue });
  addCard(slide, { x: 8.65, y: 3.97, w: 2.85, h: 0.78, title: "IoT Hub", body: "必要に応じて連携", color: THEME.colors.azureBlue });

  slide.addText("現場側で何を受け、加工し、クラウドへ送るかを設計する選択肢。", {
    x: 1.0, y: 5.58, w: 10.8, h: 0.34, fontFace: THEME.fonts.body,
    fontSize: 13, bold: true, color: THEME.colors.deepNavy, align: "center", margin: 0, fit: "shrink",
  });

  addFooter(slide, 3);
  addNote(slide, [
    "Azure IoT Operations は現場の産業機器やエッジ要件を扱う選択肢として説明する。",
    "低遅延、閉域網、常時クラウド接続できない環境が判断ポイントになる。",
  ]);
}

function addSlide4() {
  const slide = pptx.addSlide();
  addBackground(slide, THEME.colors.amber);
  addTitle(slide, "SECTION 02", "ハイブリッドと選択基準", "1 つのシステムでも、拠点・設備・ネットワーク要件ごとに接続パターンを使い分ける");

  addCard(slide, { x: 0.75, y: 1.35, w: 3.7, h: 1.0, title: "クラウド接続", body: "デバイスが直接 IoT Hub へ接続", color: THEME.colors.azureBlue });
  addCard(slide, { x: 4.85, y: 1.35, w: 3.7, h: 1.0, title: "エッジ接続", body: "現場で収集・変換してクラウドへ連携", color: THEME.colors.iotTeal });
  addCard(slide, { x: 8.95, y: 1.35, w: 3.7, h: 1.0, title: "ハイブリッド", body: "拠点や設備ごとに接続方式を併用", color: THEME.colors.amber });

  const x = 0.75, y = 2.58, rowH = 0.4;
  const col1 = 7.1, col2 = 4.45;
  slide.addShape("roundRect", {
    x, y, w: col1 + col2, h: rowH * 7 + 0.12, rectRadius: 0.08,
    fill: { color: THEME.colors.white }, line: { color: THEME.colors.cardBorder, width: 1 },
  });
  slide.addShape("rect", {
    x, y, w: col1 + col2, h: rowH,
    fill: { color: THEME.colors.deepNavy }, line: { color: THEME.colors.deepNavy },
  });
  slide.addText("要件", { x: x + 0.2, y: y + 0.13, w: col1 - 0.3, h: 0.12, fontFace: THEME.fonts.body, fontSize: 9, bold: true, color: THEME.colors.white, margin: 0 });
  slide.addText("主な選択肢", { x: x + col1 + 0.15, y: y + 0.13, w: col2 - 0.3, h: 0.12, fontFace: THEME.fonts.body, fontSize: 9, bold: true, color: THEME.colors.white, margin: 0 });

  const rows = [
    ["直接クラウド接続できる", "Azure IoT Hub"],
    ["OPC UA / プロトコル変換が必要", "Azure IoT Operations"],
    ["低遅延 / オフライン動作が必要", "Azure IoT Operations"],
    ["クラウド接続とエッジ接続が混在", "ハイブリッド"],
    ["設備を Azure リソースとして管理", "Azure Device Registry"],
    ["データを蓄積・分析・可視化", "Microsoft Fabric など"],
  ];
  rows.forEach((r, i) => {
    const yy = y + rowH * (i + 1);
    if (i % 2 === 1) {
      slide.addShape("rect", {
        x: x + 0.02, y: yy, w: col1 + col2 - 0.04, h: rowH,
        fill: { color: "F8FAFD" }, line: { color: "F8FAFD" },
      });
    }
    slide.addShape("line", {
      x: x + col1, y: yy, w: 0, h: rowH,
      line: { color: THEME.colors.cardBorder, width: 0.6 },
    });
    slide.addText(r[0], { x: x + 0.2, y: yy + 0.12, w: col1 - 0.3, h: 0.16, fontFace: THEME.fonts.body, fontSize: 9.2, color: THEME.colors.text, margin: 0, fit: "shrink" });
    slide.addText(r[1], { x: x + col1 + 0.15, y: yy + 0.11, w: col2 - 0.3, h: 0.16, fontFace: THEME.fonts.body, fontSize: 9.2, bold: true, color: THEME.colors.azureBlue, margin: 0, fit: "shrink" });
  });

  slide.addText("サービス選択は二択ではない。設備条件ごとに接続方式を決め、保存・分析・可視化まで含めて設計する。", {
    x: 0.9, y: 6.18, w: 11.3, h: 0.3, fontFace: THEME.fonts.body,
    fontSize: 12.3, bold: true, color: THEME.colors.deepNavy, align: "center", margin: 0, fit: "shrink",
  });

  addFooter(slide, 4);
  addNote(slide, [
    "簡易センサーは IoT Hub へ直接接続し、工場内の既存設備は Azure IoT Operations 経由で接続する構成もあり得る。",
    "次の章では、クラウド接続パターンの中心である IoT Hub の基本に入る。",
  ]);
}

addSlide1();
addSlide2();
addSlide3();
addSlide4();

pptx.writeFile({ fileName: "sections\\02-connection-patterns\\02-connection-patterns.pptx" });
