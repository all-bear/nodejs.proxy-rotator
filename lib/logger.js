module.exports = class Logger {
    constructor(options) {
        this._isNewLineWas = true;

        this.options = options;
    }

    info(message) {
        if (this.options.isEnableInfo) {
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

        if (this.options.isEnableInfo) {
            process.stdout.write(message);
            this._isNewLineWas = false;
        }
    }
};