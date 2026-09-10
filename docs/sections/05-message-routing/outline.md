# 5. メッセージルーティング

## この章の目的
IoT Hub が受け取った D2C メッセージを、条件に応じて後続サービスへ配送する考え方を理解する。

## 聞き手に持ち帰ってほしいこと
- IoT Hub は取り込み口であり、保存・分析・可視化は後続サービスと組み合わせる
- メッセージルーティングでは、本文、プロパティ、Device Twin の情報を条件にできる
- ルートは配送ルール、エンドポイントは配送先の設定。受信ツールでの表示と保存先への配送は別の確認である
- 配送先は、アプリでの受信・履歴保存・検索・ストリーム分析・業務処理という目的で選ぶ
- 同じテレメトリを、低遅延で活用するホットパスと、蓄積して後から分析するコールドパスの両方へ配送できる
- 組み込みエンドポイントの保持期間には限りがあり、IoT Hub への送信成功は長期保存の完了を意味しない
- ルーティング先の障害や遅延も監視対象である

## 扱う内容
### ルーティングの役割と配送先
- D2C テレメトリやイベントを、条件に応じて後続サービスへ配送する
- 条件にはメッセージ本文、メッセージプロパティ、Device Twin の情報を利用できる
- 主な配送先
    - Azure Storage
    - Azure Event Hubs
    - Azure Service Bus
    - Azure Cosmos DB
    - Microsoft Fabric Eventstreams（プレビュー）

