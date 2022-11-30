// Example rule for work with TESLiOT sensors
// generating virtual devices,
// executing scanning-ble-for-tesliot-script,
// parsing its output and putting it to virtual devices

var sensor_array = [
  {
      dev_id : "tesliot_temp_hum_sensor_1",
      title : "TESLiOT Sensor (temperature and humidity)",
      mac : "C0:00:0D:92:9E:59"},
  {
      dev_id : "tesliot_temp_sensor_1",
      title : "TESLiOT Sensor (temperature)",
      mac : "E3:28:2A:8F:52:81"}
]

function make_tesliot_sensor(sensor){
  defineVirtualDevice(sensor.dev_id,{
      title: sensor.title,
      cells: {
        "mac": {
          type: "text",
          value: sensor.mac
        },
        "voltage": {
          type: "voltage",
          value: ""
        },
        "collision": {
          type: "value",
          value: ""
        },
        "acceleration_x": {
          type: "value",
          value: ""
        },
        "acceleration_y": {
          type: "value",
          value: ""
        },
        "acceleration_z": {
          type: "value",
          value: ""
        },
        "magnet_field": {
          type: "value",
          value: ""
        },
        "luminocity": {
          type: "value",
          value: ""
        },
        "humidity": {
          type: "rel_humidity",
          value: ""
        },
        "temperature": {
          type: "temperature",
          value: ""
        },
        "rssi": {
          type: "text",
          value: ""
        },
        "timestamp": {
          type: "text",
          value: ""
        }
      }
    }
  )
}


for (i = 0; i < sensor_array.length; i ++){
  make_tesliot_sensor(sensor_array[i]);
}


defineRule("tesliot_dynamic_refresh", {
  when: cron("@every 15s"),
  then: function () {
    runShellCommand("bash /mnt/data/root/tesliot.sh", {
      captureOutput: true,
      exitCallback: function (exitCode, capturedOutput) {
        if (exitCode != 0) return;
        var sensorList=capturedOutput.split("\n")
          for (var i=0; i<sensorList.length; ++i) {
            var sensorParts=sensorList[i].split("|")
            for (i = 0; i < sensor_array.length; i ++){ 
              if (sensorParts[0] == sensor_array[i].mac) {
                dev_id = sensor_array[i].dev_id;
                 dev[dev_id]["mac"] = sensorParts[0];
                 dev[dev_id]["voltage"] = parseFloat(sensorParts[1])/10;
                 dev[dev_id]["collision"] = parseInt(sensorParts[2]);
                 dev[dev_id]["acceleration_x"] = parseFloat(sensorParts[3])/100;
                 dev[dev_id]["acceleration_y"] = parseFloat(sensorParts[4])/100;
                 dev[dev_id]["acceleration_z"] = parseFloat(sensorParts[5])/100;
                 dev[dev_id]["magnet_field"] = parseInt(sensorParts[6]);
                 dev[dev_id]["luminocity"] = parseInt(sensorParts[7]);
                 dev[dev_id]["humidity"] = parseFloat(sensorParts[8])/100;
                 dev[dev_id]["temperature"] = parseFloat(sensorParts[9])/100;
                 dev[dev_id]["rssi"] = sensorParts[10];
                 dev[dev_id]["timestamp"] = sensorParts[11];
              }
            }
          }
        }
      }
    );   
  }
});
