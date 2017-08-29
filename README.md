# Proxy Rotator

`Proxy Rotator` - is a Node.js based app, which creates proxy server with rotating ip's over requests. It's used [proxy-lists](https://github.com/chill117/proxy-lists) module to retrieve proxies, then proxies from this lists checked by dummy requests and only working proxies will be used 

## Options

All options should be passed as environment variabled to the app

- `Is Info Log Enabled` - write info log to console, env variable IS_LOG_ENABLED (default true)
- `Rescan Interval` - interval in ms between scanning of new proxies (over [proxy-lists](https://github.com/chill117/proxy-lists)), env variable RESCAN_INTERVAL (default 120000)
- `Refresh Interval` - interval in ms between filtering of available proxies by dummy request, env variable REFRESH_INTERVAL (default 60000)
- `Proxy Limit` - limit of used ip's (proxies) for rotating, env variable PROXY_LIMIT (default 10)
- `Port` - port or proxy server, env variable PORT (default 8080)
- `Max Sockets` - max count of sockets to use (depends on your OS an it's settings), env variable MAX_SOCKETS (default 20)

## Run App As Node.js App

Clone app:
```bash
git clone https://github.com/all-bear/nodejs.proxy-rotator.git ./proxy
cd proxy
```

Init app:
```bash
npm install
```

Init options:
```bash
cp .env.example .env
```

Edit options - Edit file `.env` to match your requirements

Run server:
```bash
npm start
```

## Usage
You can use it like simple proxy, for example with [request](https://www.npmjs.com/package/request):
```javascript
request.get('http://google.com', {'proxy':'http://locahost:8080/'}, function (err, res, body) {
	//
})
```
please note, than https request will not work for now (It's actually a bug for now)

Or you can use it like an api, and request some site over proxy by such kind of url:
```url
http://localhost:8080/?url=https://google.com
```