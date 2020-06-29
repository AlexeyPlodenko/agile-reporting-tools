# A tool to collect daily report from JIRA's and BitBucket's API

The script collects following information:
* your issues in progress state in the current sprint;
* your issues, which were done the previous working day;
* issues, that you have cancelled the previous working day;
* issues, that you have created the previous working day;
* any open pull requests, where you are a reviewer;
* any blocked tickets, which are unresolved in the current sprint;
* provides a way to add daily routines to the list, using CLI.

## How to run
1. Install Node.JS locally.

2. Clone this repository.

3. Open your preferred CLI terminal.

4. Navigate into the new directory.

5. Execute this command in the CLI: `
node ./src/daily-report/index.js --format=text --login=my.username --password=123456 --bitbucketHost=bitbucket.example.com --jiraHost=jira.example.com --routine="Check and report AWS load logs." --routine="Check and report AWS error logs."`

## CLI interface
Argument | Value Format | Required | Explanation | Example
--- | --- | :---: | --- | ---
login | (string) | Yes | Your JIRA and BitBucket's login. | --login=my.username
password | (string) | Yes | Your JIRA and BitBucket's password. Leave empty if you do not have it. | --password=123456
bitbucketHost | (string) | Yes | The domain where your BitBucket is installed. | --bitbucketHost=bitbucket.example.com
jiraHost | (string) | Yes | The domain where your JIRA is installed. | --jiraHost=jira.example.com
routine | (string) | No | A list of routines that you can supply to be shown in the list. | --routine="Check and report AWS load logs." --routine="Check and report AWS error logs."
format | (string) | No | By default, the output format is a JSON. You can specify "text", to output the report in the human readable format. | --password=text
