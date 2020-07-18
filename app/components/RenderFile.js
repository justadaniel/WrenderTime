"use strict";
Object.defineProperty(exports, "__esModule", {
	value: true
});

const globals = require("./Globals.js");
const utilities = require("./Utilities.js");
var fs = require("fs"); //Load the filesystem module
var path = require("path");


// let defaults = {
// 	displayName: "Build Action"
// };

const AudioFileExtensions = ["aac", "mp3", "wav"];
const VideoFileExtensions = ["m4v", "mov", "mp4", "avi", "flv", "mkv"];


const FILE_TYPE = {
	VIDEO: "Video",
	AUDIO: "Audio",
	UNKNOWN: "Unknown"
}

var RenderFile = class RenderFile {
	// fileObj = {
	// 	filename: filename,
	// 	expected: filename,
	// 	temp: {
	// 		audio: filename,
	// 		video: filename
	// 	}
	// };


	constructor(file) {
		this.file = file;
		this.RefreshSync();
	}

	RefreshSync() {
		let filepath = this.file;

		if (fs.existsSync(filepath)) {
			console.log(`File Refreshed - \"${filepath}\"`);
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
			console.log(`File Refreshed Asynchronusly - \"${filepath}\"`);
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
		this.file_extension = RenderFile.getFileExtension(filepath).toUpperCase();
		this.hasVideo = globals.supportedFileTypes.video.includes(this.file_extension);
		this.hasAudio = globals.supportedFileTypes.audio.includes(this.file_extension);

		const ameIDRegex = /(\d+\.\d+)/g;
		this.pretty_name = this.filename.replace(ameIDRegex, "").replace(`..${this.file_extension}`, "");
		this.ameID = this.filename.match(ameIDRegex);

		// "D:\GCC\_Exported\Military Recognition (2020).32436.1956.m4v"

		// console.log(`File Extension: ${this.file_extension}`);
		// console.log(`Has Video: ${this.hasVideo}`);
		// console.log(`Has Audio: ${this.hasAudio}`);

		if (this.hasAudio)
			this.type = FILE_TYPE.AUDIO;
		else if (this.hasVideo) {
			this.type = FILE_TYPE.VIDEO;
		} else {
			this.type = FILE_TYPE.UNKNOWN;
		}

		this.size = fs.statSync(filepath)["size"];
		this.size_formatted = utilities.BytesToHumanFileSize(this.size);


		// fs.stat(filepath, function (err, stats) {
		// 	if (err) {
		// 		console.error(err);
		// 		return;
		// 	}

		// 	console.log(stats.size);
		// 	// this.stats = stats;
		// 	// this.size = stats.size;
		// 	console.log(`Stats Updated Asynchronusly - \"${filepath}\"`);
		// });
	}

	HasData() {
		return this.stats["size"] > 0
	};

	static getIndexByPath(list, path) {
		return list.findIndex((obj => obj.file === path));
	}

	static removeFileByPath(list, path) {
		var _index = RenderFile.getIndexByPath(list, path);
		return list.splice(_index, 1);
	}

	static getAllRelatedFiles(list, filename) {
		// list.splice(list.findIndex(e => e.file === path), 1);
	}

	static getFileExtension(filename) {
		return path.extname(filename).replace(".", "");
	}

	static isSupportedFileType(filename) {
		var supportedFileTypes = globals.supportedFileTypes.video.concat(globals.supportedFileTypes.audio);
		return supportedFileTypes.includes(this.getFileExtension(filename));
	}
}
module.exports = RenderFile;
