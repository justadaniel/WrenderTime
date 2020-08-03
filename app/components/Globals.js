"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const utilities = require("./Utilities.js");


var globals = {
    systemEventNames: {
        DOM_LOADED: "dom_loaded",
        ERROR: "error",
        WATCH_STATUS_CHANGED: "watch-status-changed",
        WATCH_FILE_MANUALLY_REMOVED: "watch-file-manually-removed",
        WATCH_FILE_STATUS_CHANGED: "watch-file-status-changed",
        WATCH_LIST_UPDATED: "watch-list-updated",
        TOGGLE_WATCH: "toggle-watch",
        REQUEST_QUIT: "request-quit",
        RENDER_FINISHED: "render-finished",
        FILE_RENDER_FINISHED: "file-render-finished",
        OPEN_PREFERENCES: "open-preferences",
        APPLY_PREFERENCES: "apply-preferences",
        REQUEST_CLOSE_PREFERENCES: "request-close-preferences",
        CLOSE_PREFERENCES: "close-preferences",
        SELECT_DIRECTORY: "select-directory",
        DIRECTORY_SELECTED: "directory-selected",
        START_ON_BOOT_CHANGED: "start-on-boot-changed",
        CHECK_FOR_UPDATES: "check-for-updates",
        CHECKING_FOR_UPDATES: "checking-for-update",
        UPDATE_AVAILABLE: "update-available",
        UPDATE_NOT_AVAILABLE: "update-not-available",
        UPDATE_DOWNLOADING: "download-progress",
        UPDATE_DOWNLOADED: "update-downloaded"
    },
    supportedFileTypes: {
        mainVideo: ["mp4", "mov"],
        video: ["m4v", "mov", "mp4", "avi", "flv", "mkv"],
        audio: ["aac", "mp3", "wav"]
    },
    urls: {
        github: "https://github.com/justadaniel/WrenderTime",
        github_issues: "https://github.com/justadaniel/WrenderTime/issues",
        meh: "meh"
    },
    features: {
        autoUpdate: true,
        devTools: utilities.IsDev(),
        isStandaloneWindow: false
    }
};

module.exports = globals;