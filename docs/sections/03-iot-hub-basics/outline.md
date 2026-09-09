# 3. IoT Hub の基本: 登録・接続・送受信

具体的な投影本文・図の配置・講師ノートは [slide.md](slide.md)、レビュー結果は [review.md](review.md)を参照する。本ファイルは章の目的と範囲を管理し、ページごとの本文修正は slide.md を起点に行う。

現行版は [PowerPoint](03-iot-hub-basics-protocols.pptx) と [PDF](03-iot-hub-basics-protocols.pdf)、[再生成手順](BUILD.md)、[描画レビュー](verification/protocols/review.md) を参照。プロトコル比較を独立させた12枚・25分程度の構成とする。前回の11枚版は別名で保持する。

## この章の目的
IoT Hub を使い始めるために、デバイスアプリ・IoT Hub・バックエンドの役割と、登録、認証、接続、テレメトリの送信・受信確認までの一連の流れを理解する。認証・権限・通信保護は接続の基礎として扱い、本番運用の詳細設計とは分ける。

## 所要時間と本編・補足の区分
- アジェンダ上の目安は25分程度。枚数の上限・下限は設けず、現行原稿は12枚とする。
- 本編は「誰が、どの資格情報で接続し、何を送り、どこで確認するか」に集中する。
- プロトコルの細かな比較、SDK のAPI一覧、証明書の作成操作は補足とする。
- 20分に圧縮せず、認証・受信経路・理解度確認に時間を配分する。全体120分の参考表では質疑・予備の5分を本章へ移し、他章の説明時間は維持する。配分は固定の制約ではなく、講義全体の所要時間を踏まえて調整する。

## 聞き手に持ち帰ってほしいこと
- デバイスアプリ、IoT Hub、受信・操作するバックエンドは役割が異なる
- Hub の作成、デバイス ID の登録、認証、接続、送信は別の段階である
- Device ID は識別子であり、ID を知っているだけでは認証できない
- デバイス側とバックエンド側では、使う資格情報・権限・SDK を区別する
- D2C の送信ログと、受信側で確認したメッセージを対応させて見る
- IoT Hub は接続と通信の基盤であり、長期保存・分析・業務処理の完了までを担うものではない

## Day 1 の取り込み方と他章との分担
参照資料は [IoT Readiness Refresher 2025 - Day 01.pptx](../../references/IoT%20Readiness%20Refresher%202025%20-%20Day%2001.pptx)。Day 1 の主要な基礎トピックを取り込むが、後半のセキュリティ事例・本番化ベストプラクティスまで第3章に集約することは目指さない。資料の既受講も前提にしない。

| Day 1 の内容 | この章での扱い | 他章への分担 |
| --- | --- | --- |
| p.5-7: IoT の概念・アーキテクチャ | 前章の全体図から IoT Hub 周辺を取り出す | 全体像と接続パターンの説明は第1・2章 |
| p.8-9: IoT Hub の基本・通信・配送 | 主体、ID、認証、D2C の送受信を具体化する | 制御方式の比較は第4章、配送設定は第5章 |
| p.10: デモ | 登録画面と送受信ログを使い、概念と実物を対応させる | 一連のライブ実演は第6章 |
| p.13: STRIDE | フレームワーク名や6分類の解説は本編に入れない | 第7章で脅威を整理する際の補足候補とする |
| p.14-15: Protect / Detect / Respond・セキュリティ事例 | 認証・権限・通信保護が必要な理由だけを身近な例で説明する | 防御・検知・対応の設計や事例の深掘りは第7章 |
| p.16-17: 本番化・多層のセキュリティ | デモで接続できたことと、本番運用の準備完了は違うと伝える | 資格情報運用、監視、復旧、容量、費用は第7章 |

**第3章では仕組みと必要性、第7章では設計値・手順・責任者を扱う。** STRIDE を先に覚えさせるのではなく、この章では「他のデバイスになりすませないか」「操作してよい相手か」「通信内容が見られないか」という問いを認証・権限・通信保護につなげる。第7章への分担は本outlineの編集方針であり、第7章本文への反映は別途行う。

## 扱う内容
### 1. デバイスアプリ・IoT Hub・バックエンドの役割
前章の温度センサーの全体図を使い、次の3者を明確にする。