デバイスは引き続き IoT Hub に送信し、IoT Hub 側で後続サービスへの配送を設定する。一つのメッセージは、条件に一致する複数の配送先へ送れる。例えば「全データを Storage に保存し、温度28度以上のデータは Service Bus にも送る」という構成にできる。ルーティングは必ずしも排他的な振り分けではない（[ルーティングの概要と配送先](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c#routing-endpoints)）。

### データソース・ルート・エンドポイント

| 用語 | 決めること | 今回の例 |
| --- | --- | --- |
| データソース | 何を配送対象にするか | デバイスのテレメトリ |
| エンドポイント | どこへ送るか | Blob Storage のコンテナーを指す設定 |
| ルート | 対象・条件・配送先を結び付けるルール | 温度28度以上のテレメトリを保存先へ送る |

これらは IoT Hub の Portal メニュー「メッセージ ルーティング」で設定する。Storage へ送る場合は、配送先のストレージアカウントとコンテナーを用意し、それを指すカスタムエンドポイントを登録する。エンドポイント登録はルート作成中にも行える（[Portal でのルートとエンドポイントの作成](https://learn.microsoft.com/ja-jp/azure/iot-hub/how-to-routing-portal?tabs=storage)）。

**エンドポイント名とストレージアカウント名は別で、同じ名前にする必要はない。** 例えば、エンドポイント名 `telemetry-storage` が、ストレージアカウント `stiotdemo001` 内のコンテナー `telemetry` を参照する。ルートでは、この登録済みエンドポイントを配送先として使う（[ストレージエンドポイントの設定項目](https://learn.microsoft.com/ja-jp/azure/iot-hub/how-to-routing-portal?tabs=storage#create-a-route-and-endpoint)）。

配送先を登録するだけでなく、IoT Hub がその配送先へ書き込むための認証・権限も必要である。デバイスの接続認証や Portal 操作者の権限とは別に考える。詳細は [Section 07 の配送先への認証・権限](../07-non-functional-requirements/outline.md#配送先への認証権限)で扱う。

**配送先は用途だけでなく、組織のネットワーク要件によっても選択が制約される。** 書き込み権限があっても、ネットワーク側で拒否されれば配送できない。直接ルーティングと Private Endpoint を使う受信アプリ構成の選び方は、[Section 07 の配送先へのネットワーク接続方式の選定](../07-non-functional-requirements/outline.md#配送先へのネットワーク接続方式の選定)で扱う（[IoT Hub の送信接続要件](https://learn.microsoft.com/ja-jp/azure/iot-hub/virtual-network-support#egress-connectivity-from-iot-hub-to-other-azure-resources)）。

#### データソースと操作の対応

「デバイス テレメトリ メッセージ」を選ぶと、対象は D2C メッセージになる。今回の Python デモでは `send_message()` で送る温度・湿度が該当し、同じ API で送るアラートなども対象になる。Twin の変更通知、C2D、Direct Method の応答はこのデータソースには含まれない（[Python SDK の send_message](https://learn.microsoft.com/ja-jp/python/api/azure-iot-device/azure.iot.device.iothubdeviceclient#azure-iot-device-iothubdeviceclient-send-message)、[ルーティングのデータソース](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c)）。

| 操作の例 | 対応するデータソース |
| --- | --- |
| デバイスが `send_message()` で送信する | デバイス テレメトリ メッセージ |
| デバイスが `patch_twin_reported_properties()` で Reported を更新する | デバイス ツイン変更イベント |
| クラウド側で Desired を更新する | デバイス ツイン変更イベント |
| デバイス／モジュール ID を登録・削除する | デバイス ライフサイクル イベント |

分類は関数名そのものではなく、「何を送ったか・何が変化したか」で決まる。クラウド側の操作でもイベントは発生する。Twin の変更を後続サービスへ通知するには、Twin 変更イベントをデータソースにしたルートが必要である（[非テレメトリイベント](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c#non-telemetry-events)、[Twin の変更通知](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-device-twins#back-end-operations)）。

座学では上の対応を押さえ、その他のデータソースは紹介に留める。今回のデモではテレメトリを選択する。

### エンドポイントの使い分け

#### 組み込みエンドポイントはアプリ側の読み取り口

組み込みエンドポイント `messages/events` は、IoT Hub が受け取った D2C メッセージをバックエンドアプリが読み取るために、最初から用意されている。IoT Explorer のテレメトリ表示も、このエンドポイントから読み取っている。自作の受信アプリを使う場合は、IoT Explorer の読み取り役を自分のアプリが担うと考えるとよい（[組み込みエンドポイントからの受信](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-read-builtin)、[IoT Explorer での受信確認](https://learn.microsoft.com/ja-jp/azure/iot-hub/tutorial-routing#configure-iot-explorer-to-view-messages)）。

自作アプリは SDK で接続し、メッセージを継続的に受信して処理する。定期的な HTTP GET で DB を検索する仕組みではなく、AMQP または AMQP over WebSockets を使う。「Event Hubs 互換」は Event Hubs 用の SDK などで読み取れるという意味であり、別の Event Hubs リソースを作る必要はない。Python では `azure-eventhub` を利用できる（[接続プロトコルと対応 SDK](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-read-builtin)）。

#### 目的から配送先を選ぶ

次の表は、温度・湿度テレメトリを題材にした講義上の選定目安である。組み込み・Storage・Cosmos DB の配送仕様と、Event Hubs・Service Bus の用途を基に整理している（[IoT Hub の配送先](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-endpoints#custom-endpoints-for-message-routing)、[メッセージングサービスの比較](https://learn.microsoft.com/ja-jp/azure/service-bus-messaging/compare-messaging-services)）。

| 配送先 | 主な目的 | 温度・湿度データでの利用例 |
| --- | --- | --- |
| 組み込みエンドポイント | アプリがメッセージを読み取る | IoT Explorer での受信確認、自作アプリでの温度判定 |
| Blob Storage / ADLS Gen2 | ファイルとして履歴を保存し、後から分析する | 全測定データを残して後日まとめて集計する |
| Cosmos DB | DB に保存し、アプリから条件を指定して取り出す | 特定デバイスの測定履歴を画面に表示する |
| Event Hubs | 大量の連続データを後続のストリーム処理へ渡す | 多数のデバイスの温度を継続的に集計・分析する |
| Service Bus | 業務処理へメッセージを渡す | 高温の通知を受け、後続アプリで保守チケットを作成する |

**Storage と Cosmos DB は「ファイルとして残すか、DB として取り出すか」、Event Hubs と Service Bus は「連続する観測データを処理するか、業務メッセージを処理するか」**を入口に比較する。配送するだけで集計やチケット作成まで完了するわけではなく、後続の処理も設計する（[配送先の仕様](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-endpoints#custom-endpoints-for-message-routing)、[サービスの用途比較](https://learn.microsoft.com/ja-jp/azure/service-bus-messaging/compare-messaging-services)）。

配送先は一つに絞る必要はない。例えば「全データを Cosmos DB に保存し、温度28度以上は Service Bus にも送る」とすれば、履歴の参照と業務処理を両立できる。同じメッセージは、条件に一致する複数のエンドポイントへ配送される（[複数の配送先へのルーティング](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c#routing-endpoints)）。

#### ホットパスとコールドパスを組み合わせる

**「今のデータをすぐに使う」と「履歴を残して後から使う」は、同じテレメトリで両立できる。** 低遅延でデータを処理する経路をホットパス（Hot path）、データを蓄積してバッチ処理などに使う経路をコールドパス（Cold path）と呼ぶ。温度・湿度の例なら、現在の異常検知と、過去の傾向分析を分けて考える（[ホットパスとコールドパスの考え方](https://learn.microsoft.com/ja-jp/azure/architecture/databases/guide/big-data-architectures#ラムダ-アーキテクチャ)）。

次は、Day 01 の「IoT Hub: Secure, Scalable Message Broker」の右側にある分岐を、今回の講義向けに整理した構成例である。Event Hubs と Storage をルーティング先にでき、条件に一致した同じメッセージを両方へ配送できる（[IoT Hub の配送先と複数宛先への配送](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c#routing-endpoints)）。

| 経路 | 配送先と後続処理の例 | 温度・湿度データでの目的 |
| --- | --- | --- |
| ホットパス | IoT Hub → Event Hubs → ストリーム処理・通知アプリ | 現在の温度を監視し、短い時間窓での集計や高温アラートに使う |
| コールドパス | IoT Hub → Blob Storage / ADLS Gen2 → バッチ分析 | 測定履歴を保存し、日次集計・過去の傾向分析・機械学習用データの準備に使う |

リアルタイムの集計・異常検知と、保存データのバッチ分析は、それぞれ後続の処理基盤で行う。**Event Hubs に配送するだけで KPI の計算やアラート通知が完成するわけではない。** IoT Hub の配送設定と、その後の処理・可視化は分けて設計する（[IoT のストリーム処理と分析](https://learn.microsoft.com/ja-jp/azure/architecture/databases/guide/big-data-architectures#iot)）。

例えば、データソースをどちらも「デバイス テレメトリ メッセージ」とし、次の2本の通常ルートを有効にする。ルート名は講義用の例である（[ルートの設定](https://learn.microsoft.com/ja-jp/azure/iot-hub/how-to-routing-portal)、[条件に一致した複数宛先への配送](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c#routing-endpoints)）。

| ルート名の例 | 条件 | 登録済みの配送先エンドポイント |
| --- | --- | --- |
| `hot-telemetry` | `true` | ストリーム処理用の Event Hubs |
| `cold-archive` | `true` | 履歴保存用の Storage コンテナー |

この例では、デバイスは IoT Hub に1回送信し、IoT Hub が両方へ配送する。ホットパスを高温データだけに絞るなら、そのルートの条件を `$body.temperature >= 28` に変更できる。ただし、平均温度など通常値も必要な集計では、集計に必要なデータを落とさないよう条件を選ぶ。本文を使う条件の前提は後述する（[本文に基づくルーティング条件](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-routing-query-syntax#query-based-on-message-body)）。

ホット／コールドは処理経路の設計上の呼び方であり、IoT Hub に専用のモードを設定するものではない。実際に設定するのは、それぞれのルート・条件・エンドポイントである。コールドパスは障害時だけ使う予備経路でもなく、上の例では通常時から両方にデータを流す（[処理経路の考え方](https://learn.microsoft.com/ja-jp/azure/architecture/databases/guide/big-data-architectures#ラムダ-アーキテクチャ)、[IoT Hub のルート設定](https://learn.microsoft.com/ja-jp/azure/iot-hub/how-to-routing-portal)）。

座学では約2分で、IoT Hub の右側から上段の「Event Hubs → ストリーム処理・通知」と下段の「Storage → バッチ分析」へ分岐する図を見せる。IoT Hub が担当する配送先までと、その後の処理を分けて描き、「同じデータを両方へ送れる」と強調する。Day 01 のスライド全体は転載せず、D2C と後続の2経路に絞る。デモに Event Hubs や分析基盤の構築は追加しない。

#### 組み込みエンドポイントの保持期間と長期保存

組み込みエンドポイントの保持期間は **既定で1日、最大7日**であり、長期保存用の DB ではない。保持期限を過ぎて失効したメッセージは読み取れなくなる。**受信アプリが未読でも、読み終わるまで無期限に保持されるわけではない。** 「IoT Hub に送信できた」と「履歴を長期保存できた」は区別する（[保持期間の仕様](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-read-builtin)）。

受信アプリが停止した場合に備え、処理済み位置をチェックポイントとして保存し、再起動時に残っている未処理データから再開できるようにする。チェックポイントは再開位置の記録であり、データの保持期間を延ばすものではない。停止時間だけでなく、復旧後に未処理分へ追い付く時間も考慮する（[読み取り位置とチェックポイント](https://learn.microsoft.com/ja-jp/azure/event-hubs/event-hubs-features#event-consumers)、[IoT Hub の保持期間](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-read-builtin)）。

長期保存が必要なデータは、受信アプリで保存するか、ルーティングで Cosmos DB・Storage などへ配送する。後者では、独自の受信アプリを介さずに保存先へ直接配送できる（[保存先への直接配送](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-endpoints#custom-endpoints-for-message-routing)）。

座学では比較表を中心に約3分で説明し、保持期限を一言添える。Service Bus のキュー／トピック、コンシューマーグループ、チェックポイントの実装は補足に回す。Fabric Eventstreams は前述の配送先一覧での紹介に留める。

### 本文を使う条件の例

今回の温度・湿度 JSON に対して、ルートの条件を `$body.temperature >= 28` とすれば、温度28度以上を対象にできる。これはデバイス側の Python の分岐ではなく、IoT Hub が評価する条件式である。本文の評価には、有効な JSON と、システムプロパティ `contentType = application/json`、`contentEncoding = utf-8` などの適切な指定が必要になる（[メッセージ本文に基づくクエリ](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-routing-query-syntax#query-based-on-message-body)）。

ルーティングクエリは各メッセージについて評価され、結果が `true` になったメッセージがそのルートの配送対象になる。既定の `true` は「常に成立する条件式」であり、本文の特定の項目を調べるものではない。そのままなら、選択したデータソースの全メッセージが対象になる（[クエリの評価規則](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-routing-query-syntax)）。

| メッセージ本文 | 条件 `true` | 条件 `$body.temperature >= 28` |
| --- | --- | --- |
| `{"temperature":25,"humidity":45}` | 対象 | 対象外 |
| `{"temperature":29,"humidity":45}` | 対象 | 対象 |

`$body.temperature` は JSON 本文の温度を参照するが、条件に一致した場合に配送するのは、湿度も含むメッセージ全体である。SQL に例えると、列を抽出する `SELECT` ではなく、対象を絞る `WHERE` の役割に相当する。評価単位は D2C メッセージ1件であり、Storage にまとめて保存された後のファイル単位ではない（[本文に対するフィルター](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-routing-query-syntax#query-based-on-message-body)、[メッセージの配送](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c#routing-queries)）。

### 受信ツール・フォールバック・保存先の違い

IoT Explorer でのテレメトリ表示は、IoT Hub の組み込みエンドポイントを読み取る操作である。Storage へのルーティングは、IoT Hub から保存先へ配送する設定であり、「受信ツールで見えた」ことは「Storage に保存された」ことの確認にはならない（[ルーティング前後の受信と保存の確認](https://learn.microsoft.com/ja-jp/azure/iot-hub/tutorial-routing)）。

カスタムルートを追加すると、それに一致したメッセージが IoT Explorer に表示されなくなる場合がある。組み込みエンドポイントにも全件流したい場合は、そこを配送先にして条件 `true` のルートを明示する。有効なフォールバックルートは、どのルート条件にも一致しないメッセージを組み込みエンドポイントへ送るものであり、配送先障害時の代替保存先ではない（[フォールバックルート](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c#fallback-route)）。

**本講義での設計方針は、「意図した配送先は、組み込みエンドポイントも含めて通常ルートで明示する」ことである。** 組み込みへの配送が必要な場合も、フォールバックだけに依存せず、用途に応じた条件を持つ `events` 宛てルートを用意する。全件を読み取りたい場合は条件 `true` とする。これにより、別のルートを追加したときに、フォールバックの対象から外れて読み取り側に届かなくなることを避け、必要な配送経路を設定一覧で確認できる。組み込みへの全件配送がすべてのシステムで必須という意味ではない（[組み込みエンドポイントへの配送に関する注意点](https://learn.microsoft.com/ja-jp/azure/iot-hub/troubleshoot-message-routing#i-suddenly-stopped-getting-messages-at-the-built-in-endpoint)）。

例えば、Storage 宛てと `events` 宛てに、それぞれデバイステレメトリを対象とする条件 `true` の有効なルートを作ると、同じメッセージが両方に配送される。ルートは先に一致した一つだけが採用されるのではなく、条件に一致するすべての宛先が配送対象になる。どのルートにも一致しないメッセージをどう扱うかは、フォールバックの有効・無効を含めて別途決める（[複数宛先への配送](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c#routing-endpoints)、[フォールバックの対象](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c#fallback-route)）。

**検証では、送信側の成功ログだけで完了とせず、意図した各配送先で受信・保存を確認する。** デモでは IoT Explorer の受信を開始してから送信し、表示されたデバイス ID・送信時刻・本文を確認する。Storage 側もバッチ書き込みを待って同じメッセージが保存されたか確認する。一方で見えたことを、もう一方への到達確認の代わりにしない（[IoT Explorer と Storage での確認手順](https://learn.microsoft.com/ja-jp/azure/iot-hub/tutorial-routing)）。

配送先の障害は、メトリック、リソースログ、エンドポイントの正常性を使って別途監視する（[ルーティングの監視とトラブルシューティング](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c#monitoring-and-troubleshooting)）。

### Storage への保存: タイミングと形式

> **講師メモ（口頭補足）:** ここで扱うのは、デバイスが IoT Hub に送った D2C メッセージを IoT Hub が Storage へ配送する「メッセージルーティング」である。デバイスが IoT Hub の認証を使ってアップロード用 SAS URI を取得し、画像や診断ログなどのファイル本体を Blob Storage へ直接送る「ファイルアップロード」とは別の機能である。本講義では機能の違いを短く紹介するに留め、設定やデモは扱わない（[IoT Hub のファイルアップロード](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-file-upload)）。

#### バッチ頻度とチャンクサイズ

IoT Hub は、Storage へメッセージを一件ずつ即時保存するのではなく、まとめて書き込む。**バッチ頻度の時間が経過するか、チャンクサイズに達するか、どちらか先に条件を満たすと書き出す。** デバイスのテレメトリ送信間隔とは別の設定である（[Storage への一括書き込み](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-endpoints#azure-storage-as-a-routing-endpoint)）。

| 設定 | 意味 | 選ぶときの観点 |
| --- | --- | --- |
| バッチ頻度 | たまったデータを書き出す時間間隔 | 早く保存結果を使いたいか、ある程度まとめてよいか |
| チャンクサイズ | 書き出しの基準となるデータ量 | 後続処理で扱うファイルの大きさと、到着するデータ量 |

講義では「少量しか届かなくても、サイズがたまるまで無期限に待つわけではない」と説明する。短い間隔・小さいサイズは小さなファイルを増やしやすいため、本番では保存の遅延許容度と後続処理の扱いやすさを見て調整する。

デモ用の推奨例は **60秒・10 MB**。少量の温度・湿度データでは主に時間条件で書き出されるため、送信直後に Blob が見えなくても、まずバッチ分の待ち時間を見込む。これは保存完了までの厳密な時間保証ではない。設定範囲は60〜720秒、10〜500 MBである（[ストレージエンドポイントの設定仕様](https://learn.microsoft.com/ja-jp/azure/templates/microsoft.devices/2019-11-04/iothubs#routingstoragecontainerproperties)）。

#### Avro と JSON

ここで選ぶのは、デバイスの送信形式ではなく **Blob Storage への保存形式** である。デバイスが JSON を送信していても、IoT Hub 側で Avro 形式の保存を選べる（[Storage でサポートされる保存形式](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-endpoints#azure-storage-as-a-routing-endpoint)）。

| 保存形式 | 特徴 | 講義での選定目安 |
| --- | --- | --- |
| JSON | テキストとして内容を確認しやすい | デモで温度・湿度を目で確認する場合に選ぶ |
| Avro | スキーマに基づくコンパクトなバイナリ形式。読み取りには対応ツールやライブラリを使う | Avro に対応した後続のデータ処理基盤と連携する場合に検討する |

Avro の特徴は公式の形式解説を参照する。「本番なら必ず Avro」ではなく、後続システムが扱いやすい形式を選ぶ（[Avro の特徴と読み書き](https://learn.microsoft.com/ja-jp/azure/databricks/query/formats/avro)）。

デモでは **JSON** を推奨する。本文を読みやすく保存するため、送信メッセージに `contentType = application/json` と `contentEncoding = utf-8` を指定する。未指定の場合は本文が Base64 エンコードされる。また、**既存エンドポイントの保存形式は後から変更できない**。形式を変える場合は新しいエンドポイントを作り、ルートの参照先を切り替える（[保存形式とエンコードの制約](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-endpoints#azure-storage-as-a-routing-endpoint)）。

## 話す流れ
1. 温度テレメトリを受け取ったあと、すべて同じ処理に流すとは限らないことを説明する
2. ルート・条件・エンドポイントの関係と、`send_message()` がテレメトリのデータソースに対応することを説明する
3. IoT Explorer の読み取り元である組み込みエンドポイントを起点に、配送先の使い分けを比較表で説明する。保持期間は既定1日・最大7日であり、長期保存先は別に必要と伝える
4. ホットパスとコールドパスの分岐図で、同じデータを Event Hubs と Storage の両方へ配送する例を示す。全件配送の `true` と高温だけに絞る条件を比較し、リアルタイム処理と履歴分析の役割を区別する
5. フォールバックの対象を説明し、必要な配送経路は組み込みも含めて通常ルートで明示する方針を伝える。送信成功だけでなく、IoT Explorer と保存先のそれぞれで到達を確認する
6. Storage のまとめ書きと保存形式を説明する。細かな設定範囲は補足とし、Storage を使うデモでは60秒・10 MB・JSONで確認する
7. 配送先の障害や遅延を監視する必要性を説明する

## スライド構成案
| Slide | タイトル | 目的 | レイアウト / ビジュアル | 主なメッセージ |
| --- | --- | --- | --- | --- |
| 1 | IoT Hub の後ろに何をつなぐか | ルーティングの必要性を説明する | IoT Hub から複数サービスへ分岐する図 | IoT Hub は取り込み口であり、用途に応じて後続サービスへ流す |
| 2 | ルートとエンドポイント | 対象・条件・配送先の関係を示す | 温度28度以上の条件と、Storage の配送先設定を結ぶ図 | デバイスは IoT Hub へ送り、配送条件は IoT Hub 側で設定する |
| 3 | 目的から配送先を選ぶ | アプリでの受信・保存・分析・業務連携を区別する | 組み込み、Storage、Cosmos DB、Event Hubs、Service Bus の用途比較表。組み込みの保持期限を注記 | 組み込みは読み取り口、長期保存は別の配送先。目的に応じて複数配送できる |
| 4 | ホットパスとコールドパスに同時配送する | リアルタイム活用と履歴分析を両立する設計を理解する | IoT Hub から上段の Event Hubs → ストリーム処理・通知、下段の Storage → バッチ分析へ分岐する図。両ルートに true を表示 | 同じテレメトリを「すぐ使う」と「残して後から使う」の両方へ配送できる。分析処理は後続が担う |
| 5 | Storage にいつ、どう保存されるか | バッチ書き込みと保存形式を理解する | メッセージがたまり、時間またはサイズで Blob に書き出される図 | 送信直後の保存ではない。デモは JSON で内容を確認する |
| 6 | 配送経路の明示と到達確認 | 通常ルートとフォールバックを区別し、各宛先で検証する設計方針を示す | Storage と events への明示ルートによる同時配送と、条件不一致時だけのフォールバックを対比 | 必要な経路は組み込みも含めて明示し、送信成功だけでなく各宛先で到達確認する。配送先の障害は別途監視する |

## 図・デモで見せるもの
- IoT Hub から複数の後続サービスへルーティングする図
- 同じテレメトリが、ホットパス（Event Hubs と後続処理）とコールドパス（Storage と後続分析）の両方へ流れる図
- 全データを保存し、しきい値以上のデータを別の配送先にも送る構成例
- デモは保存先を一つに絞り、28度以上と未満のメッセージで配送結果を比較する
- IoT Explorer の表示と、バッチ書き込み後の Blob の内容を別々に確認する

## 強調するポイント
- IoT Hub と後続サービスの責任範囲を分ける
- 配送先はサービス名からではなく、データの利用目的から選ぶ
- ホットパスとコールドパスは排他的ではない。同じデータでリアルタイム活用と履歴分析を両立できる
- 組み込みエンドポイントは期限付きの読み取り口であり、未読データの無期限保持や長期保存を担わない
- エンドポイントは配送先設定であり、ストレージアカウントそのものではない
- 必要な配送経路は、組み込みエンドポイントも含めて通常ルートで明示し、フォールバックだけに依存しない
- 受信確認・配送・保存・後続処理の完了を区別する
- 送信側の成功ログだけで完了とせず、意図した各配送先で同じメッセージの受信・保存を確認する
- ルーティング条件はデータ設計と運用設計に影響する
- ルーティング先の処理能力や障害時の挙動も本番設計に含める

## よくある誤解
- IoT Hub のルーティングを設定すれば後続処理は監視しなくてよい
- すべてのデータを同じ保存先に送れば十分である
- 組み込みエンドポイントを読むには、別途 Event Hubs リソースを作る必要がある
- 受信アプリが未読のメッセージは、組み込みエンドポイントに無期限で保持される
- チェックポイントを保存すれば、保持期限が切れたデータも復元できる
- フォールバックルートがあればデータ損失は考えなくてよい
- 一つのメッセージは一つの配送先にしか送れない
- ホット／コールドは IoT Hub の専用モードであり、配送先を設定すれば集計・通知も自動的に完成する
- コールドパスはホットパスの障害時だけ使う予備経路である
- カスタムルートを追加しても、受信ツールには必ず全件表示される
- デバイスから送るものなら、Reported の更新もテレメトリのデータソースに含まれる
- `$body.temperature` で条件を指定すれば、温度の項目だけが配送される
- チャンクサイズまでデータがたまらないと、いつまでも保存されない
- デバイスが JSON を送れば、Storage への保存形式も自動的に JSON になる

## 理解度確認
- 受信したテレメトリを長期保存する場合、IoT Hub だけで完結するか
- IoT Explorer や自作の受信アプリは、IoT Hub のどこからテレメトリを読み取るか
- ファイルでの履歴保存、DB からの履歴参照、連続データの分析、保守チケット作成では、それぞれどの配送先を候補にするか
- 組み込みエンドポイントの保持期間を超えて受信アプリが停止した場合、未読データを必ず取り戻せるか
- しきい値を超えたデータだけ別の処理へ流す場合、何を使うか
- 同じ温度データをリアルタイム監視と日次集計の両方に使うには、どの2経路を用意し、どこで分析処理を行うか
- エンドポイント名とストレージアカウント名は、それぞれ何を識別するか
- `send_message()` と Reported の更新を配送したい場合、データソースは同じか
- 条件 `true` と `$body.temperature >= 28` はどう違うか。条件に一致したとき、湿度の項目も配送されるか
- Storage 向けルートを追加して IoT Explorer に表示されなくなったら、何を確認するか
- Storage と組み込みエンドポイントの両方に全件届けるには、どのルートを明示し、どこで到達を確認するか
- 60秒・10 MB の設定で少量のデータを送った場合、何が書き込みのきっかけになるか
- ルーティング先の障害はどこで監視するべきか

## 参考リンク
- [ホットパス・コールドパスと IoT の処理構成](https://learn.microsoft.com/ja-jp/azure/architecture/databases/guide/big-data-architectures)
- [IoT Hub メッセージ ルーティング](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-d2c)
- [IoT Hub のエンドポイント](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-endpoints)
- [組み込みエンドポイントからの受信と保持期間](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-messages-read-builtin)
- [Azure メッセージングサービスの比較](https://learn.microsoft.com/ja-jp/azure/service-bus-messaging/compare-messaging-services)
- [Event Hubs の読み取り位置とチェックポイント](https://learn.microsoft.com/ja-jp/azure/event-hubs/event-hubs-features#event-consumers)
- [ルーティングクエリの構文](https://learn.microsoft.com/ja-jp/azure/iot-hub/iot-hub-devguide-routing-query-syntax)
- [Portal でルートとエンドポイントを管理する](https://learn.microsoft.com/ja-jp/azure/iot-hub/how-to-routing-portal?tabs=storage)
- [チュートリアル: デバイスデータを Azure Storage に送信する](https://learn.microsoft.com/ja-jp/azure/iot-hub/tutorial-routing)
