# Proxy Rotator

`Proxy Rotator` - is a Node.js based app, which creates proxy server with rotating ip's over requests. It's used [proxy-lists](https://github.com/chill117/proxy-lists) module to retrieve proxies, then proxies from this lists checked by dummy requests and only working proxies will be used 

## Options

All options should be passed as environment variables to the app

- `Is Info Log Enabled` - write info log to console, env variable IS_LOG_ENABLED
- `Rescan Interval` - interval in ms between scanning of new proxies (over [proxy-lists](https://github.com/chill117/proxy-lists)), env variable RESCAN_INTERVAL
- `Refresh Interval` - interval in ms between filtering of available proxies by dummy request, env variable REFRESH_INTERVAL
- `Min Proxy Limit` - minimum proxy limit which should be available after rescan/refresh (if founded proxy qty is less then this number - rescan/refresh will be run again), env variable MIN_PROXY_LIMIT
- `Proxy Limit` - limit of used ip's (proxies) for rotating, env variable PROXY_LIMIT
- `Proxy Check Time Limit` - when proxies are filtered will be used only proxies which returns result with dummy request in this time limit, env variable PROXY_CHECK_TIME_LIMIT
- `Rotate Every N Request` - change ip every N request, env variable ROTATE_EVERY_N_REQUEST
- `Port` - port or proxy server, env variable PORT
- `Max Sockets` - max count of sockets to use (depends on your OS an it's settings), env variable MAX_SOCKETS

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
... and another env variables, like in .env.example file
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
