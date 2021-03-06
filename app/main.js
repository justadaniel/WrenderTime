// Modules to control application life and create native browser window
const {
    app,
    BrowserWindow,
    Menu,
    Tray,
    webContents,
    ipcMain,
    dialog,
    protocol,
    EventEmitter,
    shell
} = require("electron");
const path = require("path");
// const rq = require("./components/electron-require.js");
const globals = require("./components/Globals.js");
const utilities = require("./components/Utilities.js");
const { autoUpdater } = require("electron-updater");
const ModernWindow = require("./components/ModernWindow.js");
const chokidar = require("chokidar");
const log = require('electron-log');
const { menubar } = require("menubar");
const RenderList = require("./components/RenderList.js");
const RenderFile = require("./components/RenderFile.js");
const Settings = require("./components/Settings.js");
const IFTTT = require("./components/services/IFTTT.js");
const MainViewController = require("./views/main_controller.js");
const { isRegExp } = require("util");

const iconPath = path.join(__dirname, "..", "./app/assets/images", "IconTemplate~white.png");

let mb = null;
let mainWindow = null;
let tray;

const gotTheLock = app.requestSingleInstanceLock();

if (globals.features.autoUpdate) {
    autoUpdater.logger = log;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.logger.transports.file.level = 'info';
    autoUpdater.allowPrerelease = true;
    autoUpdater.allowDowngrade = true;
}

const RENDER_LIST = new RenderList();


const labels = {
    about: "About",
    file: "File",
    preferences: "Preferences",
    checkForUpdates: "Check for Updates",
    quit: "Quit",
    githubRepo: "Github Repository",
    submitIssue: "Submit Issue"
}

const contextMenu = Menu.buildFromTemplate([
    {
        label: labels.preferences, type: "normal",
        click: async () => {
            OpenPreferences();
        }
    },
    { label: labels.about, type: "normal", role: "about" },
    { label: "Separator", type: "separator" },
    {
        label: labels.quit, type: "normal", click: (menuItem, browserWindow, event) => {

            utilities.RequestQuit(function () {
                utilities.StopWatch();
            });
        }
    },
]);
const appMenu = Menu.buildFromTemplate([
    // { role: 'appMenu' }
    ...(utilities.IsMac() ? [{
        label: app.name,
        submenu: [
            { role: 'about' },
            {
                label: labels.preferences,
                accelerator: "CommandOrControl+,",
                click: async () => {
                    OpenPreferences();
                }
            },
            {
                label: labels.checkForUpdates,
                click: async () => {
                    CheckForUpdates();
                }
            },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideothers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    }] : []),
    {
        label: labels.file,
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            {
                label: labels.preferences,
                accelerator: "CommandOrControl+,",
                click: async () => {
                    OpenPreferences();
                }
            },
            {
                label: labels.checkForUpdates,
                click: async () => {
                    CheckForUpdates();
                }
            },
            { type: 'separator' },
            utilities.IsMac() ? { role: 'close' } : { role: 'quit' }
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: labels.githubRepo,
                click: async () => {
                    await shell.openExternal(globals.urls.github);
                }
            },
            {
                label: labels.submitIssue,
                click: async () => {
                    await shell.openExternal(globals.urls.github_issues)
                }
            }
        ]
    }
]);

if (!gotTheLock) {
    log.info("Didn't get the lock");
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        // if (mainWindow != null) {
        //     if (mainWindow.isMinimized()) mainWindow.restore()
        //     mainWindow.focus();
        // }
        log.info("Second Instance");
    });
}


var mainView = null;
app.on("ready", function () {
    tray = new Tray(iconPath);
    mainView = new MainViewController({
        iconPath: iconPath,
        tray: tray,
        devToolsEnabled: globals.features.devTools,
        dir: path.join(__dirname || path.resolve(dirname("")), "..", utilities.GetView())
    });
    tray.on("right-click", () => {
        tray.popUpContextMenu(contextMenu);
    });
    mainView.on('ready', OnAppReady);
});



app.on("activate", function () {
    // On macOS it"s common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        // createWindow();
        console.log("meh");
        // mainWindow.show();
    } else {
        // mainWindow.show();
    }
});

