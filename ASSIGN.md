# Documentation for the `assign` command

The `assign` command uses the [Reviews API](https://review.udacity.com/api-doc/index.html) to create or update a submission_request object on Udacity's servers. This object is what is keeping you in project queues. If you get a submission assigned the object is deleted on the server, and the `assign` script takes care of creating a new one.

1. [Basic assign command](#the-basic-assign-command)
    - [Keyboard Shortcuts](#keyboard-shortcuts)
    - [Exiting the Assign Command](#exiting-the-assign-command)
    - [Updating the List of Projects](#updating-the-list-of-projects)
1. [Notifications](#notifications)
    - [Assignment Notifications](#assignment-notifications)
    - [Feedback Notifications](#feedback-notification)
    - [Terminal Information](#terminal-information)
    - [Pushbullet Notifications](#pushbullet-notifications)
1. [Configure the Assign Command](#configure-the-assign-command)
1. [Running Scripts When Opening a Review](#running-scripts-when-opening-a-review)
1. [Running Assign on a Server](#running-assign-on-a-server)
1. [How the Queue System Works](#how-the-queue-system-works)
1. [FAQ](#faq)

## The Basic Assign Command

 Ex.:
- `urcli assign 145`, places you in the queue for project 145.
- `urcli assign 134 145 46`, places you in the queues for project 145, 134 and 46.
- `urcli assign all`, places you in the queue for every project you are certified for.
- `urcli assign`, only works if you have configured a default setup for assign, which it will then start up with.

#### Keyboard Shortcuts

- `0` - Will open the reviews dashboard in your default browser.
- `1` and `2` - Will open an assigned project in a browser. If you have a script assiciated it will run the script instead.
- `o` - Shows you an options menu
- `h` - Shows you helptext
- `r` - Will refresh the UI and check for new assignments.
- `ESC` and `CTRL-C` - Will exit the script. See Exiting the Assign Command below.

#### Exiting the Assign Command

You can exit the script in two ways:
- Press `ESC` to exit without deleting your submission_request object on the server. The submission request will be refreshed so that you will stay in the queues you are in for an hour.
- Press `CTRL-C` to exit _and_ delete the submission_request on the server. This means that you leave all the queues that you are in.

#### Updating the List of Projects

You can update your submission request instead of deleting it and creating a new one. You might want to do that in the case where you just want to change which projects you wish to review without leaving any queues. Simply exit the assign script by pressing `ESC` (this will leave the submission_request object intact on the server) and use the assign command again with the changed arguments.

For instance, if you had previously run the command `urcli assign 145 144` and later wanted to change that to just 145, but _without_ leaving the queue for 145, you exit the script using `ESC` and run the command `urcli assign 145`. This will change the current submission_request object to only queue up for project 145, and will immediately remove you from the queue for project 144.

## Notifications

#### Assignment Notifications

The assign script updates every 30 seconds to see if you've gotten a submission assigned. If you've been assigned a submission it will notify you with a desktop notification:

<img src="http://i.imgur.com/XaKNhaK.png" alt="Desktop notifications on a Mac" width="700px">

#### Feedback Notifications

You can get notified about any new feedbacks from students by using the `--feedbacks` option with the `assign` command. Ex: `urcli assign 145 --feedbacks`.

<img src="http://i.imgur.com/86RG4la.png" alt="Desktop notifications on a Mac" width="700px">

#### Terminal Information

The script updates your queue position (and checks for new feedbacks) every 5 minutes. It outputs all relevant information to the terminal:

<img src="http://i.imgur.com/8h2jjht.png" alt="CLI Prompt information display" width="700px">

#### PushBullet Notifications

You can get notified on other devices using the [PushBullet](https://www.pushbullet.com/) App. You will need to install the app on all of the devices you wish to receive notifications on and then run the `setup` command again, entering in your PushBullet access token when prompted. Then you can run the `assign` command with the `--push` option to get the notifications.

:information_source: You can create an access token on your [pushbullet.com account page](https://www.pushbullet.com/#settings/account).

Ex.: `urcli assign all --push`

Once you get a submission assigned you'll get a notification on all active devices with PushBullet installed.

## Configure the Assign Command

You can configure the Assign command in two ways:
1. Run the command and once the UI has initiated, press `o` to get the options menu. This menu will allow you to change the UI while the command is running, but will not change the default settings for the UI.
2. Run `urcli assign config` and go through the menu options. Changes here will set the default values for the UI as well as allow you to chose a default set of projects to start the assign command with. You will also be able to associate scripts with particular projects, allowing you to run scripts whenever you open a review from the UI. See below for more.

## Running Scripts When Opening a Review

The script will try to open any file you associate with any particular project, whenever you open a review of that type through the UI. But the idea is that you create a shell script, which allows you to run anything you want on the assigned project.

If a script is associated with the project type being opened, the details for the assigned submission will be saved temporarily to the config file. The config file path is, `~/.urcli/config.json`, and you can then find the full submission object in `config.temp`. So in JavaScript/Node.js you might do something like this:

```javascript
    import opn from 'opn';
    import config from 'path/to/homedir/.urcli/config';

    const submission = config.temp
    opn(`https://review.udacity.com/#!/submissions/${submission.id}`);
```

Or in Python:

```python
    import webbrowser
    import json

    with open('/path/to/homedir/.urcli/config.json') as config_file:
        config = json.loads(config_file.read())

    submission = config['temp']
    url = 'https://review.udacity.com/#!/submissions/' + str(submission['id'])
    webbrowser.open(url)
```

To run anything of course you'll first need to create a shell script to run it. You can start by creating a `scripts` directory in your .urcli folder: `mkdir ~/.urcli/scripts`. Then create a shell script that you want to run every time you open a particular project type from the UI. Let's say it's project type "Article to Mockup", which has an id of `145`: `touch ~/.urcli/scripts/145.sh`. You'll want to make sure it's executable: `chmod a+x ~/.urcli/scripts/145.sh`. Now you can add commands in the shell script:

File `145.sh`:
```shell
#!/bin/bash

echo 'Yo from the shell script'
python path/to/script/you/want/to/run.py
node path/to/js/script.js
echo 'Im done yo'
```

Using a shell script with the assign command, allows for a cross-platform way to run anything when you open a review.

## Running Assign on a Server

GBRA!!!

## How the Queue System Works

GBRA!!!

You can find the Reviews API documentation here: https://review.udacity.com/api-doc/index.html

## FAQ