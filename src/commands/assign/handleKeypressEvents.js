// node modules
import readline from 'readline';
import chalk from 'chalk';
import opn from 'opn';
// our modules
import {api} from '../../utils';
import env from './assignConfig';
import selectOptions from './selectOptions';

const exit = async () => {
  // Only touch the API if we have less than max number of submissions assigned.
  if (env.assigned.length > 1) {
    console.log(chalk.green('Exited..'));
    process.exit(0);
  }
  /* eslint-disable eqeqeq */
  if (env.key == '\u001b') { // The ESCAPE key
    if (env.submission_request.id) {
      // Suspend on ESC and refresh the submission_request rather than deleting it.
      await api({task: 'refresh', id: env.submission_request.id});
      console.log(chalk.green('Exited without deleting the submission_request...'));
      console.log(chalk.green('The current submission_request will expire in an hour.'));
    } else {
      console.log(chalk.green('Exited..'));
    }
    process.exit(0);
  } else if (env.key == '\u0003') { // The CTRL-C key
    // Delete submission_request object and exit on CTRL-C
    api({task: 'delete', id: env.submission_request.id})
    .then(() => {
      console.log(chalk.green('Successfully deleted request and exited..'));
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

const open = () => {
  const baseReviewURL = 'https://review.udacity.com/#!/submissions/';
  if (env.key === '0') opn(`${baseReviewURL}dashboard`);
  if (env.key === '1' && env.assigned[0]) opn(`${baseReviewURL}${env.assigned[0].id}`);
  if (env.key === '2' && env.assigned[1]) opn(`${baseReviewURL}${env.assigned[1].id}`);
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
