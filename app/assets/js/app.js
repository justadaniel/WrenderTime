// var sudo = require('sudo-prompt');

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}



// Dom7
var $$ = Dom7;

// Framework7 App main instance
var app = new Framework7({
    root: '#app', // App root element
    id: 'io.justadaniel.wrendertime', // App bundle ID
    name: 'Wrender Time', // App name
    theme: 'aurora', // Automatic theme detection
    autoDarkTheme: true,
    touch: {
        tapHold: true,
        disableContextMenu: true,
        auroraTouchRipple: false,
        iosTouchRipple: false,
        mdTouchRipple: false
    },
    view: {
        xhrCache: false,
        pushState: false,
        iosSwipeBack: false,
        mdSwipeBack: false,
        auroraSwipeBack: false
    },
    navbar: {
        collapseLargeTitleOnScroll: false
    },
    popup: {
        closeByBackdropClick: false,
    },
    swipeout: {
        removeElements: false
    },
    // App root data
    data: function () {
        return {
            user: {
                firstName: 'John',
                lastName: 'Doe',
            },
        };
    },
    // App root methods
    methods: {
        helloWorld: function () {
            app.dialog.alert('Hello World!');
        },
        sudo: function (cmd = 'echo hello', callbackSuccess = null) {
            var options = {
                name: require('electron').remote.app.name,
                // icns: __dirname + '/build/icon.icns'
            };
            sudo.exec(cmd, options, (error, stdout, stderr) => {
                if (error) throw error;
                if (callbackSuccess != null) {
                    callbackSuccess(stdout);
                } else {
                    console.log('stdout: ' + stdout);
                }
            });
        },
        getCurrentWindow: function () {
            return remote.getCurrentWindow();
        },
        doesWindowHaveFrame: function () {
            var currWindow = app.methods.getCurrentWindow();
            return (currWindow.frame == true) ? true : false;
        },
        minimize: function () {
            var currWindow = app.methods.getCurrentWindow();
            currWindow.minimize();
        },
        toggleMaximize: function () {
            var currWindow = app.methods.getCurrentWindow();
            currWindow.isMaximized() ? currWindow.unmaximize() : currWindow.maximize();
        },
        closeWindow: function () {
            var currWindow = app.methods.getCurrentWindow();
            currWindow.close();
        },
        showQuitIndicator: function (callback, timeout = 1000) {
            app.dialog.preloader("Quitting Application");
            setTimeout(function () {
                app.dialog.close();
                callback();
            }, timeout);
        },
        RequestApplicationQuit: function (callbackConfirm = null, callbackCancel = null) {
            app.dialog.confirm("Are you sure you want to quit?", "Application Quitting", (e) => {
                if (callbackConfirm != null) {
                    app.methods.showQuitIndicator(callbackConfirm);
                } else {
                    console.log("InvokeQuit");
                }
            },
                (e) => {
                    if (callbackCancel != null) {
                        callbackCancel(e);
                    } else {
                        console.log("CancelQuit");
                    }
                });
        }
    },
    // App routes
    routes: routes,
    // Enable panel left visibility breakpoint
    panel: {
        leftBreakpoint: 960,
    },
    on: {
        init: function () {
            // console.log('App initialized');
        },
        pageInit: function () {
            // console.log('Page initialized');
        },
    }
});

// if (app.online) {
//     console.log('online!');
// }
// if (!app.online) {
//     console.log('offline!');
// }

app.on('online', () => {
    console.log('connection established')
});
app.on('offline', () => {
    console.log('lost connection')
});
// or with single event
app.on('connection', (isOnline) => {
    if (isOnline) {
        console.log('connection established')
    } else {
        console.log('lost connection')
    }
});

$$(document).on('mousedown', function (e) {

    // app.swipeoutOpen();
    if (e.button == 2) {
        var _index = e.path.findIndex((arg => arg.className == 'swipeout'));

        if (_index >= 0) {
            app.swipeout.open(e.path[_index], "right", function () {

            });
        }
    }
});

$$(".password-mask-toggle").on('click', function () {
    let fieldName = $$(this).attr("data-field");
    let isMasked = $$(fieldName).attr("type") == "password";
    $$(fieldName).attr("type", (isMasked) ? "text" : "password");
    $$(this).text((isMasked) ? "Hide" : "Show");
});

$$(".toggle.service-toggle").on('change', function (e) {
    let linkedServiceStatus = $$(this).attr("data-linked-service-status");
    $$(linkedServiceStatus).text((e.target.checked) ? "Enabled" : "Disabled");
    $$(linkedServiceStatus).booleanToggleClass(e.target.checked, "text-color-green", "text-color-red");
});


$$('.open-directory-select-dialog').on('click', function (e) {
    let linkedPathOutput = $$(this).attr("data-directory-output");
    ipcRenderer.send(globals.systemEventNames.SELECT_DIRECTORY, {
        linkedPathOutput: linkedPathOutput
    });
});
ipcRenderer.on(globals.systemEventNames.DIRECTORY_SELECTED, (event, args) => {
    if (args.linkedPathOutput != null && args.linkedPathOutput != undefined && args.linkedPathOutput != '')
        $$(args.linkedPathOutput).val(args.filePaths[0]);
});

Dom7.fn.booleanToggleClass = function (booleanValue, classIfTrue, classIfFalse) {
    if ($$(this).hasClass((booleanValue) ? classIfFalse : classIfTrue))
        $$(this).removeClass((booleanValue) ? classIfFalse : classIfTrue);

    $$(this).addClass((booleanValue) ? classIfTrue : classIfFalse);
}

function UpdateAppTheme(isInterfaceDark = false) {
    let themeString = (isInterfaceDark) ? "dark" : "light";
    globalTheme = isInterfaceDark;
    $$('html').removeClass('theme-dark theme-light').addClass('theme-' + themeString);
}

function UpdateAppAccentColor(accentColor = "#f00") {
    const colorThemeProperties = app.utils.colorThemeCSSProperties(accentColor);
    var declaration = document.styleSheets[0].rules[0].style;
    Object.keys(colorThemeProperties).forEach(function (item) {
        declaration.setProperty(item, colorThemeProperties[item]);
    });
}
