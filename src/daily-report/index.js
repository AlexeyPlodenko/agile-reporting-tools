const assert = require('assert');
const args = require('yargs').argv;
const {JiraService} = require('./JiraService');
const {BitBucketService, bitBucket, BitBucketPullRequestOptions} = require('./BitBucketService');

assert(
    'login' in args && typeof args.login === 'string' && args.login.length,
    'Argument "login" is missing or is empty. Example, --login=my.username .'
);
assert(
    'password' in args && typeof args.password === 'string',
    'Argument "password" is missing. Example, --password="123456" .'
);
assert(
    'bitbucketHost' in args && typeof args.bitbucketHost === 'string' && args.bitbucketHost.length,
    'Argument "bitbucketHost" is missing or is empty. Example, --bitbucketHost=bitbucket.example.com .'
);
assert(
    'jiraHost' in args && typeof args.jiraHost === 'string' && args.jiraHost.length,
    'Argument "jiraHost" is missing or is empty. Example, --jiraHost=jira.example.com .'
);

/**
 * @type {string}
 */
const login = args.login;

/**
 * @type {string}
 */
const password = args.password;

/**
 * @type {string}
 */
const bitbucketHost = args.bitbucketHost;

/**
 * @type {string}
 */
const jiraHost = args.jiraHost;

/**
 * @type {string}
 */
const bitbucketBasePath = (args.bitBucketBasePath ? args.bitBucketBasePath : '/bitbucket/rest/api/latest/');

/**
 * @type {string}
 */
const jiraBasePath = (args.jiraBasePath ? args.jiraBasePath : '/jira/rest/api/latest/');

/**
 * @type {string[]}
 */
const dailyRoutines = [
    'Check and report AWS load logs.',
    'Check and report AWS error logs.'
];

/**
 * @param {string} key
 * @returns {Promise<{}>}
 */
async function getIssue(key) {
    const jira = new JiraService(jiraHost, jiraBasePath, login, password);
    return await jira.getIssue(key);

}

/**
 * @returns {Promise<{}[]>}
 */
async function loadMyBlockedIssues() {
    const jira = new JiraService(jiraHost, jiraBasePath, login, password);
    const resp = await jira.searchUsingJQL(
        `project=VST AND resolution=Unresolved AND assignee=${login} AND sprint in openSprints() and sprint not in futureSprints()`
    );

    return resp.issues;

}

async function filterBlockedIssues(issues) {
    const res = [];

    const totalIssue = issues.length;
    for (let i = 0; i < totalIssue; i++) {
        const issue = issues[i];
        if ('issuelinks' in issue.fields && Array.isArray(issue.fields.issuelinks) && issue.fields.issuelinks.length) {
            const links = issue.fields.issuelinks;
            const totalLinks = links.length;
            for (let j = 0; j < totalLinks; j++) {
                const link = links[j];
                if (link.type.inward === 'is blocked by' && 'inwardIssue' in link) {
                    const blockingIssue = await getIssue(link.inwardIssue.key);

                    res.push(`"${issue.key} ${issue.fields.summary}" is blocked by "${link.inwardIssue.key} ${blockingIssue.fields.summary}"`);
                }
            }
        }
    }

    return res;
}

/**
 * @returns {Promise<{}[]>}
 */
async function loadMyIssuesInProgress() {
    const jira = new JiraService(jiraHost, jiraBasePath, login, password);
    const resp = await jira.searchUsingJQL(
        `project=VST AND status="Development in Progress" AND assignee=${login} AND sprint in openSprints() and sprint not in futureSprints()`
    );

    return resp.issues;
}

/**
 * @returns {Promise<{}[]>}
 */
async function loadMyDoneIssues() {
    const jira = new JiraService(jiraHost, jiraBasePath, login, password);
    const resp = await jira.searchUsingJQL(
        `project = VST`
        +` AND resolution in (Done)`
        +` AND assignee=${login}`
        +` AND sprint in openSprints() AND sprint not in futureSprints()`
        +` AND status changed during (-1d, now())`
    );

    return resp.issues;
}

/**
 * @returns {Promise<{}[]>}
 */
async function loadMyCancelledIssues() {
    const jira = new JiraService(jiraHost, jiraBasePath, login, password);
    const resp = await jira.searchUsingJQL(
        `project = VST`
        +` AND resolution in (Cancelled, "Cannot Reproduce")`
        +` AND assignee=${login}`
        +` AND sprint in openSprints() AND sprint not in futureSprints()`
        +` AND status changed during (-1d, now())`
    );

    return resp.issues;
}

