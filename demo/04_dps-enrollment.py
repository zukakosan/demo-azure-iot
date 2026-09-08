import os
import uuid
import asyncio

from azure.iot.device.aio import ProvisioningDeviceClient

from dotenv import load_dotenv
load_dotenv()

provisioning_host = os.getenv("PROVISIONING_HOST")
id_scope = os.getenv("PROVISIONING_ID_SCOPE")
registration_id = os.getenv("PROVISIONING_REGISTRATION_ID")
symmetric_key = os.getenv("PROVISIONING_SYMMETRIC_KEY")

async def main():
    provisioning_device_client = ProvisioningDeviceClient.create_from_symmetric_key(
        provisioning_host=provisioning_host,
        registration_id=registration_id,
        id_scope=id_scope,
        symmetric_key=symmetric_key,
    )
    print("Provisioning device...")
    # register the device through the provisioning service and get the result
    # register func is asynchronous, so we need to await it
    result = await provisioning_device_client.register()

    print(f"Provisioning result:{result.status}")

    if result.status == "assigned":
        print(
            f"Device provisioned successfully. Assigned Hub: {result.registration_state.assigned_hub}, Device ID: {result.registration_state.device_id}"
        )
    else:
        raise RuntimeError(f"Device provisioning failed. Status: {result.status}") 

if __name__ == "__main__":
    asyncio.run(main())