| 主体 | 担当すること | 今回の見せ方 |
| --- | --- | --- |
| デバイスアプリ | 測定値を送り、指示や設定変更を受けて処理する | ローカル PC のプログラムを温度センサーに見立てる |
| IoT Hub | デバイスの接続・認証、双方向通信、後続へのメッセージ配送を担う | Azure 上の接続先として示す |
| バックエンドアプリ・ツール | データを受信・利用し、デバイスへ操作や設定変更を要求する | デモでは受信・操作ツールがその役割を担う |

この分担は IoT Hub と SDK の役割に基づく。デバイスに必要な処理を IoT Hub が代わりに実装するわけではなく、長期保存・分析は後続サービスやアプリと組み合わせる（[IoT Hub の概要](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-concepts-and-iot-hub)、[デバイスとバックエンドの SDK](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-sdks)）。

### 2. Hub 作成から接続までの段階
1. Azure 上に IoT Hub を作成する。
2. 対象 Hub にデバイス ID と認証方式を登録する。
3. デバイスアプリに接続先と、そのデバイス用の資格情報を準備する。
4. アプリを起動し、認証を伴う接続を行う。
5. 接続後にテレメトリを送り、受信側で確認する。

IoT Hub の ID レジストリに登録があることと、実際にデバイスアプリが接続していることは別である。Device ID は Hub 内のデバイスを識別し、資格情報はそのデバイスとして認証するために使う（[デバイスの登録と認証](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-concepts-and-iot-hub#connect-and-authenticate-devices)）。

本章では手動登録を前提にする。多数台を登録する DPS の流れや Enrollment の種類は、第7章で扱う。接続できない場合の入口として「登録先の Hub、Device ID、資格情報、ネットワーク」を挙げるが、障害診断手順の説明には広げない。

### 3. 認証・権限・通信保護の基礎
「登録済みの温度センサーとして接続する」と「クラウド側からデバイスを操作する」を分けて説明する。

| 観点 | この章で答える問い | 説明する内容 |
| --- | --- | --- |
| 認証 | 誰として接続するか | デバイス ID と資格情報、バックエンドの認証主体 |
| 認可・権限 | 何をしてよいか | 自分のデバイスとして送信する権限と、クラウド側でデバイスを操作する権限の違い |
| 通信保護 | 通信経路で内容を守れるか | TLS による通信保護。認証・認可とは目的を分けて考える |

デバイスの認証は、対称キーを使う SAS トークン方式と X.509 証明書方式を入口として示す。デモで使う対称キー方式のデバイス接続文字列は、接続先・Device ID・キーを含むため、単なる接続先 URL ではない。デバイス固有の資格情報と、サービス側の共有アクセスポリシーの資格情報を混同しない（[SAS によるアクセス制御](https://learn.microsoft.com/ja-jp/azure/iot-hub/authenticate-authorize-sas)、[X.509 による認証](https://learn.microsoft.com/ja-jp/azure/iot-hub/authenticate-authorize-x509)）。

バックエンドのサービス API では Microsoft Entra ID と Azure RBAC、または共有アクセスポリシーに基づく SAS を利用する。Microsoft Entra ID を使うサービス側の認証を、デバイス API の認証にもそのまま使えると説明しない（[サービス API の認証とデバイス API との違い](https://learn.microsoft.com/ja-jp/azure/iot-hub/authenticate-authorize-azure-ad)）。TLS は通信保護の基礎として扱い、バージョンや暗号スイートの選定は本章の対象外とする（[IoT Hub の TLS サポート](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-tls-support)）。

本章で示す注意は「資格情報を他のデバイスと共有しない」「キーを画面・コード・ログに露出させない」までとする。証明書方式の本番選定、発行・更新・失効、秘密鍵の保護手段、最小権限の具体的な割り当ては第7章へ回す（[IoT Hub のセキュリティ推奨事項](https://learn.microsoft.com/ja-jp/azure/iot-hub/secure-azure-iot-hub#identity-and-access-management)）。

### 4. 通信プロトコルと SDK の位置づけ
MQTT、AMQP、HTTPS はデバイスと IoT Hub の通信方式であり、SDK はアプリからその通信機能を利用するためのライブラリとして説明する。SDK を利用することと、通信プロトコルを利用することは対立する選択ではない。IoT Hub は汎用 MQTT ブローカーではなく、任意のトピックで自由にデバイス間通信するサービスとしては説明しない（[IoT Hub の MQTT サポート](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-mqtt-connect-to-iot-hub)）。

| やりたいこと | 主に使う SDK | 今回の例 |
| --- | --- | --- |
| デバイスから送信し、指示・設定変更を受信する | IoT Hub デバイス SDK | 温度センサー役のアプリ |
| デバイス ID を管理し、操作・設定変更を要求する | IoT Hub サービス SDK | デバイスを操作するバックエンド |
| IoT Hub リソース自体を作成・管理する | IoT Hub 管理 SDK | Hub の作成やリソース設定 |
| 組み込みエンドポイントから D2C を読み取る | Event Hubs SDK | テレメトリを処理する受信アプリ |

最初の3つは IoT Hub SDK の分類であり、D2C の読み取りには Event Hubs 互換の経路を使う。バックエンドの処理をすべて IoT Hub サービス SDK 一つで行うとは説明しない（[IoT Hub SDK の分類](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-sdks)、[D2C 読み取りに対応する SDK](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-read-builtin#sdk-samples)）。

本編では役割の対応を理解することを優先し、対応言語の一覧、MQTT トピックの記法、API の呼び出し方は補足とする。

### 5. D2C テレメトリの送信
共通ユースケースの温度センサーが測定値を定期送信する例を使う。D2C は温度・湿度などの観測データやイベントをデバイスからクラウドへ送る通信である（[IoT Hub のメッセージング](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-concepts-and-iot-hub)）。

講義用の本文例は `{"temperature":25,"humidity":45}` とし、測定値を作るのはデバイスアプリであることを確認する。本文の項目と、送信元デバイスを示す情報は画面上で区別する。JSON を IoT Hub が自動で分析・可視化するわけではない。

IoT デバイスには一時的な切断や不安定な通信があることを前提にする。本章では「常時つながっているとは限らない」と伝え、再試行・バッファリング・重複対策は第7章で扱う（[IoT デバイスの特性](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-concepts-and-iot-hub#understand-iot-devices)）。

### 6. 受信側はどこから読み取るか
デバイスから IoT Hub へ送る矢印の先に、組み込みエンドポイント `messages/events` と受信アプリ・ツールを描く。このエンドポイントは Event Hubs 互換であり、別の Event Hubs リソースを作らずに対応 SDK で D2C を読み取れる（[組み込みエンドポイントからの読み取り](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-read-builtin)）。

本章の説明例は、カスタムルートを追加していない初期構成とする。ルート追加後の組み込みエンドポイントへの配送条件やフォールバックは、第5章で説明する。組み込みエンドポイントは期限付きの読み取り口であり、長期保存用の DB ではない。保持期間やチェックポイントの詳細も第5章へ回す（[組み込みエンドポイントの配送と保持](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-read-builtin)）。

この初期構成は、既定の組み込みエンドポイントへの配送とフォールバックが有効であることを前提にする。読み取りには共有アクセスキー方式を使い、ServiceConnect 権限を持つ共有アクセスポリシーの資格情報を準備する。サービス API の Entra ID 認証を、組み込みエンドポイントへの接続にも利用できると一般化しない（[接続情報と権限](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-read-builtin)、[組み込みエンドポイントの認証制約](https://learn.microsoft.com/ja-jp/azure/iot-hub/authenticate-authorize-azure-ad#iot-hub-service-api-permissions)）。

見せ方は「デバイスの送信ログ」と「受信ツールに現れたデバイス ID・本文」を左右に置く。送信処理の成功、受信ツールでの確認、保存や業務処理の完了を同じ意味で扱わない。一連の操作は第6章で実演する。

### 7. 双方向通信と後続配送の見取り図
温度を送った後に「送信を止めたい」「送信間隔を変えたい」「履歴を保存したい」という要求を加え、後続章の問いを提示する。

| 要求 | この章で紹介する機能 | 深掘りする章 |
| --- | --- | --- |
| デバイスへ操作を要求する | Direct Method | 第4章: 応答とオフライン時の扱い |
| 期待する設定と報告された状態を扱う | Device Twin | 第4章: Desired / Reported と適用確認 |
| デバイスへ通知・依頼を届ける | C2D メッセージ | 第4章: 配送と実行結果の違い |
| データを保存先や後続処理へ渡す | メッセージルーティング | 第5章: 条件・ルート・エンドポイント |

機能の存在と通信の方向を紹介するに留め、方式の詳細比較や配送設定はここで先取りしない（[IoT Hub の機能](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-concepts-and-iot-hub)、[IoT Hub SDK の送受信・操作](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-sdks)）。

### 8. SKU 選択の入口
「使う機能」と「必要な容量」は別の問いとして示す。Basic は D2C 中心の用途、Standard は Direct Method・Device Twin・C2D を含む双方向通信の用途として比較する。認証・セキュリティ機能の優劣で区別しない。評価用の Free は Standard 相当の機能を持つが容量が限られる（[レベル別の機能と Free の位置づけ](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-scaling#choose-features-basic-versus-standard-tier)）。

今回は後続章で双方向通信を扱うため、Basic ではなく Standard 相当の機能が必要であると結び付ける。ユニット数、日次上限、スロットリング、費用見積もりの具体的な判断は第7章で扱う。

## 話す流れ
1. 前章の全体図から IoT Hub 周辺を拡大し、デバイス・Hub・バックエンドを置く。
2. Hub 作成、ID 登録、資格情報の準備、接続を順に説明する。
3. 「ID を知っていれば接続できるか」を問い、認証・権限・通信保護の違いを説明する。
4. MQTT・AMQP・HTTPSの選択場面、受信方法、デバイスIDの多重化、ポートを比較してから、SDKと受信ツールを役割に対応させる。
5. 温度メッセージを送り、受信側で読むまでを図と画面・ログで追う。
6. 送信成功と受信確認、長期保存・業務処理の完了を区別する。
7. 操作・設定変更・後続配送の要求を加え、第4・5章の問いを提示する。
8. 今回必要な機能から SKU の入口を説明し、制御と状態同期の章へ進む。

## スライド構成案
初期案の9枚を具体化した11枚版に対し、通信プロトコル比較をSDKの説明から独立させた12枚・25分程度の構成とする。比較に120秒、SDKに90秒を配分し、登録・資格情報・確認問題を前版から各30秒調整する。枚数・秒数自体を制約にせず、各ページの本文・時間・図の指定・出典は [slide.md](slide.md)で管理する。

| Slide | タイトル | 目的 | レイアウト / ビジュアル | 主なメッセージ |
| --- | --- | --- | --- | --- |
| 1 | デバイス・IoT Hub・バックエンドの役割 | 通信する主体と責任範囲を示す | 前章の全体図から3者を拡大 | IoT Hub とアプリは役割を分けて構成する |
| 2 | Hub 作成からデバイス接続までの手順 | 作成・登録・認証・接続の段階を分ける | クラウドとアプリの準備を並べた5段階のフロー | 登録されていることと、接続していることは違う |
| 3 | Device ID とデバイスの資格情報 | 識別子と認証材料を区別する | 登録情報と接続設定の対応図 | ID を名乗るだけでは、そのデバイスとして認証できない |
| 4 | 認証・権限・通信保護の違い | 安全に接続するための基礎を説明する | なりすまし・不正操作・通信内容の漏えいの問い | 誰か、何を許可するか、通信を守るかは別の観点 |
| 5 | IoT Hub の通信プロトコルと選び分け | 認証・TLSを前提に通信方式の判断材料を示す | MQTT・AMQP・HTTPSを同じ4つの観点で比較する表 | 受信方法・デバイスIDの多重化・ネットワーク条件で選ぶ |
| 6 | SDK の役割と用途別の使い分け | 比較した通信方式とアプリ実装の関係を示す | 通信の階層図とSDKの対応表 | SDK は動かす場所と処理の役割で使い分ける |
| 7 | 温度テレメトリの本文と送信処理 | D2C と本文の具体例を理解する | 温度・湿度のJSONと送信処理 | 測定値を作って送るのはデバイスアプリ |
| 8 | D2C を読む組み込みエンドポイント | 読み取り経路・認証・配送の前提を示す | Hub内の読み取り口と受信アプリ | Event Hubs互換の読み取りとサービスAPIの認証は分ける |
| 9 | 送信ログと受信データの照合 | 送信・受信・業務処理の確認範囲を区別する | 送信ログと受信表示の対比 | 受信を確認しても保存・業務処理完了とは限らない |
| 10 | デバイス操作・設定変更・後続配送 | 第4・5章への接続を作る | 要求と機能の対応表、通信方向の図 | 用途に応じた機能を次章以降で学ぶ |
| 11 | Basic・Standard・Free の機能差 | 今回の構成と機能要件を結ぶ | Basic / Standard と評価用 Free の比較 | 双方向通信の機能要件と、本番の容量設計は分ける |
| 12 | 登録・接続・送受信の確認問題 | 章の到達点を3つの事例で確認する | 3つの問いと3者の小図 | 誰が接続し、送り、読み、操作するかを説明する |

## 図・デモで見せるもの
- 同じ温度センサーを使い、デバイスアプリ・IoT Hub・バックエンドを一貫して配置する
- Device ID 登録画面と接続設定の対応。実際のキー・接続文字列はマスクする
- 温度・湿度のメッセージ例、送信ログ、受信画面を対応させた静止画
- D2C はデバイスから Hub、C2D は Hub からデバイスへ向かう矢印として描く。参照資料 Day 1 p.9 の図はそのまま転用しない
- 本章では画面・ログを説明材料として使い、Hub 作成から双方向通信までのライブ実演は第6章にまとめる

## 強調するポイント
- 登録・認証・接続・送信・受信確認を別の段階として追う
- デバイス資格情報とバックエンドの資格情報を混同しない
- SDK、通信プロトコル、IoT Hub の機能は別の概念として結び付ける
- IoT Hub への送信成功と、後続の保存・業務処理完了は別である
- 認証・権限・通信保護は本章の基礎。STRIDE と本番化ベストプラクティスは後半に分ける

## よくある誤解
- IoT Hub やデバイス ID を作れば、デバイスは自動的に接続される
- Device ID を知っていれば、そのデバイスとして認証できる
- デバイスとバックエンドで同じ接続文字列を共有すればよい
- SDK を使えば通信プロトコルは使わない、または MQTT を詳しく知らないと始められない
- IoT Hub サービス SDK だけで、組み込みエンドポイントからの D2C 読み取りも行う
- IoT Hub に送信できたら保存・分析まで完了している
- Basic と Standard の主な違いは認証の強さである

## 理解度確認
- Hub 作成、デバイス ID 登録、接続はそれぞれ何をする段階か
- Device ID と資格情報は何が違うか
- デバイスが温度を送る操作と、バックエンドがデバイスを操作する要求は、同じ主体・権限か
- デバイス SDK、サービス SDK、管理 SDK、D2C を読む SDK はどの役割に対応するか
- 受信アプリは IoT Hub のどこからデータを読み取るか
- 送信ログと受信画面から何を確認でき、何はまだ確認できないか
- 今回の双方向通信に必要な機能と、本番で必要な容量は同じ問いか

## 参考リンク
技術情報の確認日: 2026-09-08。Readiness は話題と説明順の参考とし、サービス仕様は本文に紐付けた Microsoft Learn を根拠にする。

- [Azure IoT Hub とは](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-concepts-and-iot-hub)
- [SAS によるアクセス制御](https://learn.microsoft.com/ja-jp/azure/iot-hub/authenticate-authorize-sas)
- [X.509 による認証](https://learn.microsoft.com/ja-jp/azure/iot-hub/authenticate-authorize-x509)
- [Microsoft Entra ID によるアクセス制御](https://learn.microsoft.com/ja-jp/azure/iot-hub/authenticate-authorize-azure-ad)
- [IoT Hub の TLS サポート](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-tls-support)
- [IoT Hub SDK](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-sdks)
- [IoT Hub の MQTT サポート](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-mqtt-connect-to-iot-hub)
- [組み込みエンドポイントからの読み取り](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-read-builtin)
- [IoT Hub のレベルとサイズを選択する](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-scaling)