/**
 * @returns {Promise<{}[]>}
 */
async function loadIssuesCreatedByMe() {
    const jira = new JiraService(jiraHost, jiraBasePath, login, password);
    const resp = await jira.searchUsingJQL(
        `project = VST`
        +` AND creator in (${login})`
        +` AND created >= -1d`
    );

    return resp.issues;
}

/**
 * @param {string} project
 * @param {string} repository
 * @returns {Promise<{}[]>}
 */
async function loadReviewingPullRequests(project, repository) {
    const pullRequestOptions = new BitBucketPullRequestOptions();
    pullRequestOptions.setDirectionAsOutgoing();
    pullRequestOptions.setStateToOpen();
    pullRequestOptions.withAttributes = false;
    pullRequestOptions.withProperties = false;
    pullRequestOptions.addParticipant(login, bitBucket.pullRequests.role.REVIEWER);

    const jira = new BitBucketService(bitbucketHost, bitbucketBasePath, login, password);
    const resp = await jira.getPullRequests(project, repository,  pullRequestOptions);
    return resp.values;
}

/**
 * @returns {Promise<{}[]>}
 */
async function loadRecentRepositories() {
    const jira = new BitBucketService(bitbucketHost, bitbucketBasePath, login, password);
    const resp = await jira.getRecentRepos();
    return resp.values;
}

(async function() {
    const res = {
        dailyRoutines: dailyRoutines,
        myTicketsInProgress: [],
        myTicketsDoneYesterday: [],
        myTicketsCancelledYesterday: [],
        ticketsCreatedByMeYesterday: [],
        reviewingPRs: [],
        blockedTickets: []
    };

    let issues = await loadMyBlockedIssues();
    res.blockedTickets = await filterBlockedIssues(issues);
    
    issues = await loadMyIssuesInProgress();
    issues.forEach((issue) => {
        res.myTicketsInProgress.push(`${issue.key}: ${issue.fields.summary}`);
    });

    issues = await loadMyDoneIssues();
    issues.forEach((issue) => {
        res.myTicketsDoneYesterday.push(`${issue.key} ${issue.fields.summary}`);
    });

    issues = await loadMyCancelledIssues();
    issues.forEach((issue) => {
        res.myTicketsCancelledYesterday.push(`${issue.key} ${issue.fields.summary}`);
    });

    issues = await loadIssuesCreatedByMe();
    issues.forEach((issue) => {
        res.ticketsCreatedByMeYesterday.push(`${issue.key} ${issue.fields.summary}`);
    });

    const recentRepos = await loadRecentRepositories();

    const total = recentRepos.length;
    for (let i = 0; i < total; i++) {
        const prs = await loadReviewingPullRequests(recentRepos[i].project.key,  recentRepos[i].slug);

        prs.forEach((pr) => {
            res.reviewingPRs.push(`${recentRepos[i].name}: ${pr.title} (${pr.author.user.displayName})`);
        });
    }

    if (args.format === 'text') {
        let text = [];

        if (res.myTicketsDoneYesterday.length) {
            res.myTicketsCancelledYesterday = res.myTicketsCancelledYesterday.map(item => `Cancelled ${item}`);
            res.ticketsCreatedByMeYesterday = res.ticketsCreatedByMeYesterday.map(item => `Created ${item}`);

            const yesterday = [
                ...res.myTicketsDoneYesterday,
                ...res.ticketsCreatedByMeYesterday,
                ...res.myTicketsCancelledYesterday
            ].map(item => `* ${item}\n`);

            yesterday.unshift('Done yesterday:\n');

            text = text.concat(yesterday);
        }

        if (res.dailyRoutines.length || res.myTicketsInProgress.length || res.reviewingPRs) {
            res.reviewingPRs = res.reviewingPRs.map(item => `Reviewing PR ${item}`);

            const today = [
                ...res.dailyRoutines,
                ...res.myTicketsInProgress,
                ...res.reviewingPRs
            ].map(item => `* ${item}\n`);

            today.unshift('Planned today:\n');

            text = text.concat(today);
        }

        if (res.blockedTickets.length) {
            text.push(`Blocked tickets:\n* ${res.blockedTickets.join('\n* ')}\n`);
        }

        console.log(text.join(''));

    } else {
        console.log(res);
    }
})();
