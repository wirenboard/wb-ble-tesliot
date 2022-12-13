// Rule for work with TESLiOT sensors
// generating virtual devices,
// executing scanning-ble-for-tesliot-script,
// parsing its output and putting it to virtual devices
var tesliot_bin = "/usr/lib/wb-ble-tesliot/tesliot.sh";
var conf_path = "/etc/wb-ble-tesliot.conf";

try { //opening config file
    var config = readConfig(conf_path).config;
} catch (e) {
    log.error("readConfig error: " + e);
    return;
}

function make_tesliot_sensor(sensor) {
    _dev_id = format(sensor.dev_id);
    _title = format(sensor.title);
    _mac = format(sensor.mac);
    log(_dev_id, _title, _mac);
    defineVirtualDevice(_dev_id, {
        title: _title,
        cells: {
            "mac": {
                type: "text",
                value: _mac
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
    })
}


for (i = 0; i < config.length; i++) {
    make_tesliot_sensor(config[i]);
}


defineRule("tesliot_dynamic_refresh", {
    when: cron("@every 15s"),
    then: function() {
        runShellCommand("bash {}".format(tesliot_bin), {
            captureOutput: true,
            exitCallback: function(exitCode, capturedOutput) {
                if (exitCode != 0) return;
                var sensorList = capturedOutput.split("\n")
                for (var i = 0; i < sensorList.length; ++i) {
                    var sensorParts = sensorList[i].split("|")
                    for (i = 0; i < config.length; i++) {
                        if (sensorParts[0] == config[i].mac) {
                            dev_id = config[i].dev_id;
                            dev[dev_id]["mac"] = sensorParts[0];
                            dev[dev_id]["voltage"] = parseFloat(sensorParts[1]) / 10;
                            dev[dev_id]["collision"] = parseInt(sensorParts[2]);
                            dev[dev_id]["acceleration_x"] = parseFloat(sensorParts[3]) / 100;
                            dev[dev_id]["acceleration_y"] = parseFloat(sensorParts[4]) / 100;
                            dev[dev_id]["acceleration_z"] = parseFloat(sensorParts[5]) / 100;
                            dev[dev_id]["magnet_field"] = parseInt(sensorParts[6]);
                            dev[dev_id]["luminocity"] = parseInt(sensorParts[7]);
                            dev[dev_id]["humidity"] = parseFloat(sensorParts[8]) / 100;
                            dev[dev_id]["temperature"] = parseFloat(sensorParts[9]) / 100;
                            dev[dev_id]["rssi"] = sensorParts[10];
                            dev[dev_id]["timestamp"] = sensorParts[11];
                        }
                    }
                }
            }
        });
    }
});