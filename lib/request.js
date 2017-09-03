const request = require('request');

module.exports = class Request {
	constructor(options) {
		this._request = request.defaults({'pool.maxSockets': options.maxSockets});
	}

	get request() {
		return this._request;
	}
}