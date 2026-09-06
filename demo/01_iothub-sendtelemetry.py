import os
import json
import random
import threading

from azure.iot.device import IoTHubDeviceClient, Message, MethodResponse

from dotenv import load_dotenv

load_dotenv()

device_client = IoTHubDeviceClient.create_from_connection_string(
    os.getenv("IOTHUB_DEVICE_CONNECTION_STRING")
)

state_lock = threading.Lock()
shutdown_event = threading.Event()
is_running = False


def send_telemetry():
    while not shutdown_event.is_set():
        with state_lock:
            should_send = is_running
            if should_send:
                temperature = random.uniform(20.0, 30.0)
                humidity = random.uniform(30.0, 60.0)

                telemetry_data = {"temperature": temperature, "humidity": humidity}

                message = Message(json.dumps(telemetry_data))
                message.content_encoding = "utf-8"
                message.content_type = "application/json"

                device_client.send_message(message)
                print(f"Sent telemetry: {telemetry_data}")

            shutdown_event.wait(5)  # Send telemetry every 5 seconds

def handle_method_request(method_request):
    global is_running
    if method_request.name == "start":
        with state_lock:
            is_running = True
        response_payload = {"result": "Telemetry sending started."}
        status = 200
    elif method_request.name == "stop":
        with state_lock:
            is_running = False
        response_payload = {"result": "Telemetry sending stopped."}
        status = 200
    else:
        response_payload = {"result": f"Unknown method: {method_request.name}"}
        status = 400

    method_response = MethodResponse.create_from_method_request(
        method_request, status, response_payload
    )
    device_client.send_method_response(method_response)


def main():
    try:
        device_client.connect()
        print("Device connected to IoT Hub.")

        device_client.on_method_request_received = handle_method_request

        telemetry_thread = threading.Thread(target=send_telemetry)
        telemetry_thread.start()
        threading.Event().wait()  # Keep the main thread alive

    except KeyboardInterrupt:
        print("Shutting down...")
        shutdown_event.set()
        telemetry_thread.join()
        device_client.disconnect()
        print("Device disconnected from IoT Hub.")


if __name__ == "__main__":
    main()
