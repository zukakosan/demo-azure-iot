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
telemetry_interval_seconds = 5  # seconds


def handle_twin_desired_properties_patch(patch):
    print(f"Desired properties patch received: {patch}")
    # refer telemetry_interval_seconds as a global variable to modify it
    global telemetry_interval_seconds

    # only if the desired properties patch contains the telemetryIntervalSeconds property, update the telemetry interval
    if "telemetryIntervalSeconds" in patch:
        with state_lock:
            # set the new telemetry interval from the desired properties patch
            telemetry_interval_seconds = patch["telemetryIntervalSeconds"]
        # Update the reported properties on Device Twin to reflect the new telemetry interval
        device_client.patch_twin_reported_properties(
            {"telemetryIntervalSeconds": telemetry_interval_seconds}
        )
        print(
            f"Reported properties updated: telemetryIntervalSeconds={telemetry_interval_seconds}"
        )


def send_telemetry():
    while not shutdown_event.is_set():
        # fix variable access to avoid race conditions
        with state_lock:
            should_send = is_running
            interval = telemetry_interval_seconds

        if should_send:
            # create random telemetry data for temperature and humidity
            temperature = random.uniform(20.0, 30.0)
            humidity = random.uniform(30.0, 60.0)

            telemetry_data = {"temperature": temperature, "humidity": humidity}

            # create a sample payload for the telemetry data
            message = Message(json.dumps(telemetry_data))
            message.content_encoding = "utf-8"
            message.content_type = "application/json"

            # send the telemetry data to IoT Hub
            device_client.send_message(message)
            print(f"Sent telemetry: {telemetry_data}")

        # send telemetry data at the specified interval, even if telemetry sending is stopped
        shutdown_event.wait(interval)


def handle_method_request(method_request):
    global is_running
    if method_request.name == "start":
        with state_lock:
            is_running = True
        response_payload = {"result": "Telemetry sending started."}
        print("Received 'start' method request. Telemetry sending started.")
        status = 200
    elif method_request.name == "stop":
        with state_lock:
            is_running = False
        response_payload = {"result": "Telemetry sending stopped."}
        print("Received 'stop' method request. Telemetry sending stopped.")
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
        device_client.on_twin_desired_properties_patch_received = (
            handle_twin_desired_properties_patch
        )

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