// Quit when all windows are closed, except on macOS. There, it"s common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
    utilities.Quit(function () {
        RENDER_LIST.StopWatching();
    });
});


if (globals.features.autoUpdate) {

    autoUpdater.on('checking-for-update', () => {
        sendStatusToWindow('Checking for update...');
    })
    autoUpdater.on('update-available', (info) => {
        sendStatusToWindow('Update available.');
        mainView.SendEventToRenderer(globals.systemEventNames.UPDATE_AVAILABLE, info);
        // utilities.ShowNotification("Update Available");
    })
    autoUpdater.on('update-not-available', (info) => {
        sendStatusToWindow('Update not available.');
    })
    autoUpdater.on('error', (err) => {
        sendStatusToWindow('Error in auto-updater. ' + err);
    })
    autoUpdater.on('download-progress', (progressObj) => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        sendStatusToWindow(log_message);
    })
    autoUpdater.on('update-downloaded', (info) => {
        sendStatusToWindow('Update downloaded');
    });

}


function RestoreMainWindow() {
    if (mb != null) {
        mb.window.webContents.send(event, arg0);
    } else {
        mainWindow.webContents.send(event, arg0);
    }
}

function SendEventToRenderer(event, arg0, arg1, arg2) {
    // if (mb != null) {
    //     mb.window.webContents.send(event, arg0);
    // } else {
    //     mainWindow.webContents.send(event, arg0);
    // }
}

// app.whenReady().then(() => {
//     CreateMainWindow();
// });

function sendStatusToWindow(text) {
    log.info(text);
    // win.webContents.send('message', text);
}






function OnAppReady() {
    log.info("Ready");

    if (Settings.General.showNotificationOnAppReady.Get() == true)
        utilities.ShowNotification("App Running");
    else
        log.info("App Running");

    utilities.SetStartAppOnBoot(Settings.General.runOnSystemStart.Get());

    if (Settings.General.startWatchingImmediately.Get())
        ToggleWatching(Settings.General.watchFolderLocation.Get());
}


function CheckForUpdates() {
    log.info("Check for updates clicked.");

    if (!globals.features.autoUpdate) return;

    autoUpdater.checkForUpdatesAndNotify();
}


let preferencesWindow;
let preferencesWindowShouldClose = false;

function CreatePreferencesWindow() {
    let _preferencesWindow = new ModernWindow({
        width: 400,
        transparent: false,
        frame: true,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js")
        }
    });
    // _preferencesWindow.removeMenu();
    _preferencesWindow.loadFile(utilities.GetView("preferences.html"));

    if (globals.features.devTools)
        _preferencesWindow.webContents.openDevTools();

    _preferencesWindow.on('close', function (e) {
        if (!preferencesWindowShouldClose) {
            e.preventDefault();
            ClosePreferences();
        } else {

        }

        // console.log(e);
    });

    return _preferencesWindow;
}

function OpenPreferences(args) {
    preferencesWindowShouldClose = false;
    if (preferencesWindow == null || preferencesWindow == undefined || preferencesWindow == '') {
        preferencesWindow = CreatePreferencesWindow();

        preferencesWindow.once('ready-to-show', () => {
            preferencesWindow.show();
        });
    } else {
        preferencesWindow.show();
    }
    preferencesWindow.webContents.send(globals.systemEventNames.OPEN_PREFERENCES, args);
}

function ClosePreferences() {

    preferencesWindow.webContents.send(globals.systemEventNames.REQUEST_CLOSE_PREFERENCES, {});

    // var choice = utilities.ShowAlert('Would you like to apply these settings?',
    //     {
    //         type: 'question',
    //         buttons: ['Yes', 'No', 'Cancel'],
    //         title: 'Confirm'
    //     });

    // if (choice !== 2) {
    //     preferencesWindowShouldClose = true;
    //     preferencesWindow.webContents.send(globals.systemEventNames.CLOSE_PREFERENCES, { applySettings: choice === 0 });
    // }
}




RENDER_LIST.on(globals.systemEventNames.WATCH_STATUS_CHANGED, function (isWatching) {
    // console.log(`Is Watching == ${isWatching}`);
    mainView.SendEventToRenderer(globals.systemEventNames.WATCH_STATUS_CHANGED, isWatching);

    if (mb != null) {
        mb.tooltip = app.name + " - " + (RENDER_LIST.isWatching) ? "Watching" : "Not Watching";
    }
});

