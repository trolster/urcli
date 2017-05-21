// node modules
import inquirer from 'inquirer';
import readline from 'readline';
import chalk from 'chalk';
import {config} from '../../utils';
import env from './assignConfig';

async function selectOptions() {
  const options = {
    notifications: {
      assignment: 'Assignment Desktop Notifications',
      feedbacks: 'Feedbacks Desktop Notifications',
      push: 'Assignment Pushbullet Notifications',
    },
    ui: {
      queue: 'Show queue information',
      assigned: 'Show list of assigned submissions.',
      infotext: 'Show extra info about the script.',
      helptext: 'Show helptext.',
      verbose: 'Show debugging information.',
    },
    noUI: {
      silent: 'Remove all UI elements (this overrides everything else).',
    },
  };
  const notify = Object.keys(options.notifications)
    .reduce((acc, value) => {
      // Only add pushbullet if a token has been registered.
      if (value === 'push' && !config.pushbulletToken) {
        return acc;
      }
      acc.push({
        name: options.notifications[value],
        checked: env.flags[value],
        value,
      });
      return acc;
    }, []);
  const ui = Object.keys(options.ui)
    .map(value => ({
      name: options.ui[value],
      checked: env.flags[value],
      value,
    }));
  const silent = {
    name: options.noUI.silent,
    checked: env.flags.silent,
    value: 'silent',
  };

  const choices = [new inquirer.Separator('\nNotifications Options')]
    .concat(notify)
    .concat(new inquirer.Separator('\nUI Options'))
    .concat(ui)
    .concat(new inquirer.Separator('\nGO DARK'))
    .concat(silent);

  // Clearing the screen.
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
  // Notify the user if the script is running..
  if (env.submission_request) {
    console.log(chalk.green('urcli is running in the background...\n'));
  }

  const opts = await inquirer.prompt([{
    type: 'checkbox',
    message: 'Select option(s) to toggle ON/OFF:\n',
    name: 'options',
    choices,
    pageSize: 15,
  }]);
  return opts;
}

export default selectOptions;
