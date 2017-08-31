module.exports = class Logger {
    constructor(options) {
        this._isEnableInfo = options.isEnableInfo;
        this._isNewLineWas = true;
    }

    info(message) {
        if (this._isEnableInfo) {
            if (!this._isNewLineWas) {
                console.log('');
            }
            console.log(`${message} at ${(new Date()).toString()}`);
            this._isNewLineWas = true;
        }
    }

    progress(message) {
        if (!message) {
            message = '.';
        }

        if (this._isEnableInfo) {
            process.stdout.write(message);
            this._isNewLineWas = false;
        }
    }
};