RENDER_LIST.on(globals.systemEventNames.WATCH_LIST_UPDATED, function (items) {
    // mainView.SendEventToRenderer(globals.systemEventNames.WATCH_LIST_UPDATED, items);
    UpdateWatchList();
});

RENDER_LIST.on(globals.systemEventNames.RENDER_FINISHED, function (file) {
    utilities.ShowNotification(`Finished Rendering: ${file.pretty_name}`);

    if (Settings.Services.IFTTT.serviceEnabled.Get() == true) {
        IFTTT.SendRequest("wrender_finished", Settings.Services.IFTTT.apiKey.Get(), {
            value1: `\"${file.filename}\" Finished Rendering`,
            value2: "https://s3.amazonaws.com/cdn-origin-etr.akc.org/wp-content/uploads/2017/11/14112506/Pembroke-Welsh-Corgi-standing-outdoors-in-the-fall.jpg"
        });
    }
});

function UpdateWatchList() {
    // console.log(`List Updated!!`);
    if (mainView != null && mainView != undefined)
        mainView.SendEventToRenderer(globals.systemEventNames.WATCH_LIST_UPDATED, RENDER_LIST.items);
}
function UpdateWatchListStatus(event) {
    event.reply(globals.systemEventNames.WATCH_STATUS_CHANGED, RENDER_LIST.isWatching);
    if (mb != null) mb.tooltip = app.name + " - " + (RENDER_LIST.isWatching) ? "Watching" : "Not Watching";
}

ipcMain.on(globals.systemEventNames.WATCH_FILE_MANUALLY_REMOVED, (event, file) => {
    RENDER_LIST.Remove(file);
    UpdateWatchList();
});

ipcMain.on(globals.systemEventNames.DOM_LOADED, (event) => {
    UpdateWatchListStatus(event);
    UpdateWatchList();
});

function ToggleWatching(dir) {
    log.info(`Toggle Watching: ${dir}`);
    RENDER_LIST.ToggleWatching(dir, function () {
        UpdateWatchList();
    });
    utilities.ShowNotification((RENDER_LIST.isWatching) ? "Started Watching" : "Stopped Watching");
    // UpdateWatchListStatus(event);
}

ipcMain.on(globals.systemEventNames.TOGGLE_WATCH, (event, dir) => {
    ToggleWatching(dir);
});

ipcMain.on(globals.systemEventNames.REQUEST_QUIT, (event) => {
    utilities.RequestQuit(function () {
        RENDER_LIST.StopWatching();
    });
});


ipcMain.on(globals.systemEventNames.START_ON_BOOT_CHANGED, (e, args) => {
    utilities.SetStartAppOnBoot(args.startOnBoot);
});

ipcMain.on(globals.systemEventNames.OPEN_PREFERENCES, (e, args) => {
    console.log(args);
    OpenPreferences(args);
});

ipcMain.on(globals.systemEventNames.CLOSE_PREFERENCES, (e, args) => {
    // if (args.applySettings) {
    //     console.log("Settings Applied");
    //     mainView.SendEventToRenderer(globals.systemEventNames.APPLY_PREFERENCES, args);
    // }
    preferencesWindowShouldClose = true;
    preferencesWindow.close();
    preferencesWindow = null;
});

ipcMain.on(globals.systemEventNames.APPLY_PREFERENCES, (e, args) => {
    if (args.mustRestart && RENDER_LIST.isWatching) {
        RENDER_LIST.StopWatching(() => {
            RENDER_LIST.StartWatching(Settings.General.watchFolderLocation.Get());
        });
    }

    mainView.SendEventToRenderer(globals.systemEventNames.APPLY_PREFERENCES, args);
});

ipcMain.on(globals.systemEventNames.SELECT_DIRECTORY, async (event, args) => {
    var result = dialog.showOpenDialog({
        properties: ['openDirectory']
    }).then(result => {

        args = Object.assign(result, args);
        event.reply(globals.systemEventNames.DIRECTORY_SELECTED, args);
    });
});

ipcMain.on(globals.systemEventNames.CHECK_FOR_UPDATES, CheckForUpdates);