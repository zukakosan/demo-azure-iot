import os
import asyncio
import hmac
import hashlib
import base64

from azure.iot.device.aio import ProvisioningDeviceClient

from dotenv import load_dotenv
load_dotenv()

provisioning_host = os.getenv("PROVISIONING_HOST")
id_scope = os.getenv("PROVISIONING_ID_SCOPE")
group_symmetric_key = os.getenv("PROVISIONING_GROUP_SYMMETRIC_KEY")

# define device names in code
device_id_1 = "sample-device-1"
device_id_2 = "sample-device-2"
device_id_3 = "sample-device-3"

# The symmetric keys for the devices, calculated by group key and device id using the HMAC-SHA256 algorithm. You can use the following Python code to generate the device keys:
device_ids_keys = {}

def derive_device_key(group_symmetric_key, device_id):
    message = device_id.encode("utf-8")
    signing_key = base64.b64decode(group_symmetric_key.encode("utf-8"))
    signed_hmac = hmac.HMAC(signing_key, message, hashlib.sha256)
    device_key_encoded = base64.b64encode(signed_hmac.digest())
    return device_key_encoded.decode("utf-8")


async def main():
    device_ids_keys[device_id_1] = derive_device_key(group_symmetric_key, device_id_1)
    device_ids_keys[device_id_2] = derive_device_key(group_symmetric_key, device_id_2)
    device_ids_keys[device_id_3] = derive_device_key(group_symmetric_key, device_id_3)
    
    for device_id, device_key in device_ids_keys.items():
        provisioning_device_client = ProvisioningDeviceClient.create_from_symmetric_key(
            provisioning_host=provisioning_host,
            registration_id=device_id,
            id_scope=id_scope,
            symmetric_key=device_key,
        )
        print(f"Provisioning device {device_id}...")
        print(f"Using symmetric key: {device_key}")
        result = await provisioning_device_client.register()

        print(f"Provisioning result for {device_id}: {result.status}")

        if result.status == "assigned":
            print(
                f"Device {device_id} provisioned successfully. Assigned Hub: {result.registration_state.assigned_hub}, Device ID: {result.registration_state.device_id}"
            )
        else:
            raise RuntimeError(f"Device provisioning failed for {device_id}. Status: {result.status}")


if __name__ == "__main__":
    asyncio.run(main())