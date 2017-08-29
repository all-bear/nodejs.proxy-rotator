const ProxyLists = require('proxy-lists');

module.exports = class ProxyProvider {
    static get CHECK_BY_URL() { return 'https://www.google.com' };
    static get CHECK_RESPONSE_BY_REGEXP() { return /name\=\"q\"/g };

    constructor(logger, request, options) {
        this._checkedProxies = [];
        this._availableProxies = [];
        this._proxyLimit = options.proxyLimit;
        this._logger = logger;
        this._checkRequestsCount = 0;
        this._maxConcurentCheckRequests = options.maxConcurentCheckRequests;
        this._request = request.request;
        this.inited = false;

        this.rescan();

        setInterval(this.rescan.bind(this), options.rescanInterval);
        setInterval(this.refresh.bind(this), options.refreshInterval);
    }

    _check(proxy) {
        return new Promise((resolve) => {
            this._request({
                    url: ProxyProvider.CHECK_BY_URL,
                    method: 'GET',
                    proxy
                }, (error, response, body) => {
                    this._checkRequestsCount--;

                    const isValid = !error && response && response.statusCode === 200 && ProxyProvider.CHECK_RESPONSE_BY_REGEXP.test(body);

                    resolve(isValid);
                }).on('error', (ignored) => {
                    this._checkRequestsCount--;

                    resolve(false);
                });
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

            request.on('error', () => {
                // NOP
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

                if (!isValid) {
                    return;
                }

                newCheckedProxies.push({
                    scanedAt: proxyData.scanedAt,
                    url: proxyData.url,
                    checkedAt: Date.now()
                });

                const isChunkReady = !(newCheckedProxies.length % 10);
                if (isChunkReady) {
                    this._checkedProxies = newCheckedProxies;
                    this._logger.info('Refresh proxies chunk ready');
                }

                if (!leftToCheckQty || this._proxyLimit <= newCheckedProxies.length) {
                    this._checkedProxies = newCheckedProxies;
                    this._onRefresh = false;
                    ready = true;
                    this._logger.info('Refresh proxies end');
                    this.inited = true;
                }
            });
        });
    }

    rescan() {
        if (this._onRescan) {
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