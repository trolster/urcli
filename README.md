# CLI tool for Udacity Reviews API

`urcli` is a Command Line Interface for configuring and running API calls against the Udacity Reviews API. You can find the API documentation here: https://review.udacity.com/api-doc/index.html.

## Requirements
- [Node.js](https://nodejs.org/en/download/) v6.0.0 or higher
- NPM (v3.0.0+ recommended) (this comes with Node.js)

## Quickstart

1. Run `npm install -g urcli`.
1. Get a new token from the API Access link in the reviewer Dashboard.
![API Access](README/ss_api_access.png)
1. Run `urcli setup "your-token"` and follow the instructions.
1. Run `urcli assign` proceeded by valid project ids for projects you are certified for. Ex:
    - `urcli assign 145`, creates a submission_request with project 145.
    - `urcli assign 134 145 46`, creates a submission_request with project 145, 134 and 46.
    - `urcli assign all`, creates a submission request with all projects you are certified for.
1. Profit! (literally).

## Tokens

It's best to renew the token using the token command: `urcli token "your-token"`. That also sets the tokens age, so that you don't have to. But if you use a token that's older than a few days, the expiry warning might be off, so get a new one every time. Be sure to put the token in quotes since they often include dashes.

## Money

The `money` command creates an earnings report for the interval you specify:

- `urcli money` - Returns two reports; one for your total earnings and one for the current month you are in.
- `urcli money 1` - (You can use month numbers as intervals). This command will generate a report for the whole month of January of the current year. Tip: to get a month from a previous year, simply use the format `YYYY-MM`. Ex.: `urcli money 2015-11`.
- `urcli money today` - Generates an earnings report for today.
- `urcli money yesterday` - Generates an earnings report for yesterday.

To get really specific you can use the options `--from` and `--to`. After the flag you need to write out a valid date in the format, `YYYY-MM-DDTHH:MM:SS`, to which to calculate earnings (where `YYYY-MM` is required and `DD-THH:MM:SS` is optional).

Example: `urcli money --from 2016-01 --to 2016-07-26`, will generate an earnings report for the year 2016 up to (but not including) July 26th.

## Assign

The `assign` command creates or updates a submission_request object on Udacity's servers. This object is what is keeping you in the queue. If you get a submission assigned the object is deleted on the server, and the `assign` script takes care of creating a new one.

- `urcli assign all` - Will ask for all the types of projects that you are certified for.
- `urcli assign 145` - Will ask for projects of the type that has ID 145.
- `urcli assign 145 144 134` - Will ask for those three types of projects.

#### Exiting Assign

You can exit the script in two ways:
- Press `ESC` to exit without deleting your submission_request object on the server. You will stay in the queues you are in for as long as the submission_request persists (up to an hour).
- Press `CTRL-C` to exit _and_ delete the submission_request on the server. This means that you leave all the queues that you are in.

#### Updating Assign

You can update your submission request instead of deleting it and creating a new one. You might want to do that in the case where you just want to change which projects you wish to review without leaving any queues. Simply exit the assign script by pressing `ESC` (this will leave the submission_request object intact on the server) and use the assign command again with the changed arguments.

For instance, if you had run the command `urcli assign 145 144` and later wanted to change that to just 145, but _without_ leaving the queue for 145, you just exit the script using `ESC` and run the command `urcli assign 145`. This will change the current submission_request object to only include project 145,

#### Notifications

The assign script updates every 30 seconds to see if you've gotten a submission assigned. If you've been assigned a submission it will notify you vith a desktop notification:

![Desktop Notifications](README/ss_desktop_notifications.png)

You will also get a notification when you get new student feedback:

![Desktop Notifications](README/ss_feedbacks_notifications.png)

The script also updates your queue position and checks for new feedbacks every 5 minutes. It outputs all relevant information to the terminal:

![CLI Prompt](README/ss_cli_prompt.png)

## License

[MIT](LICENSE) © Mikkel Trolle Larsen.
