import os
import json
from datetime import datetime, timezone
import threading

from azure.iot.device import IoTHubDeviceClient, X509, Message
from dotenv import load_dotenv

load_dotenv()

message_count = 10

def main():
    x509 = X509(
        cert_file=os.getenv("IOTHUB_DEVICE_X509_CERT_FILE"),
        key_file=os.getenv("IOTHUB_DEVICE_X509_KEY_FILE"),
    )

    device_client = IoTHubDeviceClient.create_from_x509_certificate(
        x509=x509,
        hostname=os.getenv("IOTHUB_HOSTNAME"),
        device_id=os.getenv("IOTHUB_DEVICE_ID"),
    )

    try:
        device_client.connect()
        print("Device connected successfully")

        payload = {
            "message": "Hello from the device!",
            "device_id": os.getenv("IOTHUB_DEVICE_ID"),
            "sent_time": datetime.now(timezone.utc).isoformat(),
        }
        message = Message(json.dumps(payload))
        message.content_encoding = "utf-8"
        message.content_type = "application/json"
        for i in range(message_count):
            print(f"Sending message {i + 1}/{message_count}")
            device_client.send_message(message)
            print(f"Message sent: {payload}")
    finally:
        device_client.disconnect()


if __name__ == "__main__":
    main()
