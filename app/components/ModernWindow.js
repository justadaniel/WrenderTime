"use strict";
Object.defineProperty(exports, "__esModule", {
	value: true
});

const {
	app,
	BrowserWindow,
	Menu,
	Tray,
	webContents,
	ipcMain,
	EventEmitter
} = require("electron");
const { SSL_OP_NO_QUERY_MTU } = require("constants");
var inherits = require('util').inherits;

let defaults = {
	displayName: "Build Action"
};

var modernWindow = class ModernWindow extends BrowserWindow {
	constructor(options = {}) {
		let defaults = {
			width: 800,
			height: 600,
			frame: false,
			transparent: true,
			// webPreferences: {
			// 	nodeIntegration: false,
			// 	enableRemoteModule: false,
			// 	contextIsolation: true,
			// 	sandbox: true
			// },
			// alwaysOnTop: true,
			// resizable: false,
		};
		options = Object.assign(defaults, options);
		super(options);
	}
}

// CONSTANTS
Object.defineProperties(modernWindow, {
	ZERO: {
		value: "MEH",
		writable: false,
		configurable: false,
	}
});

module.exports = modernWindow;
