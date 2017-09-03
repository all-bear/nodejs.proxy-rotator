class Checker {
    static get CHECK_BY_URL() { return 'https://www.google.com' };
    static get CHECK_RESPONSE_BY_REGEXP() { return /name\=\"q\"/g };
    static get RECHECK_FREE_SOCKETS_INTERVAL() { return 300 };

    constructor(logger, request, options) {
        this.options = options;

        this._logger = logger;
        this._request = request.request;
        this._checkRequests = {};
    }

    abortCheck() {
        let data;

        for (let id in this._checkRequests) {
            if (!this._checkRequests.hasOwnProperty(id)) {
                continue;
            }

            data = this._checkRequests[id];

            if (!data) {
                continue;
            }

            data.request.abort();
            data.resolve(false);
            clearInterval(data.interval);
        }

        this._checkRequests = {};
    }

    check(proxy, isStoppedCb) {
        return new Promise((resolve) => {
            let interval;
            let requestId;
            let isRequestEnded = false;

            const run = () => {
                requestId = Object.keys(this._checkRequests).length + '_' +  Date.now();

                let request = this._request({
                    url: Checker.CHECK_BY_URL,
                    method: 'GET',
                    proxy
                }, (error, response, body) => {
                    if (isStoppedCb()) {
                        return resolve(false);
                    }

                    if (!error) {
                        this._logger.progress();
                    } else {
                        this._logger.progress('e');
                    }

                    const isValid = !error &&
                        response && response.statusCode === 200 &&
                        Checker.CHECK_RESPONSE_BY_REGEXP.test(body);

                    if (isValid) {
                        this._logger.info(`Successfully refresh proxy ${proxy}`);
                    }

                    isRequestEnded = true;
                    this._checkRequests[requestId] = null;

                    resolve(isValid);
                }).on('error', (ignored) => {
                    if (isStoppedCb()) {
                        return resolve(false);
                    }

                    this._logger.progress('e');

                    isRequestEnded = true;
                    this._checkRequests[requestId] = null;

                    resolve(false);
                });

                this._checkRequests[requestId] = {
                    request,
                    interval,
                    resolve
                };

                setTimeout(() => {
                    if (isRequestEnded || isStoppedCb()) {
                        return resolve(false);
                    }

                    this._logger.progress('t');

                    request.abort();
                    this._checkRequests[requestId] = null;

                    resolve(false);
                }, this.options.proxyCheckTimeLimit);
            };

            interval = setInterval(() => {
                if (this.options.maxConcurrentCheckRequests <= this._currentCheckRequestsQty) {
                    return;
                }

                clearInterval(interval);

                if (isStoppedCb()) {
                    return;
                }

                run();
            }, Checker.RECHECK_FREE_SOCKETS_INTERVAL);
        });
    }

    get _currentCheckRequestsQty() {
        let qty = 0;

        for (let id in this._checkRequests) {
            if (!this._checkRequests.hasOwnProperty(id)) {
                continue;
            }

            if (this._checkRequests[id]) {
                qty++;
            }
        }

        return qty;
    }
}

module.exports = class ProxyProvider {
    constructor(logger, request, options) {
        this.options = options;
        
        this._checkedProxies = [];
        this._availableProxies = [];

        this._logger = logger;
        this._request = request.request;
        this._checker = new Checker(logger, request, options);
        this._checkRequests = {};

        this.inited = false;

        this.rescan();

        setInterval(this.refresh.bind(this), options.refreshInterval);
    }

    get isBusy() {
        return this._onRefresh || this._onRescan;
    }

    getProxyLists() {
        return require('proxy-lists');
    }

    _getAvailableProxies() {
        this._logger.info('Retrieve proxy start');

        return new Promise((resolve) => {
            let proxies = [];

            const request = this.getProxyLists().getProxies({
                protocols: ['http'],
                sourcesBlackList: ['bitproxies', 'kingproxies', 'premproxy']
            });

            request.on('data', (newProxies) => {
                this._logger.progress();

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
        if (this.isBusy) {
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

            this._checker.check(proxyData.url, () => ready).then((isValid) => {
                if (ready) {
                    return;
                }

                this._logger.progress('/');

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

                if (isRegistered) {
                    this._logger.info(`Proxy ${proxyData.url} already registered`);
                }

                const isChunkReady = !(newCheckedProxies.length % 10);
                if (isChunkReady) {
                    this._checkedProxies = newCheckedProxies;
                    this._logger.info('Refresh proxies chunk ready');
                }

                this._logger.info(`Still need to find ${this.options.proxyLimit - newCheckedProxies.length} proxies`);
                this._logger.info(`Available proxies left ${leftToCheckQty}`);
                if (!leftToCheckQty || this.options.proxyLimit <= newCheckedProxies.length) {
                    if (newCheckedProxies.length < this.options.minProxyLimit) {
                        this._onRefresh = false;
                        this._onRescan = false;
                        this._logger.info(`Refresh proxies end with qty ${newCheckedProxies.length} min limit is ${this.options.minProxyLimit} - run rescan/refresh again`);
                        this.rescan();
                        return;
                    }

                    this._checkedProxies = newCheckedProxies;
                    this._onRefresh = false;
                    ready = true;
                    this._logger.info('Refresh proxies end');
                    this._logger.info(`Active proxies are ${this._checkedProxies.map((proxyData) => proxyData.url)}`);
                    this.inited = true;
                    this._checker.abortCheck();
                }
            });
        });
    }

    rescan() {
        if (this.isBusy) {
            return;
        }

        this._onRescan = true;

        this._logger.info('Rescan proxies start');

        this._getAvailableProxies().then((proxies) => {
            const newProxies = proxies.map((proxyData) => { return {
                scanedAt: Date.now(),
                url: `http://${proxyData.ipAddress}:${proxyData.port}`
            }});

            this._logger.info(`Rescan proxies end, found ${newProxies.length} proxies`);

            if (newProxies.length < this.options.proxyLimit) {
                this._logger.info(`Rescan proxies find ${newProxies.length} proxies, which is less then limit ${this.options.proxyLimit} - run rescan again after ${this.options.rescanInterval}`);
                this._onRescan = false;

                this.setTimeout(() => {
                    this.rescan();
                }, this.options.rescanInterval);

                return;
            }

            this._availableProxies = newProxies;
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