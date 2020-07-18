"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});


var globals = {
    systemEventNames: {
        DOM_LOADED: "dom_loaded",
        WATCH_STATUS_CHANGED: "watch_status_changed",
        WATCH_FILE_STATUS_CHANGED: "watch_file_status_changed",
        WATCH_LIST_UPDATED: "watch_list_updated",
        TOGGLE_WATCH: "toggle_watch",
        REQUEST_QUIT: "request_quit",
        RENDER_FINISHED: "render-finished",
        OPEN_PREFERENCES: "open-preferences",
        CHECK_FOR_UPDATES: "check-for-updates"
    },
    supportedFileTypes: {
        video: ["m4v", "mov", "mp4", "avi", "flv", "mkv"],
        audio: ["aac", "mp3", "wav"]
    }
};

module.exports = globals;
