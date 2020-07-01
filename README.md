# A tool to compile a daily report from JIRA, BitBucket and Google Calendar API

The script collects following information:
* your issues in progress state in the current sprint;
* your issues, which were done the previous working day;
* issues, that you have cancelled the previous working day;
* issues, that you have created the previous working day;
* any open pull requests, where you are a reviewer;
* any blocked tickets, which are unresolved in the current sprint;
* events from the Google Calendar, that are planned for today;
* provides a way to add daily routines to the list, using CLI.

## How to run
1. Install Node.JS locally.

2. Clone this repository.

3. Open your preferred CLI terminal.

4. Navigate into the new directory.

5. Execute this command in the CLI: `
node ./src/daily-report/index.js --format=text --login=my.username --password=123456 --bitbucketHost=bitbucket.example.com --jiraHost=jira.example.com --routine="Check and report AWS load logs." --routine="Check and report AWS error logs."`

## To enable Google Calendar
1. Go to the page https://developers.google.com/calendar/quickstart/nodejs and click the "Enable the Google Calendar API" blue button in the middle.

1.1. Choose "Desktop app" from the drop-down list and click CREATE.

1.2. Click "DOWNLOAD CLIENT CONFIGURATION" and save the JSON file under the cloned directory into the /data/ directory.

1.3. Rename the file credentials.json to google_calendar_credentials.json.

2. Run the script as usual. It will show you the link, which you should open in a browser and copy-paste the code from there, back into the CLI terminal and press ENTER.

3. After that today's events from G. Calendar will be included into the report.

NB! For some time authorization would not be required. 

## CLI interface
Argument | Value Format | Required | Explanation | Example
--- | --- | :---: | --- | ---
login | (string) | Yes | Your JIRA and BitBucket's login. | --login=my.username
password | (string) | Yes | Your JIRA and BitBucket's password. Leave empty if you do not have it. | --password=123456
bitbucketHost | (string) | Yes | The domain where your BitBucket is installed. | --bitbucketHost=bitbucket.example.com
jiraHost | (string) | Yes | The domain where your JIRA is installed. | --jiraHost=jira.example.com
routine | (string) | No | A list of routines that you can supply to be shown in the list. | --routine="Check and report AWS load logs." --routine="Check and report AWS error logs."
format | (string) | No | By default, the output format is a JSON. You can specify "text", to output the report in the human readable format. | --format=text

## Text sample output
```
Planned today:
* Check and report AWS load logs.
* Check and report AWS error logs.
* VST-496: Finalize SpinsProcessingService implementation
* VST-495: Reorganize files in the API repository
* Reviewing PR Api: Feature/VST-372 slots list page (Name Surname)
* Reviewing PR Manager: Feature/VST-372 slots list page (Name Surname)
* Event "10:00 Sprint Review"
Blocked tickets:
* "VST-496 Finalize SpinsProcessingService implementation" is blocked by "VST-495 Reorganize files in the API repository"
```

## JSON sample output
```javascript
{
  dailyRoutines: [
    'Check and report AWS load logs.',
    'Check and report AWS error logs.'
  ],
  myTicketsInProgress: [
    'VST-496: Finalize SpinsProcessingService implementation',
    'VST-495: Reorganize files in the API repository'
  ],
  myTicketsDoneYesterday: [],
  myTicketsCancelledYesterday: [],
  ticketsCreatedByMeYesterday: [],
  reviewingPRs: [
    'Api: Feature/VST-372 slots list page (Name Surname)',
    'Manager: Feature/VST-372 slots list page (Name Surname)'
  ],
  blockedTickets: [
    '"VST-496 Finalize SpinsProcessingService implementation" is blocked by "VST-495 Reorganize files in the API repository"'
  ],
  dailyMeetings: [
    'Event "10:00 Sprint Review [Slot Tracker]"'
  ]
}
```
