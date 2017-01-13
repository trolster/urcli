## CLI tool for Udacity Reviews API

`urcli` is a Command Line Interface for configuring and running API calls against the Udacity Reviews API. You can find the API documentation here: https://review.udacity.com/api-doc/index.html.

## Installation and Usage

1. Run `npm install -g urcli`
1. Get a new token from the API Access link in the reviewer Dashboard
1. Run `urcli setup "your-token"` and follow the instructions
1. Run `urcli assign` proceeded by valid project ids for projects you are certified for. Ex:
    - `urcli assign 145`, creates a submission_request with project 145.
    - `urcli assign 134 145 46`, creates a submission_request with project 145, 134 and 46.
    - `urcli assign all`, creates a submission request with all projects you are certified for.
1. Profit! (literally)

#### Requirements
- [Node.js](https://nodejs.org/en/download/) v6.0.0 or higher
- NPM (v3.0.0+ recommended) (this comes with Node.js)

## Tokens

It's best to renew the token using the token command: `urcli token "your-token"`. That also sets the tokens age, so that you don't have to. But if you use a token that's older than a few days, the expiry warning might be off, so get a new one every time. Be sure to put the token in quotes since they often include dashes.

## License

[MIT](LICENSE) © Mikkel Trolle Larsen.
