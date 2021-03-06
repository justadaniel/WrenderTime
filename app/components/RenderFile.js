"use strict";
Object.defineProperty(exports, "__esModule", {
	value: true
});
const EventEmitter = require('events');

const globals = require("./Globals.js");
const utilities = require("./Utilities.js");
var fs = require("fs"); //Load the filesystem module
var path = require("path");
const log = require('electron-log');


// let defaults = {
// 	displayName: "Build Action"
// };




const FILE_TYPE = {
	VIDEO: "Video",
	AUDIO: "Audio",
	UNKNOWN: "Unknown"
}

const AME_ID_REGEX = /(?<=\.)\d+\.\d+/g;

var RenderFile = class RenderFile extends EventEmitter {
	file = null;
	supportingVideoFile = null;
	supportingAudioFile = null;
	status = null;
	isFinished = false;
	wasNotifiedOfComplete = true;


	constructor(file) {
		super();
		this.file = file;
		this.RefreshSync();
		this.ResetNotify();
	}

	RefreshSync() {
		let filepath = this.file;

		if (fs.existsSync(filepath)) {
			// log.info(`File Refreshed - \"${filepath}\"`);
			this.UpdateStatsAsync();
		}
	}

	Refresh() {
		let filepath = this.file;

		fs.access(filepath, fs.F_OK, (err) => {
			if (err) {
				console.error(err);
				return;
			}

			//file exists
			// log.info(`File Refreshed Asynchronusly - \"${filepath}\"`);
			this.UpdateStatsAsync();

			// setInterval(() => {

			// }, 1000);
		});
	}

	async UpdateStatsAsync() {
		let filepath = this.file;
		// this.stats = fs.statSync(filepath);
		this.dir = filepath.replace(path.basename(filepath), "");
		this.filename = path.basename(filepath);
		this.file_extension = RenderFile.GetFileExtension(filepath);
		this.isvideo = globals.supportedFileTypes.video.includes(this.file_extension);
		this.isaudio = globals.supportedFileTypes.audio.includes(this.file_extension);

		// const ameIDRegex = /(\d+\.\d+)/g;
		this.pretty_name = path.basename(filepath).replace(AME_ID_REGEX, "").replace(`.${this.file_extension}`, "").replace(/\.$/, "");

		if (this.supportingAudioFile !== null && this.supportingAudioFile !== undefined)
			this.ameID = RenderFile.GetEncoderID(this.supportingAudioFile);
		else if (this.supportingVideoFile !== null && this.supportingVideoFile !== undefined)
			this.ameID = RenderFile.GetEncoderID(this.supportingVideoFile);
		else
			this.ameID = RenderFile.GetEncoderID(this.filename);

		// "D:\GCC\_Exported\Military Recognition (2020).32436.1956.m4v"

		// log.info(`File Extension: ${this.file_extension}`);
		// log.info(`Has Video: ${this.hasVideo}`);
		// log.info(`Has Audio: ${this.hasAudio}`);

		if (this.isaudio)
			this.type = FILE_TYPE.AUDIO;
		else if (this.isvideo) {
			this.type = FILE_TYPE.VIDEO;
		} else {
			this.type = FILE_TYPE.UNKNOWN;
		}

		this.size = fs.statSync(filepath)["size"];
		this.size_formatted = utilities.BytesToHumanFileSize(this.size);
		this.has_data = (this.size > 0);
		this.isFinished = (this.size > 0 && !this.HasEncoderID());

		// fs.stat(filepath, function (err, stats) {
		// 	if (err) {
		// 		console.error(err);
		// 		return;
		// 	}

		// 	log.info(stats.size);
		// 	// this.stats = stats;
		// 	// this.size = stats.size;
		// 	log.info(`Stats Updated Asynchronusly - \"${filepath}\"`);
		// });
	}

	/**
	 * @param {string} path the file path
	 * @returns {boolean} returns true if the file has an Adobe Media Encoder ID in the filename
	 */
	HasEncoderID() {
		return (this.ameID !== null && this.ameID !== undefined);
	}

	static GetEncoderID(path) {
		// const ameIDRegex = /(?<=\.)\d+\.\d+/g;
		return path.match(AME_ID_REGEX);
	}
	static HasEncoderID(path) {
		return RenderFile.GetEncoderID(path) != null;
	}

	SetMainFile(path) {
		if (globals.supportedFileTypes.mainVideo.includes(RenderFile.GetFileExtension(path))) {
			this.file = path;
			this.Refresh();
			this.ResetNotify();
			log.info(`Changed Main File - ${path}`);
		}
	}

	ResetNotify() {
		this.wasNotifiedOfComplete = false;
	}

	Notify() {
		this.wasNotifiedOfComplete = true;
		log.info("Notifying of completion");
		this.emit(globals.systemEventNames.FILE_RENDER_FINISHED, this);
	}

	AddSupportFile(path) {
		if (globals.supportedFileTypes.video.includes(RenderFile.GetFileExtension(path))) {
			this.supportingVideoFile = path;
		} else if (globals.supportedFileTypes.audio.includes(RenderFile.GetFileExtension(path))) {
			this.supportingAudioFile = path;
		}
		log.info(`Added Supporting File - ${path}`);
	}

	/**
	 * @returns {boolean} returns true if it wasn't fired already and is finished
	 */
	ShouldNotifyComplete() {
		this.Refresh();
		log.info(`Was Notified ${this.wasNotifiedOfComplete}`);
		log.info(`Size: ${this.size}`);

		let shouldNotify = this.size > 0 && this.wasNotifiedOfComplete == false && globals.supportedFileTypes.mainVideo.includes(this.file_extension);

		if (utilities.IsMac())
			shouldNotify = this.wasNotifiedOfComplete == false && globals.supportedFileTypes.mainVideo.includes(this.file_extension);

		log.info(`Should Notify ${shouldNotify}`);
		return shouldNotify;
	}

	/**
	 * @param {string} filepath The file name
	 */
	static GetPrettyName(filepath) {
		return path.basename(filepath).replace(AME_ID_REGEX, "").replace(`.${RenderFile.GetFileExtension(filepath)}`, "").replace(/\.$/, "");
	}

	static GetIndexByPath(list, path) {
		return list.findIndex((obj => obj.file === path));
	}

	static RemoveFileByPath(list, path) {
		var _index = RenderFile.GetIndexByPath(list, path);
		return list.splice(_index, 1);
	}

	static GetAllRelatedFiles(list, filename) {
		// list.splice(list.findIndex(e => e.file === path), 1);
	}

	/**
	 * @param {string} filename The file name
	 * @returns {string} file extension (i.e. mp4)
	 */
	static GetFileExtension(filename) {
		return path.extname(filename).replace(".", "");
	}

	static IsSupportedFileType(filename) {
		var supportedFileTypes = globals.supportedFileTypes.video.concat(globals.supportedFileTypes.audio);
		return supportedFileTypes.includes(this.GetFileExtension(filename));
	}
}
module.exports = RenderFile;
