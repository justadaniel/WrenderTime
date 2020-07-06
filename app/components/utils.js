"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});

const electron = require("electron");
var inherits = require('util').inherits;

const root = "./app";
var directories = {
	VIEWS:root + "/views/"
};

var utils = {
	GetView:function(file) {
		return directories.VIEWS + file;
	}
};

// CONSTANTS
Object.defineProperties(utils, {
    ZERO: {
        value: "MEH",
        writable: false,
        configurable: false,
    }
});

module.exports = utils;
