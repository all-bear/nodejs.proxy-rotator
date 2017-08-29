module.exports = class Logger {
    constructor(options) {
        this._isEnableInfo = options.isEnableInfo;
    }

    info(message) {
        if (this._isEnableInfo) {
            console.log(`${message} at ${(new Date()).toString()}`);
        }
    }
};