routes = [
    {
        path: '/',
        url: './main.html',
        alias: ['/main/'],
        on: {
            pageInit: function (e, page) {
                // app.dialog.alert("It Works!");
            },
            pageAfterOut: function (e, page) {
                // page has left the view
            },
        }
    },
    {
        path: '/popup-content/',
        popup: {
            content: `
                <div class="popup">
                <div class="view">
                    <div class="page">
                    <a class="link back">Back</a>
                    </div>
                </div>
                </div>`
        }
    },
    {
        path: '/left-panel/',
        panel: {
            content: `
                <div class="panel panel-left panel-cover">
                <div class="view">
                    <div class="page">
                    ...
                    </div>
                </div>
                </div>`
        }
    },
    {
        path: '(.*)',
        // url: './pages/404.html',
        async: function (routeTo, routeFrom, resolve, reject) {
            var router = this;
            var app = router.app;
            console.log("It Worked!");

            app.dialog.create({
                title: "Error: \"Not Found\"",
                text: "\"I hate to say it, but it looks like the system you're searching for doesn't exist.\" - Jocasta Nu",
                buttons: [{
                    text: "That's Impossible",
                    keyCodes: [13]
                }],
                verticalButtons: true,
                onClick: (dialog, e) => {
                    console.log(e);
                }
            }).open();
        }
    }
]