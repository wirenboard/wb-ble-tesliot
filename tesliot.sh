#!/bin/bash

# timeout for scan
timeout=$(($(date +%s) + 24))

BT_IFACE="hci0"

halt_lescan() {
  killall -9 bluetoothctl hcitool || true
  hciconfig $BT_IFACE reset || true
  hciconfig $BT_IFACE down || true
}

reset_iface() {
  hciconfig $BT_IFACE reset
  systemctl restart bluetooth
}

trap halt_lescan INT

process_complete_packet() {

  ## TeslIOT packet example
  ##packet="> 04 3E 32   02 02 00 01 59 9E 92 0D 00 C0 1C 02 01 06
  #           18 FF FF FF 54 53 31 1F 0C 00 09 2A 9A 24 02 80 80 80 01 00 00 0D>
  #           A4 04 01 59 9E 92 0D 00 C0 00 A4

  local packet=${1//[\ |>]/}
  #echo $packet
  if [[ ! $packet =~ ^043E.*545331 ]]; then
    return
  fi
	echo "--------------------------------------------------"
    echo ${packet}

    local mac="${packet:24:2}:${packet:22:2}:${packet:20:2}:${packet:18:2}:${packet:16:2}:${packet:14:2}"
    #echo "mac: "${mac}

    let "voltage = $((0x${packet:60:2}))"
    #echo "voltage: "${voltage}

    let "collis = $((0x${packet:62:2}))"
    #echo "collision: "${collis}

    let "accelx = $((0x${packet:64:2})) - 128"
    #echo "accelleration on axis x: "${accelx}

    let "accely = $((0x${packet:66:2})) - 128"
    #echo "accelleration on axis y: "${accely}

    let "accelz = $((0x${packet:68:2})) - 128"
    #echo "accelleration on axis z: "${accelz}

    let "hall = $((0x${packet:70:2}))"
    #echo "magnet field: "${hall}

    let "lux = $((0x${packet:72:2}${packet:74:2}))"
    #echo "luminocity: "${lux}

    let "hum = $((0x${packet:76:2}${packet:78:2}))"
    #echo "humidity: "${hum}

    let "temp = $((0x${packet:80:2}${packet:82:2}))"
    #echo "temperature: "${temp}

  rssi=0 #$[$((0x${packet:70:2})) - 256]

  echo $mac"|"$voltage"|"$collis"|"$accelx"|"$accely"|"$accelz"|"$hall"|"$lux"|"$hum"|"$temp"|"$rssi"|"$(date "+%d-%m-%Y %H:%M:%S")
}

read_blescan_packet_dump() {
  # packets span multiple lines and need to be built up
  packet=""
  while read line; do
    # packets start with ">"
    if [[ $line =~ ^\> ]]; then
      # process the completed packet (unless this is the first time through)
      if [ "$packet" ]; then
         if [[ $(date +%s) > $timeout ]]; then
           exit 0
         fi
        process_complete_packet "$packet"
      fi
      # start the new packet
      packet=$line
    else
      # continue building the packet
      packet="$packet $line"
    fi
    seconds=$(date +%s)
  done
}

# begin BLE scanning
#killall hcitool
halt_lescan

echo "restarting hci"
reset_iface
sleep 0.5
bluetoothctl scan on > /dev/null &
sleep 0.2
echo "dumping data"
# make sure the scan started
if [ "$(pidof bluetoothctl)" ]; then
  # start the scan packet dump and process the stream
  hcidump --raw | read_blescan_packet_dump
else
  echo "ERROR: it looks like hcitool lescan isn't starting up correctly" >&2
  halt_lescan
  exit 1
fi
halt_lescan
