## CLI tool for Udacity Reviews API

`ur-cli` is a Command Line Interface for configuring and running API calls against the Udacity Reviews API. You can find the API documentation here: https://review.udacity.com/api-doc/index.html.

## :arrow_double_down: Installation

#### Requirements
- [Node.js](https://nodejs.org/en/download/) v6.0.0 or higher
- NPM (v3.0.0+ recommended) (this comes with Node.js)

## Usage

1. Clone the project.
2. Place a apiConfig.json file in the root.
3. Run `node lib/cli.js <someCommand>`.

It's best to set the token using the token command: `node lib/cli.js token <yourToken>`, as that also sets the tokens age, so that you don't have to.

**apiConfig.json**

It should look something like this:

```json
{
  "tokenAge": 277,
  "certs": {
    "46": "About Me",
    "134": "Front End Grit: A Developer Mindset",
    "144": "Design A Game",
    "145": "Article to Mockup"
  },
  "language": "en-us",
  "token": "yourToken"
}
```

## `assign`

To get started using the assing command,
1. make sure to set the token using the token command.
2. Then get your certifications using the certs command: `node lib/cli.js certs`.
3. Finally use the assign command followed by the ids of the projects you wish to queue up for: `node lib/cli.js assign <projectId> [..moreIds]`.

## License

[ISC](LICENSE) © Mikkel Trolle Larsen.
