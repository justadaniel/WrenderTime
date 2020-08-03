"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});

const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    Notification,
    EventEmitter
} = require("electron");
const path = require('path');
const chokidar = require("chokidar");
const settings = require("electron-settings");
const isDev = require('electron-is-dev');
const log = require('electron-log');
var inherits = require("util").inherits;

let watcher = null;

const root = "./app";
var directories = {
    VIEWS: root + "/views/"
};

var utilities = {
    WatchEvents: {
        ADD: "add",
        ADD_DIR: "addDir",
        CHANGE: "change",
        UNLINK: "unlink",
        UNLINK_DIR: "unlinkDir",
        ERROR: "error",
        READY: "ready",
        RAW: "raw"
    },
    Settings: settings,
    platform: {},
    IsMacAppStoreBuild: () => process.mas == true,
    IsWindowsStoreBuild: () => process.windowsStore == true,
    IsMac: () => process.platform === 'darwin',
    IsWindows: () => process.platform === 'win32',
    OSVersion: () => process.getSystemVersion(),
    IsDev: () => isDev,
    GetAppPath: () => process.execPath,
    SetStartAppOnBoot: function (startOnBoot) {
        if (!utilities.IsDev()) {
            const exeName = path.basename(process.execPath);
            app.setLoginItemSettings({
                openAtLogin: startOnBoot,
                path: process.execPath,
                args: [
                    '--processStart', `${exeName}`,
                    '--process-start-args', "--hidden"
                ]
            });

            console.log(`Start on Boot set to ${startOnBoot}`);
        } else {
            console.log(`Can't set start on boot due to this being a dev environment`);
        }
    },
    BytesToHumanFileSize: function (bytes, si = false, dp = 1) {
        const thresh = si ? 1000 : 1024;

        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }

        const units = si
            ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
            : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        let u = -1;
        const r = 10 ** dp;

        do {
            bytes /= thresh;
            ++u;
        } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


        return bytes.toFixed(dp) + ' ' + units[u];
    },
    GetView: function (file = "") {
        return directories.VIEWS + file;
    },
    StartWatch: function (dir, callback) {
        watcher = chokidar.watch(dir).on("all", (event, path) => {
            // console.log(event, path);
            callback(event, path);
        });
        return watcher;
    },
    StopWatch: function () {
        if (watcher != null && watcher != "undefined") {
            watcher.close().then(() => console.log("closed"));
            watcher = null;
        }
    },
    RequestQuit: function (confirmCallback = null) {
        console.log("requested quit");

        let response = utilities.ShowAlert("Do you really want to quit?", {
            title: "Quitting...",
            detail: "Doing so will kill all watch folders.",
            buttons: ["Quit", "Cancel"],
            defaultId: 1,
            cancelId: 1,
        });

        if (response == 0) {
            utilities.Quit(confirmCallback);
        }
    },
    Quit: function (callback = function () { }) {
        console.log("Quitting");

        if (callback != null)
            callback();

        setTimeout(() => {
            // if (process.platform !== "darwin")
            app.quit();
        }, 1000);
    },
    ShowAlert: function (message, options = {}) {
        let defaults = {
            noLink: true,
            title: app.name,
            message: message || "Message goes here",
            // detail: "Doing so will kill all watch folders.",
            // buttons: ["Quit", "Cancel"],
            // defaultId: 1,
            // cancelId: 1,
        };
        options = Object.assign(defaults, options);

        console.log(`Alert: \'${message}\'`);
        let response = dialog.showMessageBoxSync(options);
        console.log(`User Responded with \'${options.buttons[response]}\'`);

        return response;
    },
    ShowNotification: function (message, options = {}) {
        let defaults = {
            title: app.name,
            body: message,
            silent: true
        };
        options = Object.assign(defaults, options);

        let notify = new Notification(options);
        notify.show();
        console.log(message);

        // notify.onclick = () => {
        //     console.log("Notification Clicked");
        // }

        return notify;
    }
}

// CONSTANTS
Object.defineProperties(utilities.WatchEvents, {
    ZERO: {
        value: "MEH",
        writable: false,
        configurable: false,
    }
});

module.exports = utilities;
