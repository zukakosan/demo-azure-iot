# demo-azure-iot
デモ手順

Azure IoT Explorer をインストール
IoT Hub の接続文字列を入力して、IoT Explorer と Azure を接続する
デバイス一覧に IoT Hub 側で登録したデバイスが表示されていることを確認する

ローカル端末上で、 iothub-device-demo.py を実行して待ち状態にする
IoT Explorer 上で start method を Invoke method し、telemetry 送信を開始する

IoT Explorer のデバイスを開き、Telemetry タブから Start を押下
demo スクリプトから SDK 経由で送られてくる json が取得できていることを確認する

このように双方向にjsonやmethod を IoT hub を仲介としながらメッセージ交換できる
これは、IoT Hub が双方向に利用可能なセッションを維持しているため