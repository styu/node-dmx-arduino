"use strict";

var SerialPort = require('serialport');

function DMXDriver(path) {
    if (path === undefined || path === null) {
        throw Error("path must be defined");
    }

    this.path = path;
    this.port = new SerialPort("/dev/cu.usbmodem1411", {
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false,
    });

    var _this = this;
    var response = "";
    this.isPortReady = false;
    this.port.on("data", function(data) {
        if (!_this.isPortReady) {
            response += data.toString();
            console.log(data.toString());
            if (response.indexOf("ready") >= 0) {
                _this.isPortReady = true;
                console.log("READY");
            }
        }
    });
}

function getPortWriteValue(channel, writeValue) {
    return `${channel}c${writeValue}w`;
}

DMXDriver.prototype.invokeIfReady = function(callback) {
    if (this.isPortReady) {
        callback();
    } else {
        throw new Error("Port not ready yet!");
    }
}

/**
 * @param writeValue: value to write directly to the port
 * @param callback: optional callback, passes in an error if one occurred
 */
DMXDriver.prototype.writeToPort = function(writeValue, callback) {
    var _this = this;
    this.invokeIfReady(function() {
        _this.port.write(writeValue, function(err) {
            if (callback !== undefined) {
                if (err) {
                    callback(err);
                } else {
                    callback();
                }
            }
        });
    });
}

/**
 * @param channel: channel number to write to, can be string or number
 * @param writeValue: the value to write to the channel
 * @param callback: optional callback. passes in an error if one occurred
 */
DMXDriver.prototype.setChannel = function(channelNumber, writeValue, callback) {
    if (typeof channelNumber === "string" || typeof channelNumber === "number") {
        this.writeToPort(getPortWriteValue(channelNumber, writeValue), callback);
    } else {
        callback(new Error("channelNumber must be string or number"));
    }
}

/**
 * @param channels: an array of channels to write to, either as an array of strings or numbers
 * @param writeValue: the value to write to each of the channels
 * @param callback: optional callback. passes in an error if one occurred
 */
DMXDriver.prototype.setChannels = function(channels, writeValue, callback) {
    if (Array.isArray(channels)) {
        var writeValues = channels
            .filter(function(channel) { return typeof channel === "string" || typeof channel === "number"; })
            .map(function(channel) { return getPortWriteValue(channel, writeValue); });
        this.writeToPort(writeValues.join(""), callback);
    } else if (typeof channels === "string" || typeof channels === "number") {
        this.setChannel(channels, writeValue, callback);
    } else {
        callback(new Error("channels must be an array"));
    }
}

