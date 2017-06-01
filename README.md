# CLI tool for the Udacity Reviews API

`urcli` is a Command Line Interface for configuring and running API calls against the Udacity Reviews API. You can find the API documentation here: https://review.udacity.com/api-doc/index.html.

[![npm downloads](https://img.shields.io/npm/dt/urcli.svg?style=flat)](https://www.npmjs.com/package/urcli)
[![npm version](https://img.shields.io/npm/v/urcli.svg?style=flat)](https://www.npmjs.com/package/urcli)
[![npm license](https://img.shields.io/npm/l/urcli.svg?style=flat)](https://www.npmjs.com/package/urcli)

## Requirements
- [Node.js](https://nodejs.org/en/download/) v6.0.0 or higher
- NPM (v3.0.0+ recommended) (this comes with Node.js)

## Quickstart

1. Run `npm install -g urcli`.
2. Get a new token from the API Access link in the [Reviewer Dashboard[(https://review.udacity.com/#!/submissions/dashboard). <img src="http://i.imgur.com/QH7onbk.png" alt="Token retrieval" width="500px">
3. Run `urcli setup`. When prompted, paste in the token you just got and then go through the rest of the setup.
4. Run `urcli assign` proceeded by valid project ids for projects you are certified for. Ex:
    - `urcli assign 145`, places you in the queue for project 145.
    - `urcli assign 134 145 46`, places you in the queues for project 145, 134 and 46.
    - `urcli assign all`, places you in the queue for every project you are certified for.
5. Profit! (literally).


## The `assign` command

[The documentation on the assign command has been moved to its own page.](./ASSIGN.md)

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

To get really specific you can use the options `--from` and `--to`. After the flag you need to write out a valid date in the format, `YYYY-MM-DDThh:mm:ss`, to which to calculate earnings (where `YYYY-MM` is required and `DD-Thh:mm:ss` is optional).

Example: `urcli revenue --from 2016-01 --to 2016-07-26`, will generate an earnings report for the year 2016 up to (but not including) July 26th.

#### `Average Turnaround Time`

Turnaround time for a review is the time period from when the review was assigned up to when you submit it. `Average Turnaround Time` is the average for all reviews that you have done for that particular project. Faster turnaround times are better, and Udacity asks that you attempt to keep this below 2 hours.

## The `token` command

You renew your token using the token command: `urcli token "your-token"`. That also records the tokens age, so that it can warn you if the token is about to expire. But if you use a token that's older than a few days, the expiry warning might be off, so get a new token every time you use this command.

:bulb: Be sure to put the token in quotes since they often include dashes (`-`) which messes up the command.

#### Token expiry warning

The script will show you the age of your token at the top of the prompt if you are running assign without any flags. But even with the `--silent` flag set, it will give you a warning when your token is less than 5 days from expiring.

## The `certs` command

If you gain a new certification after you've started using urcli, you can update the stored list of certifications by running the `certs` command. It will also log a list of your certifications to the terminal, which includes the updated list of your certifications.
:bulb: Certifications are also updated any time you run the `setup` command.

## The `setup` command

You only have to run this command when you first install urcli: `urcli setup`. Once prompted, you should supply it with a brand new token which you can find in the [Reviewer Dashboard](https://review.udacity.com/#!/submissions/dashboard) (see [Quickstart](#quickstart)).

It then goes and gets your certifications from Udacity, using your token. Then it asks you to select which languages you are certified for, since there is no way to get this information from the API. So for instance, if you are certified for US english and brazilian portuguese, you will select both, `en-us` and `pt-br` (you navigate the list using the up and down arrow keys, and select by pressing spacebar). Lastly, it asks you fi you with to use PushBullet for push notifications. If you don't know what this is or don't plan to use it, just say no. Otherwise you will be promted to enter your PushBullet access token, which you can get from your [pushbullet.com account page](https://www.pushbullet.com/#settings/account).

#### The configuration file

The `setup` command creates a configuration folder in your home folder. You find the configuration file here `~/.urcli/config.json`.

## Contributing

Got a question or an idea? Found a bug? Check out our [contributing guidelines](https://github.com/trolster/urcli/blob/master/.github/CONTRIBUTING.md) for ways to offer feedback and contribute.

For very minor changes:

1. Fork this repository
1. Create your branch (`git checkout -b my-new-thing`)
1. Commit your changes (`git commit -am 'commit-message'`)
1. Push to the branch (`git push origin my-new-thing`)
1. Create a new Pull Request

For new features you need to do everything above, but before you write any code you should first read the [contributing guidelines](https://github.com/trolster/urcli/blob/master/.github/CONTRIBUTING.md) and then open an issue explaining what you have in mind. Making sure your feature fits with the direction the project is going can save you a lot of otherwise wasted effort.

## Contributors

Thanks to the people who helped make this project better:

- [Gustavo Bragança](https://github.com/gabraganca)
- [Gilad Gressel](https://github.com/giladgressel)

## License

[MIT](LICENSE) © Mikkel Trolle Larsen.
