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
const log = require('electron-log');
const utilities = require("./components/Utilities.js");
const ModernWindow = require("./components/ModernWindow.js");


var AboutController = class AboutController extends EventEmitter {
	window = null;

	constructor() {
		super();

		let _win = new ModernWindow({
			width: 400,
			transparent: false,
			frame: true,
			webPreferences: {
				nodeIntegration: true,
				preload: path.join(__dirname, "preload.js")
			}
		});
		_win.removeMenu();

		this.window = _win;
	}

	Open = function () {
		this.window.loadFile(utilities.GetView("about_window.html"));
	}

	Close = function () {
		this.window.close();
	}
}

// CONSTANTS
// Object.defineProperties(modernWindow, {
// 	ZERO: {
// 		value: "MEH",
// 		writable: false,
// 		configurable: false,
// 	}
// });

module.exports = AboutController;