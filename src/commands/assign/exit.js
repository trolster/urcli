// npm modules
import chalk from 'chalk';
// our modules
import env from './assignEnvironment';
import call from '../../utils/api';

export default function exit() {
  /* eslint-disable eqeqeq */
  if (env.key == '\u001b') { // The ESCAPE key
    // Suspend on ESC and refresh the submission_request rather than deleting it.
    call({task: 'refresh', id: env.submission_request.id});
    console.log(chalk.green('Exited without deleting the submission_request...'));
    console.log(chalk.green('The current submission_request will expire in an hour.'));
    process.exit(0);
  } else if (env.key == '\u0003') { // The CTRL-C key
    // Delete submission_request object and exit on CTRL-C
    call({task: 'refresh', id: env.submission_request.id}).then(() => {
      console.log(chalk.green('Successfully deleted request and exited..'));
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}
