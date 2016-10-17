'use strict';

let hapNodejs = require('hap-nodejs');
let Accessory = hapNodejs.Accessory;
let Service = hapNodejs.Service;
let Characteristic = hapNodejs.Characteristic;
let uuid = hapNodejs.uuid;

let mqtt = require('mqtt');
let client = mqtt.connect('mqtt://192.168.1.11', {username: 'mosquitto', password: 'mosquitto-password'});

// here's a temperature sensor device that we'll expose to HomeKit
let SENSOR = {
    currentTemperature: 0,
    getTemperature: () => {
        console.log('Getting the current temperature!');
        return SENSOR.currentTemperature;
    }
};

// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary 'namespace' and the string 'temperature-sensor'.
let sensorUUID = uuid.generate('hap-nodejs:accessories:temperature-sensor');

// This is the Accessory that we'll return to HAP-NodeJS that represents our lock.
let sensor = exports.accessory = new Accessory('Temperature Sensor', sensorUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
sensor.username = 'C1:5D:3A:AE:5E:FA';
sensor.pincode = '321-12-531';

// Add the actual TemperatureSensor Service.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
sensor
    .addService(Service.TemperatureSensor)
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', callback => {

        // return our current value
        callback(null, SENSOR.getTemperature());
    });

client.on('connect', () => {
    client.subscribe('/DHT11/temperature');
});

client.on('message', (topic, message) => {

    console.log(`MQTT: ${topic}:${message.toString()}`);

    SENSOR.currentTemperature = +message.toString();

    // update the characteristic value so interested iOS devices can get notified
    sensor
        .getService(Service.TemperatureSensor)
        .setCharacteristic(Characteristic.CurrentTemperature, SENSOR.currentTemperature);
});