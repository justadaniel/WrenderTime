// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {
    BrowserWindow,
    remote,
    ipcRenderer
} = require('electron');


remote.nativeTheme.on("updated", (e) => {
    UpdateAppTheme(remote.nativeTheme.shouldUseDarkColors);
});

ipcRenderer.on('BraveInterfaceThemeChanged', (event, data) => {
    UpdateAppTheme(data.isInterfaceDark);
});
ipcRenderer.on('BraveColorPreferencesChanged', (event, data) => {
    UpdateAppAccentColor(data.accentColor);
});




FileUtilities = {
    SaveToLocation: function (app) {
        remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
            properties: ['openFile', 'openDirectory']
        }).then(result => {
            console.log(result.canceled)
            console.log(result.filePaths)
        }).catch(err => {
            console.log(err)
        });
    }
}


