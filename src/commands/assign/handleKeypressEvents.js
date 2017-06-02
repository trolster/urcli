// node modules
import readline from 'readline';
// npm modules
import chalk from 'chalk';
import opn from 'opn';
import ora from 'ora';
// our modules
import {api, config} from '../../utils';
import env from './assignConfig';
import selectOptions from './selectOptions';

const exit = async () => {
  // Avoid updates while exiting
  env.tick = 1;
  env.updateInterval = 300; // 5 minutes should be enough
  const spinner = ora('Exiting...').start();
  // Only touch the API if we have less than max number of submissions assigned.
  if (env.assigned.length > 1) {
    spinner.succeed('Exited successfully.');
    process.exit(0);
  }
  // Delete any temporary configurations
  delete config.temp;
  config.save();
  /* eslint-disable eqeqeq */
  if (env.key == '\u001b') { // The ESCAPE key
    if (env.submission_request.id) {
      // Suspend on ESC and refresh the submission_request rather than deleting it.
      await api({task: 'refresh', id: env.submission_request.id});

      spinner.succeed('Exited without deleting the submission_request.');
      console.log(chalk.green('The current submission_request will expire in an hour.'));
    } else {
      spinner.succeed('Exited successfully.');
    }
    process.exit(0);
  } else if (env.key == '\u0003') { // The CTRL-C key
    // Delete submission_request object and exit on CTRL-C
    api({task: 'delete', id: env.submission_request.id})
    .then(() => {
      spinner.succeed('Successfully deleted request and exited.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

const open = () => {
  const baseReviewURL = 'https://review.udacity.com/#!/submissions/';
  if (parseInt(env.key, 10) > env.assigned.length) {
    env.error = `No review is assigned to the key: ${env.key}.`;
    env.update = true;
  }
  if (env.key === '0') opn(`${baseReviewURL}dashboard`);
  if (env.key === '1' || env.key === '2') {
    try {
      // Save the submission temporarily to the config file.
      config.temp = env.assigned[env.key - 1];
      config.save();
      const scriptPath = config.assign.scripts[config.temp.project_id];
      // Open the users script in a new shell.
      opn(scriptPath, {wait: false});
    } catch (e) {
      env.error = `Unable to run user script. Error: ${e.code}.`;
      env.update = true;
    }
  }
};

async function handleKeypress() {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on('keypress', async (str, key) => {
    /* eslint-disable eqeqeq */
    env.key = key.sequence;
    if (env.key == '\u001b' || env.key == '\u0003') {
      exit();
    } else if (['0', '1', '2'].includes(env.key)) {
      open();
    } else if (env.key === 'r') {
      env.tick = 0;
      env.update = true;
      env.updateInfo = true;
    } else if (env.key === 'o') {
      env.flags.ui = false;
      const selected = await selectOptions();
      Object.keys(env.flags).forEach((flag) => {
        if (selected.options.includes(flag)) {
          env.flags[flag] = true;
        } else {
          env.flags[flag] = false;
        }
      });
      env.flags.ui = true;
      env.update = true;
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }
      process.stdin.resume();
    } else if (env.key === 'h') {
      env.flags.helptext = !env.flags.helptext;
      env.update = true;
    }
  });
}

export default handleKeypress;
