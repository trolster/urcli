// node modules
import inquirer from 'inquirer';
import readline from 'readline';
import chalk from 'chalk';
import {config} from '../../utils';
import env from './assignConfig';

async function selectDefaultProjects() {
  const choices = Object.keys(config.certs)
    .map(id => ({
      name: id,
      checked: false,
      value: id,
    }));

  // Clearing the screen.
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
  // Notify the user if the script is running..
  if (env.submission_request) {
    console.log(chalk.green('urcli is running in the background...\n'));
  }

  const opts = await inquirer.prompt([{
    type: 'checkbox',
    message: 'Select default projects to request:\n',
    name: 'default',
    choices,
    pageSize: 15,
  }]);
  return opts.default;
}

export default selectDefaultProjects;
