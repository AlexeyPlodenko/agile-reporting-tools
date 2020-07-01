const path = require('path');
const assert = require('assert');
const { promises: fs } = require('fs');
const readline = require('readline');
const os = require('os');
const {google} = require('googleapis');

class GoogleCalendarListParameters {
    /**
     * @type {{}}
     */
    #data = {};

    /**
     * @param {Date} value
     */
    set timeMin(value) {
        assert(typeof value === 'object' && value instanceof Date);

        this.#data.timeMin = value.toISOString();
    }

    /**
     * @param {Date} value
     */
    set timeMax(value) {
        assert(typeof value === 'object' && value instanceof Date);

        this.#data.timeMax = value.toISOString();
    }

    getObject() {
        return this.#data;
    }
}

/**
 * Based on the example from https://developers.google.com/calendar/quickstart/nodejs?authuser=1
 */
class GoogleCalendar {
    /**
     * If modifying these scopes, delete token.json.
     *
     * @type {string[]}
     */
    #scopes = [ 'https://www.googleapis.com/auth/calendar.readonly' ];

    /**
     * The file token.json stores the user's access and refresh tokens, and is
     * created automatically when the authorization flow completes for the first
     * time.
     *
     * @type {string}
     */
    #tokenPath = path.resolve(__dirname, '..', '..', 'data', 'google_calendar_token.json');

    /**
     * @type {string}
     */
    #credentialsFilePath = path.resolve(__dirname, '..', '..', 'data', 'google_calendar_credentials.json');

    /**
     * @type {{}}
     */
    #oAuth2Client;

    /**
     * @param {GoogleCalendarListParameters} [params = {}]
     * @returns {Promise<({}|boolean)>}
     */
    listEvents(params= {}) {
        return new Promise(async (resolve, reject) => {
            const authIsPossible = await this._authorize();
            if (!authIsPossible) {
                reject(false);
            }

            const calendar = google.calendar({ version: 'v3', auth: this.#oAuth2Client });

            const defaultParams = {
                calendarId: 'primary',
                singleEvents: true,
                orderBy: 'startTime',
            }
            const options = {...defaultParams, ...params.getObject()};

            calendar.events.list(options, (err, res) => {
                if (err) {
                    reject(err);
                }

                resolve(res);
            });
        });
    }

    /**
     * @returns {Promise<{}>}
     * @private
     */
    async _authorize() {
        // authorizing only once
        if (this.#oAuth2Client) {
            return this.#oAuth2Client;
        }

        let credentialsJSON;
        try {
            credentialsJSON = await fs.readFile(this.#credentialsFilePath);
        } catch (err) {
            return false;
        }
        const credentials = JSON.parse(credentialsJSON);

        const {client_secret, client_id, redirect_uris} = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        let tokenJSON;
        try {
            tokenJSON = await fs.readFile(this.#tokenPath);

        } catch (err) {
            // if not, authorize
            return await this._getAccessToken(oAuth2Client);
        }

        const token = JSON.parse(tokenJSON);
        oAuth2Client.setCredentials(token);
        this.#oAuth2Client = oAuth2Client;

        return oAuth2Client;
    }

    async _getAccessToken(oAuth2Client) {
        return new Promise((resolve, reject) => {
            let authUrl = oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: this.#scopes,
            });

            // https://stackoverflow.com/questions/8500326/how-to-use-nodejs-to-open-default-browser-and-navigate-to-a-specific-url/13419639
            // var url = 'http://localhost';
            // var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
            // require('child_process').exec(start + ' ' + url);

            // @TODO open the browser
            authUrl = authUrl.replace(/.{0,80}/g, '$&\n');
            console.log('Authorize this app by visiting this url:\n'+ authUrl);

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            rl.question('Enter the code from that page here: ', (code) => {
                rl.close();
                oAuth2Client.getToken(code, (err, token) => {
                    if (err) {
                        reject(err);
                    } else {
                        oAuth2Client.setCredentials(token);

                        // Store the token to disk for later program executions
                        fs.writeFile(this.#tokenPath, JSON.stringify(token));

                        this.#oAuth2Client = oAuth2Client;

                        resolve(oAuth2Client);
                    }
                });
            });
        });
    }
}

module.exports = {
    GoogleCalendar,
    GoogleCalendarListParameters
};
