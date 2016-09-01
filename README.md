## CLI tool for Udacity Reviews API

`ur-cli` is a Command Line Interface for configuring and running API calls against the Udacity Reviews API. You can find the API documentation here: https://review.udacity.com/api-doc/index.html.

## :arrow_double_down: Installation

#### Requirements
- [Node.js](https://nodejs.org/en/download/) v6.0.0 or higher
- NPM (v3.0.0+ recommended) (this comes with Node.js)

## Usage

1. Clone the project.
2. Place a config file in the root.
3. Run `node lib/cli.js <someCommand>`.

**apiConfig.json**

It needs to have the following information:

```json
{
  "token": "yourToken",
  "certified": [23, 34, 145],
  "default_projects": [34, 23],
  "language": "en-us"
}
```

`default_projects` are used when you run the `create` command without any project ids as arguments: `node lib/cli.js create`.
