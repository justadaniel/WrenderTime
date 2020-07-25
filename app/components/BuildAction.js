"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const EventEmitter = require('events');

const globals = require("./Globals.js");
const utilities = require("./Utilities.js");
var fs = require("fs"); //Load the filesystem module
var path = require("path");
const electron = require("electron");
var inherits = require('util').inherits;

let defaults = {
    displayName: "Build Action"
};

var action = class BuildAction extends EventEmitter {
    constructor(params) {
        super();
        this.params = Object.assign({}, defaults, params);
    }
}

// CONSTANTS
// Object.defineProperties(action, {
//     ZERO: {
//         value: "MEH",
//         writable: false,
//         configurable: false,
//     }
// });

module.exports = action;
