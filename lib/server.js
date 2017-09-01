const http = require('http');
const url = require('url');

module.exports = class Server {
    constructor(logger, request, proxyProvider, proxyRotator, options) {
        this._logger = logger;
        this._proxyProvider = proxyProvider;
        this._proxyRotator = proxyRotator;
        this._request = request.request;
        this._requestQty = 0;

        const initInterval = setInterval(() => {
            if (this._proxyProvider.inited && this._proxyRotator) {
                clearInterval(initInterval);
                http.createServer((this._onRequest.bind(this))).listen(options.port);
                this._logger.info(`Server started on port ${options.port}`);
            }
        }, 100);
    }

    _getRequestedUrl(req) {
        return url.parse(req.url, true).query.url || req.url;
    }

    _getHeaders(req) {
        const headers = req.headers;
        const requestedHost = url.parse(this._getRequestedUrl(req)).hostname

        headers['Host'] = requestedHost;

        return headers;
    }

    _onRequest(req, res) {
        this._logger.info(`Request for proxy`);

        const proxyData = this._proxyRotator.proxy;

        this._requestQty++;
        const requestId = Date.now() + this._requestQty;

        this._logger.info(`Request with id ${requestId} ${req.url} matched with proxy ${proxyData.url}`);

        this._request({
            url: this._getRequestedUrl(req), 
            proxy: proxyData.url, 
            method: 'GET',
            headers: this._getHeaders(req)
        }).on('error', (e) => {
            this._proxyProvider.invalidate(proxyData);

            this._logger.info(`Error occured ${e} during request with id ${requestId}`);
            this._requestQty--;
        })
        .on('response', () => {
            this._logger.info(`Request with id ${requestId} with proxy ${proxyData.url} finished`);
            this._requestQty--;
        })
        .pipe(res);
    }
};