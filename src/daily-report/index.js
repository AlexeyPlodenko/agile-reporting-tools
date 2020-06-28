const {GameLoungeJira} = require('./GameLoungeJira');
const {GameLoungeBitBucket, bitBucket, BitBucketPullRequestOptions} = require('./GameLoungeBitBucket');

/**
 * @type {string}
 */
const login = '';

/**
 * @type {string}
 */
const password = '';

/**
 * @type {string[]}
 */
const dailyRoutines = [
    'Check and report AWS load logs.',
    'Check and report AWS error logs.'
];

/**
 * @param {string} key
 * @returns {Promise<{}[]>}
 */
async function getIssue(key) {
    const jira = new GameLoungeJira(login, password);
    const resp = await jira.getIssue(key);

    return resp;

}

/**
 * @returns {Promise<{}[]>}
 */
async function loadMyBlockedIssues() {
    const jira = new GameLoungeJira(login, password);
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
    const jira = new GameLoungeJira(login, password);
    const resp = await jira.searchUsingJQL(
        `project=VST AND status="Development in Progress" AND assignee=${login} AND sprint in openSprints() and sprint not in futureSprints()`
    );

    return resp.issues;
}

/**
 * @returns {Promise<{}[]>}
 */
async function loadMyDoneIssues() {
    const jira = new GameLoungeJira(login, password);
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
    const jira = new GameLoungeJira(login, password);
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
    const jira = new GameLoungeJira(login, password);
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

    const jira = new GameLoungeBitBucket(login, password);
    const resp = await jira.getPullRequests(project, repository,  pullRequestOptions);
    return resp.values;
}

/**
 * @returns {Promise<{}[]>}
 */
async function loadRecentRepositories() {
    const jira = new GameLoungeBitBucket(login, password);
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

    console.log(res);
})();
