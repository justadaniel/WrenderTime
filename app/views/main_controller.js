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
    dialog,
    protocol,
    shell
} = require("electron");
const path = require("path");
const EventEmitter = require('events');
const { SSL_OP_NO_QUERY_MTU } = require("constants");
var inherits = require('util').inherits;

const chokidar = require("chokidar");
const log = require('electron-log');
const { menubar } = require("menubar");
const utilities = require("../components/Utilities.js");
const ModernWindow = require("../components/ModernWindow.js");


var MainViewController = class MainViewController extends EventEmitter {
    window = null;
    isStandaloneWindow = false;
    standaloneWindow = null;
    mb = null;
    tray = null;
    preload = null;
    file = null;
    devToolsEnabled = false;

    constructor(args) {
        super();
        // this.tray = new Tray(args.iconPath);

        if (this.isStandaloneWindow) {
            // Create the browser window.
            this.window = new ModernWindow({
                width: 800,
                transparent: false,
                frame: true,
                webPreferences: {
                    nodeIntegration: true,
                    preload: path.join(__dirname, "preload.js")
                }
            });
            // mainWindow.removeMenu();
            Menu.setApplicationMenu(appMenu);

            // and load the index.html of the app.
            this.window.loadFile(utilities.GetView("index.html"));
            // Open the DevTools.
            if (args.devToolsEnabled)
                this.window.webContents.openDevTools();
        } else {

            this.mb = menubar({
                dir: args.dir,
                tray: args.tray,
                tooltip: `${app.name} - v${app.getVersion()}`,
                preloadWindow: true,
                browserWindow: {
                    // alwaysOnTop: true,
                    // transparent: true,
                    // draggable: false,
                    resizable: false,
                    webPreferences: {
                        nodeIntegration: true
                    }
                }
            });
            this.mb.app.commandLine.appendSwitch("disable-backgrounding-occluded-windows", "true");//could be a performance hit

            this.mb.on("ready", (e) => {
                // OnAppReady();
                this.emit("ready");
            });

            // tray.on("click", () => {
            //     console.log("Clicked");
            // });
            // this.tray.on("right-click", () => {
            //     this.tray.popUpContextMenu(contextMenu);
            // });

            // mb.on("after-create-window", () => {
            //     mb.window.openDevTools();
            // });
        }
    }

    Open = function () {
        // this.window.loadFile(utilities.GetView("index.html"));
    }

    Close = function () {
        // this.window.close();
    }

    SendEventToRenderer = function (event, arg0, arg1, arg2) {
        if (this.isStandaloneWindow) {
            this.window.webContents.send(event, arg0);
        } else {
            this.mb.window.webContents.send(event, arg0);
        }
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

module.exports = MainViewController;