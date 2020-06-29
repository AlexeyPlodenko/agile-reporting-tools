const assert = require('assert');
const querystring = require('querystring');
const {AbstractHttpService} = require('./AbstractHttpService');

/**
 * @type {{}}
 */
const bitBucket = {
    pullRequests: {
        direction: {
            INCOMING: 'INCOMING',
            OUTGOING: 'OUTGOING',
        },
        state: {
            OPEN: 'OPEN',
            DECLINED: 'DECLINED',
            MERGED: 'MERGED',
            ALL: 'ALL',
        },
        order: {
            NEWEST: 'NEWEST',
            OLDEST: 'OLDEST',
        },
        role: {
            AUTHOR: 'AUTHOR',
            REVIEWER: 'REVIEWER',
            PARTICIPANT: 'PARTICIPANT',
        }
    }
};

class BitBucketPullRequestOptions {
    /**
     * @type {string}
     */
    #direction;

    /**
     * @type {string}
     */
    #at;

    /**
     * @type {string}
     */
    #state;

    /**
     * @type {string}
     */
    #order;

    /**
     * @type {boolean}
     */
    #withAttributes;

    /**
     * @type {boolean}
     */
    #withProperties;

    /**
     * @type {{username: string, role: (string|null), approved: (boolean|null)}[]}
     */
    #participants = [];

    /**
     * @param {string} value
     */
    set direction(value) {
        assert(value in bitBucket.pullRequests.direction);
        this.#direction = value;
    }

    setDirectionAsIncoming() {
        this.#direction = bitBucket.pullRequests.direction.INCOMING;
    }

    setDirectionAsOutgoing() {
        this.#direction = bitBucket.pullRequests.direction.OUTGOING;
    }

    /**
     * @param {string} value
     */
    set at(value) {
        assert(typeof value === 'string' && value.length);
        this.#at = value;
    }

    /**
     * @param {string} value
     */
    set state(value) {
        assert(value in bitBucket.pullRequests.state);
        this.#state = value;
    }

    setStateToAll() {
        this.#state = bitBucket.pullRequests.state.ALL;
    }

    setStateToDeclined() {
        this.#state = bitBucket.pullRequests.state.DECLINED;
    }

    setStateToMerged() {
        this.#state = bitBucket.pullRequests.state.MERGED;
    }

    setStateToOpen() {
        this.#state = bitBucket.pullRequests.state.OPEN;
    }

    /**
     * @param {string} value
     */
    set order(value) {
        assert(value in bitBucket.pullRequests.order);
        this.#order = value;
    }

    setOrderAsNewest() {
        this.#order = bitBucket.pullRequests.order.NEWEST;
    }

    setOrderAsOldest() {
        this.#order = bitBucket.pullRequests.order.OLDEST;
    }

    /**
     * @param {boolean} value
     */
    set withAttributes(value) {
        assert(typeof value === 'boolean');
        this.#withAttributes = value;
    }

    /**
     * @param {boolean} value
     */
    set withProperties(value) {
        assert(typeof value === 'boolean');
        this.#withProperties = value;
    }

    /**
     * @param {string} username
     * @param {(string|null)} [role = null]
     * @param {(boolean|null)} [approved = null]
     */
    addParticipant(username, role = null, approved = null) {
        assert(typeof username === 'string' && username.length);
        assert(role === null || role in bitBucket.pullRequests.role);
        assert(approved === null || typeof approved === 'boolean');

        this.#participants.push({
            username: username,
            role: role,
            approved: approved
        });
    }

    /**
     * @returns {string}
     */
    toString() {
        const res = {};

        if (this.#direction) {
            res.direction = this.#direction;
        }
        if (this.#at) {
            res.at = this.#at;
        }
        if (this.#state) {
            res.state = this.#state;
        }
        if (this.#order) {
            res.order = this.#order;
        }
        if (this.#withAttributes !== undefined) {
            res.withAttributes = this.#withAttributes ? 'true' : 'false';
        }
        if (this.#withProperties !== undefined) {
            res.withProperties = this.#withProperties ? 'true' : 'false';
        }

        const participants = this.#participants;
        if (participants.length) {
            const total = participants.length;
            for (let i = 0; i < total; i++) {
                const j = i + 1;
                res[`username.${j}`] = participants[i].username;
                if (participants[i].role !== null) {
                    res[`role.${j}`] = participants[i].role;
                }
                if (participants[i].approved !== null) {
                    res[`approved.${j}`] = participants[i].approved ? 'true' : 'false';
                }
            }
        }

        return querystring.stringify(res);
    }
}

class BitBucketService extends AbstractHttpService {
    /**
     * @param {string} project
     * @param {string} repo
     * @param {BitBucketPullRequestOptions} options
     * @returns {Promise<string>}
     */
    getPullRequests(project, repo, options) {
        assert(typeof project === 'string' && project.length);
        assert(typeof repo === 'string' && repo.length);
        assert(typeof options === 'object' && options instanceof BitBucketPullRequestOptions);

        return this._request(`/projects/${project}/repos/${repo}/pull-requests/`, options);
    }

    /**
     * @returns {Promise<string>}
     */
    getRecentRepos() {
        return this._request(`/profile/recent/repos`);
    }
}

module.exports = {
    BitBucketService,
    bitBucket,
    BitBucketPullRequestOptions
};
