const https = require('https');
const log = require('electron-log');

const IFTTT = {
	SendRequest(event, apiKey, body, method = 'POST') {
		const baseUrl = new URL(`https://maker.ifttt.com/trigger/${event}/with/key/${apiKey}`);
		return new Promise((resolve, reject) => {
			const request = https.request({
				path: baseUrl.pathname,
				host: baseUrl.hostname,
				port: baseUrl.port,
				method,
				headers: { "content-type": "application/json" }
			}, async (response) => { resolve(this.GetResponse(response)); });
			request.on('error', (err) => {
				console.error(err);
				reject(err);
			});
			if (body) {
				request.write(JSON.stringify(body));
			}
			request.end();
		});
	},
	GetResponse(response) {
		return new Promise((resolve) => {
			const bodyChunks = []
			response.on('data', chunk => bodyChunks.push(chunk));
			response.on('end', () => {
				const body = Buffer.concat(bodyChunks);
				if (response.headers) {
					const bodyResponse = body.toString('utf8');
					if (this.HasHeaderAndValue(response, 'content-type', 'application/json')) {
						resolve({ data: bodyResponse ? JSON.parse(bodyResponse) : undefined, headers: response.headers, code: response.statusCode });
					} else {
						resolve({ data: bodyResponse, headers: response.headers, code: response.statusCode });
					}
				}
			});
		});
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

module.exports = IFTTT;