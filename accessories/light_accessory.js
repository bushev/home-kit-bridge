'use strict';

let hapNodejs = require('hap-nodejs');
let Accessory = hapNodejs.Accessory;
let Service = hapNodejs.Service;
let Characteristic = hapNodejs.Characteristic;
let uuid = hapNodejs.uuid;

let mqtt = require('mqtt');
let client = mqtt.connect('mqtt://192.168.1.11', {username: 'mosquitto', password: 'mosquitto-password'});

client.on('connect', () => {
    client.subscribe('/relay/1');
});

client.on('message', (topic, message) => {

    console.log(`MQTT: ${topic}:${message.toString()}`);

    LIGHT.powerOn = message.toString() === 'on';
});

// here's a hardware device that we'll expose to HomeKit
let LIGHT = {
    powerOn: false,
    setPowerOn: on => {
        console.log('Turning the light %s!', on ? 'on' : 'off');
        LIGHT.powerOn = on;

        client.publish('/relay/1', on ? 'on' : 'off', {retain: true});
    },
    setBrightness: brightness => {
        console.log('Set brightness ' + brightness);
    },
    identify: () => {
        console.log('Identify the light!');
    }
};

// Generate a consistent UUID for our light Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary 'namespace' and the word 'light'.
let lightUUID = uuid.generate('hap-nodejs:accessories:light');

// This is the Accessory that we'll return to HAP-NodeJS that represents our light.
let light = exports.accessory = new Accessory('Light', lightUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
light.username = '1A:2B:3C:4D:5E:FF';
light.pincode = '321-12-531';

// set some basic properties (these values are arbitrary and setting them is optional)
light
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, 'Oltica')
    .setCharacteristic(Characteristic.Model, 'Rev-1')
    .setCharacteristic(Characteristic.SerialNumber, 'A1S2NASF88EW');

// listen for the 'identify' event for this Accessory
light.on('identify', (paired, callback) => {
    LIGHT.identify();
    callback(); // success
});

// Add the actual Lightbulb Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
light
    .addService(Service.Lightbulb, 'Light') // services exposed to the user should have 'names' like 'Light' for us
    .getCharacteristic(Characteristic.On)
    .on('set', (value, callback) => {
        LIGHT.setPowerOn(value);
        callback(); // Our Light is synchronous - this value has been successfully set
    });

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
light
    .getService(Service.Lightbulb)
    .getCharacteristic(Characteristic.On)
    .on('get', callback => {

        // this event is emitted when you ask Siri directly whether your light is on or not. you might query
        // the light hardware itself to find this out, then call the callback. But if you take longer than a
        // few seconds to respond, Siri will give up.

        let err = null; // in case there were any problems

        if (LIGHT.powerOn) {
            console.log('Are we on? Yes.');
            callback(err, true);
        } else {
            console.log('Are we on? No.');
            callback(err, false);
        }
    });

// also add an 'optional' Characteristic for Brightness
light
    .getService(Service.Lightbulb)
    .addCharacteristic(Characteristic.Brightness)
    .on('get', (callback) => {
        callback(null, LIGHT.brightness);
    })
    .on('set', (value, callback) => {
        LIGHT.setBrightness(value);
        callback();
    });
