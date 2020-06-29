const assert = require('assert');
const http = require('http');
const https = require('https');

class AbstractHttpService {
    /**
     * @protected
     * @type {string}
     */
    _host = 'jira.gamelounge.com';

    /**
     * @protected
     * @type {number}
     */
    _port = 443;

    /**
     * @protected
     * @type {string}
     */
    _basePath;

    /**
     * @protected
     * @type {boolean}
     */
    _ssl = true;

    /**
     * @protected
     * @type {string}
     */
    _login;

    /**
     * @protected
     * @type {string}
     */
    _password;

    /**
     * @param {string} host
     * @param {string} basePath
     * @param {string} login
     * @param {string} password
     */
    constructor(host, basePath, login, password) {
        assert(typeof host === 'string' && host.length);

        assert(typeof basePath === 'string' && basePath.length);
        assert(basePath[0] === '/', '1st symbol in the path must be "/".');
        assert(basePath[basePath.length - 1] === '/', 'Last symbol in the path must be "/".');

        assert(typeof login === 'string' && login.length);

        assert(typeof password === 'string');

        this._host = host;
        this._basePath = basePath;
        this._login = login;
        this._password = password;
    }

    /**
     * @param {number} port
     */
    setPort(port) {
        assert(typeof port === 'number' && port > 0 && port < 65536);

        this._port = port;
    }

    /**
     * @param {boolean} flag
     */
    setIsSsl(flag) {
        assert(typeof flag === 'boolean');

        this._ssl = flag;
    }

    /**
     * @protected
     * @param {string} path
     * @param {{}} [options = null]
     * @returns {Promise<{}>}
     */
    _request(path, options= null) {
        return new Promise((resolve, reject) => {
            const authString = Buffer.from(`${this._login}:${this._password}`).toString('base64');

            const requestOptions = {
                host: this._host,
                port: this._port,
                path: `${this._basePath}${path}?${options !== null ? options.toString() : ''}`,
                headers: {
                    Authorization: `Basic ${authString}`
                }
            };

            const scheme = (this._ssl ? https : http);

            scheme.get(requestOptions, function (resp) {
                const body = [];
                resp.on('data', function (data) {
                    body.push(data);
                });
                resp.on('end', function () {
                    const bodyStr = body.join('');
                    try {
                        resolve(JSON.parse(bodyStr));
                    } catch (err) {
                        reject(bodyStr);
                    }
                });
                resp.on('error', function (err) {
                    reject(err);
                });
            });
        });
    }
}

module.exports = {
    AbstractHttpService
};
