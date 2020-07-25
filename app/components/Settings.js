"use strict";
Object.defineProperty(exports, "__esModule", {
	value: true
});
const EventEmitter = require('events');

const globals = require("./Globals.js");
const utilities = require("./Utilities.js");
const settings = require("electron-settings");
var fs = require("fs"); //Load the filesystem module
var path = require("path");

settings.configure({
	fileName: 'settings.json',
	prettify: true
});

var Settings = class Settings {
	static General = {
		runOnSystemStart: {
			Get: null,
			Set: null
		},
		startWatchingOnStart: {
			Get: null,
			Set: null
		},
		watchFolderLocation: {
			Get: () => Settings.Get("watch-folder-path"),
			Set: (path) => Settings.Set("watch-folder-path", path)
		}
	}

	static Services = {
		IFTTT: {
			serviceEnabled: {
				Get: () => Settings.Get("ifttt-service-enabled", false),
				Set: (value) => Settings.Set("ifttt-service-enabled", value)
			},
			apiKey: {
				Get: () => Settings.Get("ifttt-api-key"),
				Set: (value) => Settings.Set("ifttt-api-key", value)
			}
		}
	}

	/**
	 * Returns the path to the settings file
 	*/
	static GetSettingsFile() {
		return settings.file();
	}

	/**
	 * @param {string} key The key for the saved value
	 * @param {string} defaultValue The default value if it doesn't exist
	 */
	static Get(key, defaultValue = null) {
		if (settings.hasSync(key)) {
			return settings.getSync(key);
		} else {
			settings.setSync(key, defaultValue);
			return defaultValue;
		}
	}

	/**
	 * @param {string} key The key for the value
	 * @param {string} value The value to save
	 * @returns {boolean} if the value was changed
	 */
	static Set(key, value) {
		if (Settings.Get(key) != value) {
			settings.setSync(key, value);
			return true;
		} else {
			return false;
		}
	}

	/**
	 * @param {string} key The key for the saved value
	 */
	static Has(key) {
		return settings.hasSync(key);
	}

	/**
	 * @param {string} key The key for the saved value
	 */
	static Unset(key) {
		settings.unsetSync(key);
	}
};

module.exports = Settings;