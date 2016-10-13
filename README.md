## CLI tool for Udacity Reviews API

`ur-cli` is a Command Line Interface for configuring and running API calls against the Udacity Reviews API. You can find the API documentation here: https://review.udacity.com/api-doc/index.html.

## :arrow_double_down: Installation

#### Requirements
- [Node.js](https://nodejs.org/en/download/) v6.0.0 or higher
- NPM (v3.0.0+ recommended) (this comes with Node.js)

## Usage

1. Clone the project.
2. Set up an apiConfig.json file in the root.
3. Run `node lib/cli.js <someCommand>`.

**The Token**

It's best to set the token using the token command: `node lib/cli.js token <"yourToken">`, as that also sets the tokens age, so that you don't have to. Be sure to put the token in quotes since they often include dashes.

**apiConfig.json**

Before you start creating submission_requests make sure to run `node lib/cli.js certs`. It stores your certs in `apiConfig.json`. It should look something like this when done (you will need to add your language preference manually as shown in the example below):

```json
{
  "tokenAge": 306,
  "certs": {
    "46": {
      "name": "About Me",
      "price": "5.0"
    },
    "134": {
      "name": "Front End Grit: A Developer Mindset",
      "price": "7.0"
    },
    "144": {
      "name": "Design A Game",
      "price": "40.0"
    },
    "145": {
      "name": "Article to Mockup",
      "price": "10.0"
    }
  },
  "language": "en-us",
  "token": "<yourToken>"
}
```

## `assign`

Before you run this command for the first time, make sure to:
1. Set the token using the `token` command.
2. Get your certifications using the `certs` command: `node lib/cli.js certs`.
3. Add your language preference in `apiConfig.json` as in the example above.

Then use the assign command followed by the ids of the projects you wish to queue up for: `node lib/cli.js assign <projectId> [..moreIds]`.

Example command: `node lib/cli.js assign 144 145 46`

## License

[ISC](LICENSE) © Mikkel Trolle Larsen.
