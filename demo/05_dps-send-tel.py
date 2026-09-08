import os
import asyncio
import json
import random
import threading

from azure.iot.device import IoTHubDeviceClient, Message, MethodResponse
from azure.iot.device.aio import ProvisioningDeviceClient

from dotenv import load_dotenv

load_dotenv()

provisioning_host = os.getenv("PROVISIONING_HOST")
id_scope = os.getenv("PROVISIONING_ID_SCOPE")
registration_id = os.getenv("PROVISIONING_REGISTRATION_ID")
symmetric_key = os.getenv("PROVISIONING_SYMMETRIC_KEY")

device_client = None
state_lock = threading.Lock()
shutdown_event = threading.Event()
is_running = False
telemetry_interval_seconds = 5


async def provision_device():
    settings = {
        "PROVISIONING_HOST": provisioning_host,
        "PROVISIONING_ID_SCOPE": id_scope,
        "PROVISIONING_REGISTRATION_ID": registration_id,
        "PROVISIONING_SYMMETRIC_KEY": symmetric_key,
    }
    missing = [name for name, value in settings.items() if not value]
    if missing:
        raise ValueError(f"Missing environment variables: {', '.join(missing)}")

    provisioning_device_client = ProvisioningDeviceClient.create_from_symmetric_key(
        provisioning_host=provisioning_host,
        registration_id=registration_id,
        id_scope=id_scope,
        symmetric_key=symmetric_key,
    )
    print("Provisioning device...")
    result = await provisioning_device_client.register()

    print(f"Provisioning result:{result.status}")

    if result.status == "assigned":
        print(
            f"Device provisioned successfully. Assigned Hub: {result.registration_state.assigned_hub}, Device ID: {result.registration_state.device_id}"
        )
        # return registration info for use in creating the IoTHubDeviceClient
        return result.registration_state
    else:
        raise RuntimeError(f"Device provisioning failed. Status: {result.status}")


def handle_c2d_message(message):
    print(f"Received C2D message: {message.data.decode('utf-8')}")


def handle_twin_desired_properties_patch(patch):
    print(f"Desired properties patch received: {patch}")
    global telemetry_interval_seconds

    if "telemetryIntervalSeconds" in patch:
        with state_lock:
            telemetry_interval_seconds = patch["telemetryIntervalSeconds"]
        device_client.patch_twin_reported_properties(
            {"telemetryIntervalSeconds": telemetry_interval_seconds}
        )
        print(
            f"Reported properties updated: telemetryIntervalSeconds={telemetry_interval_seconds}"
        )


def send_telemetry():
    while not shutdown_event.is_set():
        with state_lock:
            should_send = is_running
            interval = telemetry_interval_seconds

        if should_send:
            temperature = random.uniform(20.0, 30.0)
            humidity = random.uniform(30.0, 60.0)

            telemetry_data = {"temperature": temperature, "humidity": humidity}

            message = Message(json.dumps(telemetry_data))
            message.content_encoding = "utf-8"
            message.content_type = "application/json"

            device_client.send_message(message)
            print(f"Sent telemetry: {telemetry_data}")

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
    global device_client
    telemetry_thread = None
    try:
        registration_state = asyncio.run(provision_device())
        device_client = IoTHubDeviceClient.create_from_symmetric_key(
            hostname=registration_state.assigned_hub,
            device_id=registration_state.device_id,
            symmetric_key=symmetric_key,
        )

        device_client.on_method_request_received = handle_method_request
        device_client.on_twin_desired_properties_patch_received = (
            handle_twin_desired_properties_patch
        )
        device_client.on_message_received = handle_c2d_message

        device_client.connect()
        print("Device connected to IoT Hub.")

        telemetry_thread = threading.Thread(target=send_telemetry)
        telemetry_thread.start()
        shutdown_event.wait()

    except KeyboardInterrupt:
        print("Shutting down...")
    finally:
        shutdown_event.set()
        if telemetry_thread is not None and telemetry_thread.is_alive():
            telemetry_thread.join()
        if device_client is not None:
            device_client.shutdown()
            print("IoT Hub device client shut down.")


if __name__ == "__main__":
    main()