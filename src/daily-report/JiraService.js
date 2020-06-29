const http = require('http');
const https = require('https');
const {AbstractHttpService} = require('./AbstractHttpService');

class JiraService extends AbstractHttpService {
    /**
     * @TODO move common code to the _query() method.
     * @param {string} jql
     * @returns {Promise<{}>}
     */
    searchUsingJQL(jql) {
        return new Promise((resolve, reject) => {
            const authString = Buffer.from(`${this._login}:${this._password}`).toString('base64');

            const requestOptions = {
                host: this._host,
                port: this._port,
                path: `${this._basePath}search?jql=${encodeURIComponent(jql)}`,
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

    /**
     * @TODO move common code to the _query() method.
     * @param {string} key
     * @returns {Promise<{}>}
     */
    getIssue(key) {
        return new Promise((resolve, reject) => {
            const authString = Buffer.from(`${this._login}:${this._password}`).toString('base64');

            const requestOptions = {
                host: this._host,
                port: this._port,
                path: `${this._basePath}issue/${encodeURIComponent(key)}`,
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
    JiraService
};
