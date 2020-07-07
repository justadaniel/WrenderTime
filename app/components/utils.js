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
const chokidar = require("chokidar");
var inherits = require('util').inherits;

let watcher = null;

const root = "./app";
var directories = {
    VIEWS: root + "/views/"
};

var utils = {
    GetView: function (file = "") {
        return directories.VIEWS + file;
    },
    StartWatch: function (dir, callback) {
        watcher = chokidar.watch(dir).on('all', (event, path) => {
            // console.log(event, path);
            callback(event, path);
        });
        return watcher;
    },
    StopWatch: function () {
        if (watcher != null && watcher != "undefined") {
            watcher.close().then(() => console.log('closed'));
            watcher = null;
        }
    },
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
    RequestQuit: function (confirmCallback = null) {
        console.log("requested quit");

        const options = {
            noLink: true,
            title: "Quitting...",
            message: "Do you really want to quit?",
            detail: "Doing so will kill all watch folders.",
            buttons: ["Quit", "Cancel"],
            defaultId: 1,
            cancelId: 1,
        };

        let response = dialog.showMessageBoxSync(options);

        if (response == 0) {
            utils.Quit(confirmCallback);
        }

    },
    Quit: function (callback = null) {
        console.log("Quitting");

        if (callback != null)
            callback;

        if (process.platform !== "darwin") app.quit();
    },
    ShowNotification: function () {
        let myNotification = new Notification('Title', {
            body: 'Lorem Ipsum Dolor Sit Amet'
        });

        myNotification.onclick = () => {
            console.log('Notification clicked')
        }
    }
}

// CONSTANTS
Object.defineProperties(utils.WatchEvents, {
    ZERO: {
        value: "MEH",
        writable: false,
        configurable: false,
    }
});

module.exports = utils;
