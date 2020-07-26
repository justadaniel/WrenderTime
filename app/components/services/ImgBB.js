const https = require('https');
const fs = require('fs');
const log = require('electron-log');


// function to encode file data to base64 encoded string
function base64_encode(file) {
	// read binary data
	var bitmap = fs.readFileSync(file);
	// convert binary data to base64 encoded string
	return new Buffer(bitmap).toString('base64');
}


const ImgBB = {
	Upload(image, apiKey, expiration = 600) {
		const baseUrl = new URL(`https://api.imgbb.com/1/upload?key=${apiKey}&expiration=${expiration}`);
		const base64Image = base64_encode(image);
		return new Promise((resolve, reject) => {
			const request = https.request({
				path: baseUrl.pathname,
				host: baseUrl.hostname,
				port: baseUrl.port,
				method: "POST",
				headers: { "content-type": "application/json" }
			}, async (response) => { resolve(this.GetResponse(response)); });
			request.on('error', (err) => {
				console.error(err);
				reject(err);
			});

			request.write(JSON.stringify({ image: base64Image }));
			request.end();
		});
	},
	GetResponse(response) {
		return new Promise((resolve) => {
			const bodyChunks = [];
			response.on('data', chunk => bodyChunks.push(chunk));
			response.on('end', () => {
				const body = Buffer.concat(bodyChunks);
				if (response.headers) {
					const bodyResponse = body.toString('utf8');
					console.log(bodyResponse);
					if (this.HasHeaderAndValue(response, 'content-type', 'application/json')) {
						resolve({ data: bodyResponse ? JSON.parse(bodyResponse) : undefined, headers: response.headers, code: response.statusCode });
					} else {
						resolve({ data: bodyResponse, headers: response.headers, code: response.statusCode });
					}
				}
			});
		})
	},
	HasHeaderAndValue(response, header, value) {
		for (var val in response.headers) {
			if (val.toLowerCase() === header.toLowerCase()) {
				return response.headers[val].startsWith(value);
			}
		}
		return false;
	}
}

module.exports = ImgBB;