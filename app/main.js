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
const globals = require("./components/globals.js");
const utils = require("./components/utils.js");
const ModernWindow = require("./components/ModernWindow.js");
const chokidar = require("chokidar");
const { menubar } = require("menubar");
const RenderFile = require("./components/RenderFile.js");

const iconPath = path.join(__dirname, "..", "./app/assets/images", "IconTemplate~white.png");

const isStandaloneWindow = true;
let mb = null;
let mainWindow = null;

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

                    utils.RequestQuit(function () {
                        utils.StopWatch();
                    });
                }
            },
        ]);
        tray.setContextMenu(contextMenu);

        mb = menubar({
            dir: path.join(__dirname || path.resolve(dirname("")), "..", utils.GetView()),
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
            utils.ShowNotification("App Ready");
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
            width: 400,
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, "preload.js")
            }
        });
        // console.log(utils.ZERO);

        // and load the index.html of the app.
        mainWindow.loadFile(utils.GetView("index.html"));

        // Open the DevTools.
        // mainWindow.webContents.openDevTools();
    }

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.whenReady().then(() => {
        createWindow();

        app.on("activate", function () {
            // On macOS it"s common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });

    // Quit when all windows are closed, except on macOS. There, it"s common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on("window-all-closed", function () {
        utils.Quit(function () {
            utils.StopWatch();
        });
    });

    // In this file you can include the rest of your app"s specific main process
    // code. You can also put them in separate files and require them here.
}


let FILES_LIST = [];

function OnProcessFile(watchEvent, path) {

    switch (watchEvent) {
        case utils.WatchEvents.ADD:
            console.log(`Added \"${path}\"`);
            FILES_LIST.push(new RenderFile(path));
            break;
        case utils.WatchEvents.CHANGE:
            console.log(`Changed \"${path}\"`);
            let _tempFile = new RenderFile(path);
            let _index = FILES_LIST.findIndex((obj => obj.file == _tempFile.file));
            FILES_LIST[_index].RefreshInfo();
            break;
        case utils.WatchEvents.UNLINK:
            console.log(`Removed \"${path}\"`);
            FILES_LIST.splice(FILES_LIST.findIndex(e => e.file === path), 1);
            console.log(FILES_LIST);

            // var filtered = FILES_LIST.filter(function (value, index, arr) {
            //     return value.file == path;
            // });
            // console.log(`Filtered: ${filtered}`);
            break;
        default:
            console.log(`\"${watchEvent}\" not added to switch`);
            break;
    }

    UpdateList();
}

function UpdateList() {
    if (mb != null) {
        mb.window.webContents.send(globals.systemEventNames.WATCH_LIST_UPDATED, FILES_LIST);
    } else {
        mainWindow.webContents.send(globals.systemEventNames.WATCH_LIST_UPDATED, FILES_LIST);
    }
}



function UpdateStatus(event) {
    event.reply(globals.systemEventNames.WATCH_STATUS_CHANGED, isWatching);
    if (mb != null) mb.tooltip = app.name + " - " + (isWatching) ? "Watching" : "Not Watching";
}

ipcMain.on(globals.systemEventNames.DOM_LOADED, (event) => {
    UpdateStatus(event);
    UpdateList();
});

ipcMain.on(globals.systemEventNames.TOGGLE_WATCH, (event, dir) => {
    if (isWatching == false) {
        utils.StartWatch(dir, (e, p) => {
            if (mb != null) {
                mb.window.webContents.send(globals.systemEventNames.WATCH_FILE_STATUS_CHANGED, e, p);
            } else {
                mainWindow.webContents.send(globals.systemEventNames.WATCH_FILE_STATUS_CHANGED, e, p);
            }

            OnProcessFile(e, p);
        });
        isWatching = true;
    } else {
        utils.StopWatch();
        isWatching = false;
        FILES_LIST = [];
    }
    UpdateStatus(event);
    UpdateList();
});


ipcMain.on(globals.systemEventNames.REQUEST_QUIT, (event) => {
    utils.RequestQuit(function () {
        utils.StopWatch();
    });
});