const ProxyLists = require('proxy-lists');

module.exports = class ProxyProvider {
    static get CHECK_BY_URL() { return 'https://www.google.com' };
    static get CHECK_RESPONSE_BY_REGEXP() { return /name\=\"q\"/g };

    constructor(logger, request, options) {
        this._checkedProxies = [];
        this._availableProxies = [];
        this._minProxyLimit = options.minProxyLimit;
        this._proxyLimit = options.proxyLimit;
        this._logger = logger;
        this._request = request.request;
        this._proxyRequestTimeLimit = options.proxyCheckTimeLimit;
        this.inited = false;
        this._checkRequests = {};

        this.rescan();

        setInterval(this.rescan.bind(this), options.rescanInterval);
        setInterval(this.refresh.bind(this), options.refreshInterval);
    }

    _abortCheck() {
        let request;

        for (let id in this._checkRequests) {
            if (!this._checkRequests.hasOwnProperty(id)) {
                return;
            }

            request = this._checkRequests[id];

            if (request) {
                request.abort();
            }
        }

        this._checkRequests = {};
    }

    _check(proxy) {
        return new Promise((resolve) => {
            let isRequestEnded = false;
            const requestId = Object.keys(this._checkRequests).length;

            let request = this._request({
                    url: ProxyProvider.CHECK_BY_URL,
                    method: 'GET',
                    proxy
                }, (error, response, body) => {
                    if (isRequestEnded) {
                        return;
                    }

                    this._logger.progress();

                    const isValid = !error &&
                        response && response.statusCode === 200 &&
                        ProxyProvider.CHECK_RESPONSE_BY_REGEXP.test(body);

                    if (isValid) {
                        this._logger.info(`Successfully refresh proxy ${proxy}`);
                    }

                    isRequestEnded = true;
                    this._checkRequests[requestId] = null;

                    resolve(isValid);
                }).on('error', (ignored) => {
                    if (isRequestEnded) {
                        return;
                    }

                    this._logger.progress('e');

                    isRequestEnded = true;
                    this._checkRequests[requestId] = null;

                    resolve(false);
                });

            this._checkRequests[requestId] = request;

            setTimeout(() => {
                if (!isRequestEnded && !request._aborted) {
                    this._logger.progress('t');

                    request.abort();
                    this._checkRequests[requestId] = null;

                    resolve(false);
                }
            }, this._proxyRequestTimeLimit);
        });
    }

    _getAvailableProxies() {
        this._logger.info('Retrieve proxy start');

        return new Promise((resolve) => {
            let proxies = [];

            const request = ProxyLists.getProxies({
                protocols: ['http'],
                sourcesBlackList: ['bitproxies', 'kingproxies']
            });

            request.on('data', (newProxies) => {
                proxies = proxies.concat(newProxies);
            });

            request.on('error', (e) => {
                this._logger.info(e);
            });

            request.once('end', () => {
                this._logger.info('Retrieve proxy end');

                resolve(proxies);
            });
        });
    }

    refresh() {
        if (this._onRefresh) {
            return;
        }

        this._onRefresh = true;

        let newCheckedProxies = [];
        let leftToCheckQty = this._availableProxies.length;

        if (!leftToCheckQty) {
            this._onRefresh = false;
            return;
        }

        this._logger.info('Refresh proxies start');

        let ready = false;

        this._availableProxies.forEach((proxyData) => {
            if (ready) {
                return;
            }

            this._check(proxyData.url).then((isValid) => {
                if (ready) {
                    return;
                }

                leftToCheckQty--;

                if (!isValid && leftToCheckQty) {
                    return;
                }

                const isRegistered = newCheckedProxies.find((checkedProxyData) => checkedProxyData.url === proxyData.url);

                if (isValid && !isRegistered) {
                    newCheckedProxies.push({
                        scanedAt: proxyData.scanedAt,
                        url: proxyData.url,
                        checkedAt: Date.now()
                    });
                }

                const isChunkReady = !(newCheckedProxies.length % 10);
                if (isChunkReady) {
                    this._checkedProxies = newCheckedProxies;
                    this._logger.info('Refresh proxies chunk ready');
                }

                this._logger.info(`Still need to find ${this._proxyLimit - newCheckedProxies.length} proxies`);
                this._logger.info(`Available proxies left ${leftToCheckQty}`);
                if (!leftToCheckQty || this._proxyLimit <= newCheckedProxies.length) {
                    if (newCheckedProxies.length < this._minProxyLimit) {
                        this._onRefresh = false;
                        this._onRescan = false;
                        this._logger.info(`Refresh proxies end with qty ${newCheckedProxies.length} min limit is ${this._minProxyLimit} - run rescan/refresh again`);
                        this.rescan();
                        return;
                    }

                    this._checkedProxies = newCheckedProxies;
                    this._onRefresh = false;
                    ready = true;
                    this._logger.info('Refresh proxies end');
                    this._logger.info(`Active proxies are ${this._checkedProxies.map((proxyData) => proxyData.url)}`);
                    this.inited = true;
                    this._abortCheck();
                }
            });
        });
    }

    rescan() {
        if (this._onRescan || this._onRefresh) {
            return;
        }

        this._onRescan = true;

        this._logger.info('Rescan proxies start');

        this._getAvailableProxies().then((proxies) => {
            this._availableProxies = proxies.map((proxyData) => { return {
                scanedAt: Date.now(),
                url: `http://${proxyData.ipAddress}:${proxyData.port}`
            }});

            this._logger.info('Rescan proxies end');

            this._onRescan = false;

            this.refresh();
        }).catch(() => {
            this._onRescan = false;
        });
    }

    invalidate(invalidProxy) {
        this._checkedProxies = this._checkedProxies.filter((proxy) => { return proxy.url !== invalidProxy.url });
    }

    get proxies() {
        return this._checkedProxies;
    }
};