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



const AudioFileExtensions = ["aac", "mp3", "wav"];
const VideoFileExtensions = ["m4v", "mov", "mp4", "avi", "flv", "mkv"];


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


	Add(path) {
		let newItem = new RenderFile(path);
		// console.log(`Added: \"${newItem.file}\"`);
		this.items.push(newItem);
		console.log(`List increased to \"${this.items.length}\"`);
	}

	Change(path) {
		console.log(`Changed \"${path}\"`);
		let _tempFile = new RenderFile(path);
		let _index = this.items.findIndex((obj => obj.file == _tempFile.file));
		// let _index2 = RenderFile.getIndexByPath(path);

		// console.log(`Normal Index: ${_index}`);
		// console.log(`Better Index: ${_index2}`);


		if (this.items[_index] != null) {
			this.items[_index].Refresh();
		}
	}

	Remove(path) {
		// console.log(`Removed: \"${file}\"`);
		this.items.splice(this.items.findIndex((obj => obj.file == file)), 1);
		console.log(`List decreased to \"${this.items.length}\"`);
	}

	Clear() {
		this.items = [];
		this.emit(globals.systemEventNames.WATCH_LIST_UPDATED, this.items);
		console.log("Items Cleared");
	}

	RemoveByPath(path) {
		this.items.splice(this.items.findIndex((obj => obj.file == path)), 1);
	}

	RemoveFileByPath(path) {
		var _index = RenderFile.getIndexByPath(this.items, path);
		return this.items.splice(_index, 1);
	}

	GetIndexByPath(path) {
		return this.items.findIndex((obj => obj.file === path));
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
				this.RemoveByPath(path);
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
