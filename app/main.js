// Modules to control application life and create native browser window
const {
    app,
    BrowserWindow,
    Menu,
    Tray,
    webContents,
    ipcMain,
    dialog,
    EventEmitter,
    shell
} = require("electron");
const path = require("path");
// const rq = require("./components/electron-require.js");
const globals = require("./components/Globals.js");
const utilities = require("./components/Utilities.js");
const ModernWindow = require("./components/ModernWindow.js");
const chokidar = require("chokidar");
const { menubar } = require("menubar");
const RenderList = require("./components/RenderList.js");
const RenderFile = require("./components/RenderFile.js");
const Settings = require("./components/Settings.js");
const IFTTT = require("./components/services/IFTTT.js");

const iconPath = path.join(__dirname, "..", "./app/assets/images", "IconTemplate~white.png");

const isStandaloneWindow = false;
let mb = null;
let mainWindow = null;
let startWatchingOnBoot = false;
let isWatching = false;
let tray;
const devToolsEnabled = utilities.IsDev();

const RENDER_LIST = new RenderList();
const isMac = process.platform === 'darwin';


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
    ...(isMac ? [{
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
                    await shell.openExternal(globals.urls.github_issues)
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
                    await shell.openExternal(globals.urls.github_issues)
                }
            },
            { type: 'separator' },
            isMac ? { role: 'close' } : { role: 'quit' }
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: labels.githubRepo,
                click: async () => {
                    await shell.openExternal(globals.urls.github)
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

if (!isStandaloneWindow) {
    app.on("ready", function () {

        tray = new Tray(iconPath);

        tray.setContextMenu(contextMenu);

        mb = menubar({
            dir: path.join(__dirname || path.resolve(dirname("")), "..", utilities.GetView()),
            tray: tray,
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
        mb.app.commandLine.appendSwitch("disable-backgrounding-occluded-windows", "true");//could be a performance hit

        mb.on("ready", () => {
            OnAppReady();
        });

        // mb.on("after-create-window", () => {
        //     mb.window.openDevTools();
        // });
    });
}
else {

    function createWindow() {
        // Create the browser window.
        mainWindow = new ModernWindow({
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
        mainWindow.loadFile(utilities.GetView("index.html"));
        // Open the DevTools.
        if (devToolsEnabled)
            mainWindow.webContents.openDevTools();
    }

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.whenReady().then(() => {
        createWindow();

        app.on("activate", function () {
            // On macOS it"s common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
                OnAppReady();
            }
        });
    });

    // Quit when all windows are closed, except on macOS. There, it"s common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on("window-all-closed", function () {
        utilities.Quit(function () {
            RENDER_LIST.StopWatching();
        });
    });

    // In this file you can include the rest of your app"s specific main process
    // code. You can also put them in separate files and require them here.
}



function OnAppReady() {
    if (Settings.General.showNotificationOnAppReady.Get() == true)
        utilities.ShowNotification("App Running");
    else
        console.log("App Running");

    utilities.SetStartAppOnBoot(Settings.General.runOnSystemStart.Get());

    if (Settings.General.startWatchingImmediately.Get())
        ToggleWatching(Settings.General.watchFolderLocation.Get());
}



function SendEventToRenderer(event, arg0, arg1, arg2) {
    if (mb != null) {
        mb.window.webContents.send(event, arg0);
    } else {
        mainWindow.webContents.send(event, arg0);
    }
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
    _preferencesWindow.removeMenu();
    _preferencesWindow.loadFile(utilities.GetView("preferences.html"));

    if (devToolsEnabled)
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

function OpenPreferences() {
    preferencesWindowShouldClose = false;
    if (preferencesWindow == null || preferencesWindow == undefined || preferencesWindow == '') {
        preferencesWindow = CreatePreferencesWindow();

        preferencesWindow.once('ready-to-show', () => {
            preferencesWindow.show();
        });
    } else {
        preferencesWindow.show();
    }
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
    SendEventToRenderer(globals.systemEventNames.WATCH_STATUS_CHANGED, isWatching);

    if (mb != null) {
        mb.tooltip = app.name + " - " + (RENDER_LIST.isWatching) ? "Watching" : "Not Watching";
    }
});

RENDER_LIST.on(globals.systemEventNames.WATCH_LIST_UPDATED, function (items) {
    // SendEventToRenderer(globals.systemEventNames.WATCH_LIST_UPDATED, items);
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
    SendEventToRenderer(globals.systemEventNames.WATCH_LIST_UPDATED, RENDER_LIST.items);
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

ipcMain.on(globals.systemEventNames.OPEN_PREFERENCES, (e, args) => {
    OpenPreferences();
});

ipcMain.on(globals.systemEventNames.START_ON_BOOT_CHANGED, (e, args) => {
    utilities.SetStartAppOnBoot(args.startOnBoot);
});

ipcMain.on(globals.systemEventNames.CLOSE_PREFERENCES, (e, args) => {
    if (args.applySettings)
        console.log("Settings Applied");

    preferencesWindowShouldClose = true;
    preferencesWindow.close();
    preferencesWindow = null;
});

ipcMain.on(globals.systemEventNames.SELECT_DIRECTORY, async (event, args) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    args = Object.assign(result, args);
    event.reply(globals.systemEventNames.DIRECTORY_SELECTED, args);
});