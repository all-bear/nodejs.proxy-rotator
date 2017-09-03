require('dotenv').config();

const Logger = require('./lib/logger');
const ProxyProvider = require('./lib/proxy-provider');
const ProxyRotator = require('./lib/proxy-rotator');
const Request = require('./lib/request');
const Server = require('./lib/server');

const options = {
  isEnableInfo: process.env.IS_LOG_ENABLED || true,
  refreshInterval: parseInt(process.env.REFRESH_INTERVAL) || 60 * 1000,
  rescanInterval: parseInt(process.env.RESCAN_INTERVAL) || 2 * 60 * 1000,
  minProxyLimit: parseInt(process.env.MIN_PROXY_LIMIT) || 3,
  proxyLimit: parseInt(process.env.PROXY_LIMIT) || 10,
  proxyCheckTimeLimit: parseInt(process.env.PROXY_CHECK_TIME_LIMIT) || 4000,
  port: process.env.PORT || 8080,
  maxSockets: parseInt(process.env.MAX_SOCKETS) || 20,
  rotateEveryNRequest: parseInt(process.env.ROTATE_EVERY_N_REQUEST) || 1,
  maxConcurrentCheckRequests: parseInt(process.env.MAX_CONCURRENT_CHECK_REQUESTS) || 30
};

const logger = new Logger({isEnableInfo: true});

process.on('uncaughtException', (e) => {
  if (e.code === 'ECONNRESET') {
    // https://github.com/request/request/issues/2161
    // NOP
  } else if (e.code = 'EMFILE') {
    // TODO sometimes on proxy refresh
    // NOP
  } else if (/AssertionError:/g.test(e.toString())) {
    // TODO sometimes on proxy retrieve
    // NOP
  } else {
    // TODO error thrown from here will not be handled, even if handler is setted, like .on('error', ...) for request
    throw e;
  }
});

const request = new Request(options);

const proxyProvider = new ProxyProvider(logger, request, options);

const proxyRotator = new ProxyRotator(logger, proxyProvider, options);

const server = new Server(logger, request, proxyProvider, proxyRotator, options);