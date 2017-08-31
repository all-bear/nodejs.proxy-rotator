# Proxy Rotator

`Proxy Rotator` - is a Node.js based app, which creates proxy server with rotating ip's over requests. It's used [proxy-lists](https://github.com/chill117/proxy-lists) module to retrieve proxies, then proxies from this lists checked by dummy requests and only working proxies will be used 

## Options

All options should be passed as environment variabled to the app

- `Is Info Log Enabled` - write info log to console, env variable IS_LOG_ENABLED (default true)
- `Rescan Interval` - interval in ms between scanning of new proxies (over [proxy-lists](https://github.com/chill117/proxy-lists)), env variable RESCAN_INTERVAL (default 900000)
- `Refresh Interval` - interval in ms between filtering of available proxies by dummy request, env variable REFRESH_INTERVAL (default 300000)
- `Min Proxy Limit` - minimum proxy limit which should be available after rescan/refresh (if founded proxy qty is less then this number - rescan/refresh will be run again), env variable MIN_PROXY_LIMIT (default 30)
- `Proxy Limit` - limit of used ip's (proxies) for rotating, env variable PROXY_LIMIT (default 100)
- `Proxy Check Time Limit` - when proxies are filtered will be used only proxies which returns result with dummy request in this time limit, env variable PROXY_CHECK_TIME_LIMIT (default 10000)
- `Rotate Every N Request` - change ip every N request, env variable ROTATE_EVERY_N_REQUEST (default 1)
- `Port` - port or proxy server, env variable PORT (default 8080)
- `Max Sockets` - max count of sockets to use (depends on your OS an it's settings), env variable MAX_SOCKETS (default 20)

## Run App as Node.js App

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

## Run App as Builded Docker Container

Clone app:
```bash
git clone https://github.com/all-bear/nodejs.proxy-rotator.git ./proxy
cd proxy
```

Init options:
```bash
cp .env.example .env
```

Edit options - Edit file `.env` to match your requirements

Run:
```bash
docker-compose up
```
please note, that docker-compose.yml has hardcoded port so you are not able to change it in `.env` file

## Run App as Docker Image

Pull image:
```bash
docker pull allbear/proxy-rotator
```

Run image:
```bash
docker run --expose 8080 -p 8080:8080 -d \
-e IS_LOG_ENABLED=1 \
-e RESCAN_INTERVAL=900000 \
-e REFRESH_INTERVAL=300000 \
-e MIN_PROXY_LIMIT=30 \
-e PROXY_LIMIT=100 \
-e PROXY_CHECK_TIME_LIMIT=10000 \
-e ROTATE_EVERY_N_REQUEST=1 \
-e PORT=8080 \
-e MAX_SOCKETS=20 \
allbear/proxy-rotator
```
please note, that you can change port to another, if you want

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
