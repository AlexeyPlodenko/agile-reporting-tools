const https = require('https');

class GameLoungeJira {
    /**
     * @type {string}
     */
    #host = 'jira.gamelounge.com';

    /**
     * @type {number}
     */
    #port = 443;

    /**
     * @type {string}
     */
    #basePath = '/jira/rest/api/latest/';

    /**
     * @type {string}
     */
    #login;

    /**
     * @type {string}
     */
    #password;

    /**
     * @param {string} login
     * @param {string} password
     */
    constructor(login, password) {
        this.#login = login;
        this.#password = password;
    }

    /**
     * @param {string} jql
     * @returns {Promise<{}>}
     */
    searchUsingJQL(jql) {
        return new Promise((resolve, reject) => {
            const authString = Buffer.from(`${this.#login}:${this.#password}`).toString('base64');

            const requestOptions = {
                host: this.#host,
                port: this.#port,
                path: `${this.#basePath}search?jql=${encodeURIComponent(jql)}`,
                headers: {
                    Authorization: `Basic ${authString}`
                }
            };

            https.get(requestOptions, function (resp) {
                let body = '';
                resp.on('data', function (data) {
                    body += data;
                });
                resp.on('end', function () {
                    resolve(JSON.parse(body));
                })
                resp.on('error', function (err) {
                    reject(err);
                });
            });
        });
    }

    /**
     * @param {string} key
     * @returns {Promise<{}>}
     */
    getIssue(key) {
        return new Promise((resolve, reject) => {
            const authString = Buffer.from(`${this.#login}:${this.#password}`).toString('base64');

            const requestOptions = {
                host: this.#host,
                port: this.#port,
                path: `${this.#basePath}issue/${encodeURIComponent(key)}`,
                headers: {
                    Authorization: `Basic ${authString}`
                }
            };

            https.get(requestOptions, function (resp) {
                let body = '';
                resp.on('data', function (data) {
                    body += data;
                });
                resp.on('end', function () {
                    resolve(JSON.parse(body));
                })
                resp.on('error', function (err) {
                    reject(err);
                });
            });
        });
    }
}

module.exports = {
    GameLoungeJira
};
