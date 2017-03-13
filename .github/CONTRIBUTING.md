# Contributing to urcli
#### This guide is based on the [GitHub guide to Open Source development](https://github.com/github/opensource.guide/blob/gh-pages/CONTRIBUTING.md)

Thanks for checking out the urcli! We've put together the following guidelines to help you figure out where you can best be helpful.

## Table of Contents

0. [Found a bug?](#found-a-bug)
0. [Types of contributions we're looking for](#types-of-contributions-were-looking-for)
0. [Ground rules & expectations](#ground-rules--expectations)
0. [How to contribute](#how-to-contribute)
0. [Style guide](#style--guide)
0. [Setting up your environment](#setting-up-your-environment)
0. [Contribution review process](#contribution-review-process)
0. [Community](#community)

## Found a bug?
Please don't hesitate to open an [issue](https://github.com/trolster/ur-cli/issues). We'll need to know the following:

* Version of Node
* Platform you're running on (macOS, SunOS, Linux, Windows)
* Architecture you're running on (32bit or 64bit and x86 or ARM)
* If you are getting any error messages, please include them as well

## Types of contributions we're looking for
First and foremost, this software is supposed to be easy to set up and use. Your first contribution might be starting a new conversation, or adding to an existing conversation, around making things easier to understand and/or easier to use. You can do so under [Issues](https://github.com/trolster/ur-cli/issues).

There are also many ways you can directly contribute to the cli (in descending order of need):

* Writing tests.
* Add examples to the documentation that help people understand how to use the cli and how to contribute.
* Revise language to be more approachable and friendly.
* Translate docs into other languages.
* Propose a new feature (open an issue to discuss before writing any code!).

Interested in making a contribution? Read on!

## Ground rules & expectations

Before we get started, here are a few things we expect from you (and that you should expect from others):

* Be kind and thoughtful in your conversations around this project. We all come from different backgrounds and projects, which means we likely have different perspectives on "how coding is done." Try to listen to others rather than convince them that your way is correct.
* If you open a pull request, please ensure that your contribution passes all tests. If there are test failures, you will need to address them before we can merge your contribution.

## How to contribute

If you'd like to contribute, start by searching through the [issues](https://github.com/trolster/ur-cli/issues) and [pull requests](https://github.com/trolster/ur-cli/pulls) to see whether someone else has raised a similar idea or question.

If you don't see your idea listed, and you think it fits into the goals of this guide, do one of the following:
* **If your contribution is minor,** such as a small bugfix or a typo fix, open a pull request.
* **If your contribution is major,** such as a new feature, start by opening an issue first. That way, other people can weigh in on the discussion before you do any work.

### How to do a Pull Request

1. Fork this repository
1. Create your branch (`git checkout -b my-new-thing`)
1. Commit your changes (`git commit -am 'commit-message'`)
1. Push to the branch (`git push origin my-new-thing`)
1. Create a new Pull Request

For more, see this guide: https://help.github.com/articles/creating-a-pull-request/.

## Style guide
If you're writing code, see the [Airbnb style guide](https://github.com/airbnb/javascript) to help your style match the rest of the code.

## Setting up your environment

This software runs in [Node.js](https://nodejs.org/en/) and if you have version 6 or higher installed you are good to go.

To get started with Node, check out:
- [Node.js install guide](https://docs.npmjs.com/getting-started/installing-node)
- [The npm package manager guide](https://docs.npmjs.com/getting-started/what-is-npm)

Once you have cloned the repo, you should install all packages from npm: `npm install`.

The project uses [Babel](https://babeljs.io/) for compilation of JavaScript. So when you are running commands directly from /src, you will need to run them using the `babel-node` command. Ex.: `babel-node src/urcli.js money 2017-02`. This is equivalent of running the command `urcli money 2017-02`

## Contribution review process

This repo is currently maintained by [@trolster](https://github.com/trolster). I will likely review your contribution. If you haven't heard from me within 10 days, feel free to bump the thread or @-mention me to review your contribution.

## Community

Discussions about the urcli take place on this repository's [Issues](https://github.com/trolster/ur-cli/issues) and [Pull Requests](https://github.com/trolster/ur-cli/pulls) sections. Anybody is welcome to join these conversations.

Wherever possible, do not take these conversations to private channels, including contacting me (the maintainer) directly. Keeping communication public means everybody can benefit and learn from the conversation.
