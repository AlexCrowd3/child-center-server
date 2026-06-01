const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.ensureLogDir();
    }

    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getLogFile(type) {
        const date = new Date().toISOString().slice(0, 10);
        return path.join(this.logDir, `${type}-${date}.log`);
    }

    writeToFile(type, message) {
        const logFile = this.getLogFile(type);
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        
        fs.appendFileSync(logFile, logMessage);
    }

    info(message) {
        console.log(`ℹ️ ${message}`);
        this.writeToFile('info', message);
    }

    success(message) {
        console.log(`✅ ${message}`);
        this.writeToFile('success', message);
    }

    warn(message) {
        console.log(`⚠️ ${message}`);
        this.writeToFile('warn', message);
    }

    error(message, error) {
        console.error(`❌ ${message}`);
        if (error) {
            console.error(error);
            this.writeToFile('error', `${message} - ${error.message || error}`);
        } else {
            this.writeToFile('error', message);
        }
    }

    request(req, res, next) {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            const log = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
            
            if (res.statusCode >= 500) {
                this.error(log);
            } else if (res.statusCode >= 400) {
                this.warn(log);
            } else {
                this.info(log);
            }
        });
        next();
    }
}

module.exports = new Logger();