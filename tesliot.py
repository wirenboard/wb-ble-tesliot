#!/usr/bin/env python3

import asyncio
import datetime
import struct
import subprocess
import sys

import aioblescan as aiobs

received = {}

got_some_adv_reports = False


def not_duplicate(peer, payload, timestamp):
    if peer in received:
        received_payload, received_timestamp = received[peer]
        if received_payload == payload and (timestamp - received_timestamp).total_seconds() < 5:
            return False
    return True


def update_received(peer, payload, timestamp):
    received[peer] = (payload, timestamp)


def my_process(data):
    event = aiobs.HCI_Event()
    try:
        event.decode(data)
    except struct.error:
        # malformed packet, likely a problem in driver/firmware/etc
        # Similar issue https://github.com/frawau/aioblescan/issues/36
        return
    for packet in event.retrieve(aiobs.HCI_LEM_Adv_Report):
        global got_some_adv_reports
        got_some_adv_reports = True
        msd_list = packet.retrieve("Manufacturer Specific Data")
        for msd in msd_list:
            payload = msd.payload[1].val
            if len(payload) >= 21 and payload[0:3] == b"TS1":
                peer = packet.retrieve("peer")[0].val.upper()
                timestamp = datetime.datetime.now()
                # sensor sends up to 6 duplicate packets, ignore them
                if not_duplicate(peer, payload, timestamp):
                    print(
                        "{}|{}|{}|{}|{}|{}|{}|{}|{}|{}|{}|{:%d-%m-%Y %H:%M:%S}".format(
                            peer,
                            int.from_bytes(payload[9:10], "big"),  # voltage
                            int.from_bytes(payload[10:11], "big"),  # collision flags
                            int.from_bytes(payload[11:12], "big") - 128,  # acceleration x
                            int.from_bytes(payload[12:13], "big") - 128,  # acceleration y
                            int.from_bytes(payload[13:14], "big") - 128,  # acceleration z
                            int.from_bytes(payload[14:15], "big"),  # hall
                            int.from_bytes(payload[15:17], "big"),  # lux
                            int.from_bytes(payload[17:19], "big"),  # humidity
                            int.from_bytes(payload[19:21], "big", signed=True),  # temperature
                            packet.retrieve("rssi")[0].val,
                            timestamp,
                        )
                    )
                    update_received(peer, payload, timestamp)


async def amain():
    event_loop = asyncio.get_running_loop()

    # Create and configure a raw socket for hci0
    socket = aiobs.create_bt_socket(0)

    conn, btctrl = await event_loop._create_connection_transport(socket, aiobs.BLEScanRequester, None, None)
    btctrl.process = my_process
    await btctrl.send_scan_request()
    try:
        # The timeout is taken from previous realization
        # Typical sensor's send period is 10 seconds, so wait a bit more than 2 periods
        await asyncio.sleep(24)
    finally:
        await btctrl.stop_scan_request()
        conn.close()


def main():
    try:
        asyncio.run(amain())
        if not got_some_adv_reports:
            # it can be a hci hung up, so power down/up the device
            print("[tesliot.py] No advertising packets. Restart hci0", file=sys.stderr)
            subprocess.run(["btmgmt", "power", "off"], check=False)
            subprocess.run(["btmgmt", "power", "on"], check=False)
            sys.exit(1)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
