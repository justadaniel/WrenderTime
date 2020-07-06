"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});

const electron = require("electron");
var inherits = require('util').inherits;

let defaults = {
    displayName: "Build Action"
};

var action = class BuildAction {
	constructor(params) {
        this.params = Object.assign({}, defaults, params);
	}
}

// CONSTANTS
Object.defineProperties(action, {
    ZERO: {
        value: "MEH",
        writable: false,
        configurable: false,
    }
});

module.exports = action;
