# CLI tool for the Udacity Reviews API

[![npm downloads](https://img.shields.io/npm/dt/urcli.svg?style=flat)](https://www.npmjs.com/package/urcli)
[![npm version](https://img.shields.io/npm/v/urcli.svg?style=flat)](https://www.npmjs.com/package/urcli)
[![npm license](https://img.shields.io/npm/l/urcli.svg?style=flat)](https://www.npmjs.com/package/urcli)

`urcli` is a Command Line Interface for configuring and running API calls against the Udacity Reviews API. You can find the API documentation here: https://review.udacity.com/api-doc/index.html.

## Requirements
- [Node.js](https://nodejs.org/en/download/) v6.0.0 or higher
- NPM (v3.0.0+ recommended) (this comes with Node.js)

## Quickstart

1. Run `npm install -g urcli`.
1. Get a new token from the API Access link in the [Reviewer Dashboard](https://review.udacity.com/#!/submissions/dashboard).

    <img src="http://i.imgur.com/QH7onbk.png" alt="Token retrieval" width="500px">

1. Run `urcli setup "your-token"`. You will be asked to type in the languages you are certified for, since there is no way to get this information from the API. So for instance, if you are certified for US english and brazilian portuguese, you will enter, `en-us pt-br`. If it's just english you simply enter, `en-us`.
1. Run `urcli assign` proceeded by valid project ids for projects you are certified for. Ex:
    - `urcli assign 145`, places you in the queue for project 145.
    - `urcli assign 134 145 46`, places you in the queues for project 145, 134 and 46.
    - `urcli assign all`, places you in the queue for every project you are certified for.
1. Profit! (literally).

:bulb: When using the `setup` command, be sure to put the token in quotes, `urcli setup "your-token"`, since tokens often include dashes (`-`) which messes things up.

## The `assign` command

The `assign` command creates or updates a submission_request object on Udacity's servers. This object is what is keeping you in project queues. If you get a submission assigned the object is deleted on the server, and the `assign` script takes care of creating a new one. Ex.:
- `urcli assign 145`, places you in the queue for project 145.
- `urcli assign 134 145 46`, places you in the queues for project 145, 134 and 46.
- `urcli assign all`, places you in the queue for every project you are certified for.

#### Exiting `assign`

You can exit the script in two ways:
- Press `ESC` to exit without deleting your submission_request object on the server. The submission request will be refreshed so that you will stay in the queues you are in for an hour.
- Press `CTRL-C` to exit _and_ delete the submission_request on the server. This means that you leave all the queues that you are in.

#### Updating `assign`

You can update your submission request instead of deleting it and creating a new one. You might want to do that in the case where you just want to change which projects you wish to review without leaving any queues. Simply exit the assign script by pressing `ESC` (this will leave the submission_request object intact on the server) and use the assign command again with the changed arguments.

For instance, if you had previously run the command `urcli assign 145 144` and later wanted to change that to just 145, but _without_ leaving the queue for 145, you exit the script using `ESC` and run the command `urcli assign 145`. This will change the current submission_request object to only queue up for project 145, and will immediately remove you from the queue for project 144.

#### Notifications

The assign script updates every 30 seconds to see if you've gotten a submission assigned. If you've been assigned a submission it will notify you with a desktop notification:

<img src="http://i.imgur.com/XaKNhaK.png" alt="Desktop notifications on a Mac" width="700px">

You will also get a notification when you get new feedback from students:

<img src="http://i.imgur.com/86RG4la.png" alt="Desktop notifications on a Mac" width="700px">

The script also updates your queue position and checks for new feedbacks every 5 minutes. It outputs all relevant information to the terminal:

<img src="http://i.imgur.com/8h2jjht.png" alt="CLI Prompt information display" width="700px">

#### PushBullet Notifications

You can get notified on other devices using the [PushBullet](https://www.pushbullet.com/) App. You will need to install the app on all of the devices you wish to receive notifications on and then run the `assign` command with the `--push <accessToken>` option.

:information_source: You can create an access token on your [pushbullet.com account page](https://www.pushbullet.com/#settings/account).

Ex.: `urcli assign all --push "o.ZxY9mPKB7aWIjiAI2CPKvnMMMqBPxHT8"`

Once you get a submission assigned you'll get a notification on all active devices with PushBullet installed.

## The `revenue` command

The `revenue` command creates an earnings report for the interval you specify:

- `urcli revenue` - Returns two reports; one for your total earnings and one for the earnings of the current month you are in.
- `urcli revenue 2015-11-24` - Generates an earnings report for that date.
- `urcli revenue 2016-05` - Generates an earnings report for that month.
- `urcli revenue 1` - (You can use the month numbers, 1-12, as periods). This command will generate a report for the whole month of January of the current year. Tip: If you input a future month it will generate a report for the same month of the previous year.
- `urcli revenue today` - Generates an earnings report for today.
- `urcli revenue yesterday` - Generates an earnings report for yesterday.

#### About timezones

**Udacity uses [UTC](https://en.wikipedia.org/wiki/Coordinated_Universal_Time) when registering when a review was completed. Therefore all periods that you request are converted to [UTC](https://en.wikipedia.org/wiki/Coordinated_Universal_Time). Otherwise the revenue displayed would not correspond to what you actually get paid. So if you use the command `urcli revenue today` it's a UTC day and it has probably started at a very different time than when your day started.**

#### Revenue options

To get really specific you can use the options `--from` and `--to`. After the flag you need to write out a valid date in the format, `YYYY-MM-DDTHH:MM:SS`, to which to calculate earnings (where `YYYY-MM` is required and `DD-THH:MM:SS` is optional).

Example: `urcli revenue --from 2016-01 --to 2016-07-26`, will generate an earnings report for the year 2016 up to (but not including) July 26th.

#### `Average Turnaround Time`

Turnaround time for a review is the time period from when the review was assigned up to when you submit it. `Average Turnaround Time` is the average for all reviews that you have done for that particular project. Faster turnaround times are better, and Udacity asks that you attempt to keep this below 2 hours.

## The `token` command

You renew your token using the token command: `urcli token "your-token"`. That also records the tokens age, so that it can warn you if the token is about to expire. But if you use a token that's older than a few days, the expiry warning might be off, so get a new token every time you use this command.

:bulb: Be sure to put the token in quotes since they often include dashes (`-`) which messes up the command.

#### Token expiry warning

The script always shows you the age of your token at the top of the prompt. It will give you a warning when your token is less than 5 days from expiring. The text goes from green to red, so it's fairly obvious.

## The `certs` command

If you gain a new certification after you've started using urcli, you can update the stored list of certifications by running the `certs` command. It will also log the contents of your current configurations file to the terminal, which includes the updated list of your certifications.
Tip: Certifications are also updated any time you run the `setup` command.

## The `setup` command

You only have to run this command when you first install urcli: `urcli setup "your-token"`. You have to supply it with a new token which you can find in the [Reviewer Dashboard](https://review.udacity.com/#!/submissions/dashboard) (see [Quickstart](#quickstart)).

It gets your certifications from the API and asks you to record which languages you are certified for, since there is no way to get this information from the API. So for instance, if you are certified for US english and brazilian portuguese, you will enter, `en-us pt-br`. If it's just english you simply enter, `en-us`. Once you've run this command you are ready to start using the cli.

:bulb: Be sure to put the token in quotes since they often include dashes (`-`) which mess up the command.

#### The configuration file

The `setup` command creates a configuration file which is stored in your home folder. You find it here `~/.urcli_config`.

## Contributing

Got a question or an idea? Found a bug? Check out our [contributing guidelines](https://github.com/trolster/ur-cli/blob/master/CONTRIBUTING.md) for ways to offer feedback and contribute.

## License

[MIT](LICENSE) © Mikkel Trolle Larsen.
