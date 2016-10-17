'use strict';

let fs = require('fs');
let path = require('path');
let hapNodejs = require('hap-nodejs');
let uuid = hapNodejs.uuid;
let Bridge = hapNodejs.Bridge;
let Accessory = hapNodejs.Accessory;
let accessoryLoader = hapNodejs.AccessoryLoader;

console.log('HAP-NodeJS starting...');

hapNodejs.init();

// Start by creating our Bridge which will host all loaded Accessories
let bridge = new Bridge('Node Bridge', uuid.generate('Node Bridge'));

// Listen for bridge identification event
bridge.on('identify', (paired, callback) => {
    console.log('Node Bridge identify');
    callback(); // success
});

// Load up all accessories in the /accessories folder
let dir = path.join(__dirname, 'accessories');
let accessories = accessoryLoader.loadDirectory(dir);

// Add them all to the bridge
accessories.forEach(accessory => {
    bridge.addBridgedAccessory(accessory);
});

// Publish the Bridge on the local network.
bridge.publish({
    username: 'CC:22:3D:E3:CE:F6',
    port: 51826,
    pincode: '321-12-531',
    category: Accessory.Categories.BRIDGE
});
