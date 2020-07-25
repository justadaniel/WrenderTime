"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});


var globals = {
    systemEventNames: {
        DOM_LOADED: "dom_loaded",
        WATCH_STATUS_CHANGED: "watch_status_changed",
        WATCH_FILE_MANUALLY_REMOVED: "watch_file_manually_removed",
        WATCH_FILE_STATUS_CHANGED: "watch_file_status_changed",
        WATCH_LIST_UPDATED: "watch_list_updated",
        TOGGLE_WATCH: "toggle_watch",
        REQUEST_QUIT: "request_quit",
        RENDER_FINISHED: "render-finished",
        FILE_RENDER_FINISHED: "file-render-finished",
        OPEN_PREFERENCES: "open-preferences",
        APPLY_PREFERENCES: "apply-preferences",
        REQUEST_CLOSE_PREFERENCES: "request-close-preferences",
        CLOSE_PREFERENCES: "close-preferences",
        CHECK_FOR_UPDATES: "check-for-updates",
        SELECT_DIRECTORY: "select-directory",
        DIRECTORY_SELECTED: "directory-selected"
    },
    supportedFileTypes: {
        video: ["m4v", "mov", "mp4", "avi", "flv", "mkv"],
        audio: ["aac", "mp3", "wav"]
    },
    urls: {
        github: "https://github.com/justadaniel/WrenderTime",
        github_issues: "https://github.com/justadaniel/WrenderTime/issues"
    }
};

module.exports = globals;
