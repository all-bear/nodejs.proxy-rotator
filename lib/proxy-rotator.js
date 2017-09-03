module.exports = class ProxyRotator {
    constructor(logger, proxyProvider, options) {
        this._logger = logger;
        this._proxyProvider = proxyProvider;
        this._index = 0;
        this._requestN = 0;

        this.options = options.rotateEveryNRequest;
    }

    get inited() {
        return this._proxyProvider.inited;
    }

    get proxy() {
        this._requestN++;
        if ((this._requestN % this.options.rotateEveryNRequest) && this._lastProxy) {
            return this._lastProxy;
        }

        const proxies = this._proxyProvider.proxies;

        this._index++;
        if (proxies.length < this._index + 1) {
            this._index = 0;
        }

        this._lastProxy = proxies[this._index];

        return this._lastProxy;
    }
};