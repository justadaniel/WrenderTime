"use strict";
Object.defineProperty(exports, "__esModule", {
	value: true
});

var fs = require("fs"); //Load the filesystem module


// let defaults = {
// 	displayName: "Build Action"
// };

var renderFile = class RenderFile {
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
		this.stats = fs.statSync(file);
	}

	RefreshInfo() {
		this.stats = fs.statSync(this.file);
	}
}
module.exports = renderFile;
