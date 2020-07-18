"use strict";
Object.defineProperty(exports, "__esModule", {
	value: true
});
const EventEmitter = require('events');
var inherits = require('util').inherits;
const globals = require("./Globals.js");
const utilities = require("./Utilities.js");
const chokidar = require("chokidar");
const RenderFile = require("./RenderFile.js");
var fs = require("fs"); //Load the filesystem module
var path = require("path");
const { Console } = require('console');


const FILE_TYPE = {
	VIDEO: "Video",
	AUDIO: "Audio",
	UNKNOWN: "Unknown"
}

var RenderList = class RenderList extends EventEmitter {
	items = [];
	isInit = false;
	isWatching = false;
	watcher = null;
	watchDir = null;

	static WatchEvents = {
		ADD: "add",
		ADD_DIR: "addDir",
		CHANGE: "change",
		UNLINK: "unlink",
		UNLINK_DIR: "unlinkDir",
		ERROR: "error",
		READY: "ready",
		RAW: "raw"
	};

	constructor(watchDir) {
		super();
		this.watchDir = watchDir;
		//this.setItems(options.items);
		this.Init();
	}

	Init() {
		this.isInit = true;
	}

	GetItems() {
		return this.items;
	}

	SetItems(items) {
		if (this.isInit == false) {
			console.error("Render list not Initialized!");
			return;
		}

		if (this.items !== undefined && this.items !== null)
			this.items = items;
	}


	/**
	 * @param {string} path the file path
	 * @returns {boolean} true if exists
	 */
	Exists(path) {
		let _index = this.items.findIndex((obj => obj.pretty_name == RenderFile.GetPrettyName(path)));
		return this.items[_index] !== null && this.items[_index] !== undefined;
	}

	/**
	 * Adds a file to the list based on it's path.
	 * @param {string} path the file path
	 */
	Add(path) {
		if (!this.Exists(path)) {
			let _newItem = new RenderFile(path);


			if (_newItem.HasEncoderID()) {
				_newItem.AddSupportFile(path);
			}

			this.items.unshift(_newItem);
		} else {
			let _index = this.GetIndexByPrettyName(path);
			let _currentFile = this.items[_index];

			if (RenderFile.HasEncoderID(path)) {
				_currentFile.AddSupportFile(path);
			} else {
				_currentFile.SetMainFile(path);
			}
		}
	}

	Change(path) {
		console.log(`File: ${path}`);

		if (this.Exists(path)) {
			console.log(`Changed \"${path}\"`);
			let _index = this.GetIndexByPrettyName(path);
			let _changedFile = this.items[_index];
			_changedFile.Refresh();

			if (_changedFile.ShouldNotifyComplete()) {
				_changedFile.Notify();
				this.emit(globals.systemEventNames.RENDER_FINISHED, _changedFile);
			}
		}
	}

	Remove(path) {
		if (!RenderFile.HasEncoderID(path)) {
			this.RemoveFileByName(path);
			console.log(`Removed: \"${path}\"`);
		} else {
			console.log(`Wanted to remove: \"${path}\"`);
		}
	}

	Clear() {
		this.items = [];
		this.emit(globals.systemEventNames.WATCH_LIST_UPDATED, this.items);
		console.log("Items Cleared");
	}

	RemoveFileByName(name) {
		var _index = this.GetIndexByPrettyName(name);
		this.emit(globals.systemEventNames.WATCH_LIST_UPDATED, this.items);
		return this.items.splice(_index, 1);
	}

	RemoveFileByPath(path) {
		var _index = this.GetIndexByPath(path);
		this.emit(globals.systemEventNames.WATCH_LIST_UPDATED, this.items);
		return this.items.splice(_index, 1);
	}

	GetIndexByPath(path) {
		return this.items.findIndex((obj => obj.file === path));
	}
	GetIndexByPrettyName(path) {
		return this.items.findIndex((obj => obj.pretty_name === RenderFile.GetPrettyName(path)));
	}
	/**
	 * Gets RenderFile from RenderList using the full file name.
	 * @param {string} path path to file
	 * @returns {RenderFile} file in list
	 */
	GetFileByPath(path) {
		let _index = this.GetIndexByPath(path);
		return this.items[_index];
	}
	/**
	 * Gets RenderFile from RenderList using the "Pretty Name"
	 * @param {string} path path to file
	 * @returns {RenderFile} file in list
	 */
	GetFileByPrettyName(path) {
		let _index = this.GetIndexByPrettyName(path);
		return this.items[_index];
	}


	ProcessFile(watchEvent, path, callback = function () { }) {
		if (!RenderList.IsSupportedFileType(path)) return;

		switch (watchEvent) {
			case RenderList.WatchEvents.ADD:
				this.Add(path);
				break;
			case RenderList.WatchEvents.CHANGE:
				this.Change(path);
				break;
			case RenderList.WatchEvents.UNLINK:
				this.Remove(path);
				// console.log(`Wanted to unlink ${path}`);
				break;
			default:
				console.log(`\"${watchEvent}\" not added to switch`);
				break;
		}

		this.emit(globals.systemEventNames.WATCH_FILE_STATUS_CHANGED, watchEvent, path);
		this.emit(globals.systemEventNames.WATCH_LIST_UPDATED, this.items);

		callback(watchEvent, path);
	}

	StartWatching(dir, fileChangeCallback = function () { }) {
		this.watchDir = dir;
		this.isWatching = true;
		this.watcher = chokidar.watch(dir);
		console.log(`Started watching at path \"${dir}\"`);

		this.watcher.on("all", (event, path) => {
			// console.log(event, path);
			this.ProcessFile(event, path, fileChangeCallback);
			// ipcRenderer.send(globals.systemEventNames.WATCH_STATUS_CHANGED, this.isWatching);

			this.emit(globals.systemEventNames.WATCH_STATUS_CHANGED, this.isWatching);

			fileChangeCallback(event, path);
		});
		return this.isWatching;
	}

	StopWatching(callback = function () { }) {
		let thisList = this;
		if (this.watcher != null && this.watcher != "undefined") {
			this.watcher.close().then(() => {
				// this.isWatching = false;
				console.log("Closed watcher");
			});
			this.Clear();
			this.watcher = null;
			this.isWatching = false;
			this.emit(globals.systemEventNames.WATCH_STATUS_CHANGED, this.isWatching);
			callback();
		}
		return this.isWatching;
	}

	ToggleWatching(dir, fileChangeCallback = function () { }, onStopCallback = function () { }) {
		if (this.isWatching == true) {
			this.StopWatching(onStopCallback);
		} else {
			this.watchDir = dir;
			this.StartWatching(this.watchDir, fileChangeCallback);
		}
		return this.isWatching;
	}

	static GetAllRelatedFiles(filename) {
		// this.items.splice(this.items.findIndex(e => e.file === path), 1);
	}

	static GetFileExtension(filename) {
		return path.extname(filename).replace(".", "");
	}

	static IsSupportedFileType(filename) {
		var supportedFileTypes = globals.supportedFileTypes.video.concat(globals.supportedFileTypes.audio);
		return supportedFileTypes.includes(this.GetFileExtension(filename));
	}
}
module.exports = RenderList;
