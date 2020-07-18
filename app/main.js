// Modules to control application life and create native browser window
const {
    app,
    BrowserWindow,
    Menu,
    Tray,
    webContents,
    ipcMain,
    EventEmitter
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
// const IFTTT = require("./components/IFTTT.js");

const iconPath = path.join(__dirname, "..", "./app/assets/images", "IconTemplate~white.png");

const isStandaloneWindow = true;
let mb = null;
let mainWindow = null;
let startWatchingOnBoot = true;
let isWatching = false;

let tray;




if (!isStandaloneWindow) {

    app.on("ready", function () {

        tray = new Tray(iconPath);
        const contextMenu = Menu.buildFromTemplate([
            { label: "Preferences", type: "normal" },
            { label: "About", type: "normal", role: "about" },
            { label: "Separator", type: "separator" },
            {
                label: "Quit", type: "normal", click: (menuItem, browserWindow, event) => {

                    utilities.RequestQuit(function () {
                        utilities.StopWatch();
                    });
                }
            },
        ]);
        tray.setContextMenu(contextMenu);

        mb = menubar({
            dir: path.join(__dirname || path.resolve(dirname("")), "..", utilities.GetView()),
            tray: tray,
            tooltip: `${app.name} - v${app.version}`,
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
            utilities.ShowNotification("App Ready");
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

        // and load the index.html of the app.
        mainWindow.loadFile(utilities.GetView("index.html"));
        // Open the DevTools.
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

                utilities.ShowNotification("App Ready");
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

let preferencesWindow;
function OpenPreferences() {
    preferencesWindow = new ModernWindow({
        width: 400,
        transparent: false,
        frame: true,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js")
        }
    });
    preferencesWindow.removeMenu();
    preferencesWindow.loadFile(utilities.GetView("index.html"));
}


const RENDER_LIST = new RenderList();

function SendEventToRenderer(event, arg0, arg1, arg2) {
    if (mb != null) {
        mb.window.webContents.send(event, arg0);
    } else {
        mainWindow.webContents.send(event, arg0);
    }
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

function UpdateWatchList() {
    // console.log(`List Updated!!`);
    SendEventToRenderer(globals.systemEventNames.WATCH_LIST_UPDATED, RENDER_LIST.items);
}
function UpdateWatchListStatus(event) {
    event.reply(globals.systemEventNames.WATCH_STATUS_CHANGED, RENDER_LIST.isWatching);
    if (mb != null) mb.tooltip = app.name + " - " + (RENDER_LIST.isWatching) ? "Watching" : "Not Watching";
}

ipcMain.on(globals.systemEventNames.DOM_LOADED, (event) => {
    UpdateWatchListStatus(event);
    UpdateWatchList();
});

ipcMain.on(globals.systemEventNames.TOGGLE_WATCH, (event, dir) => {
    RENDER_LIST.ToggleWatching(dir, function () {
        UpdateWatchList();
    });
    // UpdateWatchListStatus(event);
});


ipcMain.on(globals.systemEventNames.REQUEST_QUIT, (event) => {
    utilities.RequestQuit(function () {
        RENDER_LIST.StopWatching();
    });
});


ipcMain.on(globals.systemEventNames.RENDER_FINISHED, (event, file) => {
    utilities.ShowNotification(globals.systemEventNames.RENDER_FINISHED);
});