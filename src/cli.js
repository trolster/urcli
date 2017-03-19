// npm modules
import cli from 'commander';
// our modules
import pkg from '../package.json';
import {
  tokenCmd,
  certsCmd,
  setupCmd,
  assignCmd,
  revenueCmd,
} from './commands';

cli
  .version(pkg.version)
  .usage('<command> <args> [options]');

cli
  .command('token')
  .arguments('<newToken>')
  .description('Save a new token')
  .action((newToken) => {
    tokenCmd(newToken);
  });

cli
  .command('certs')
  .description('Save your certifications')
  .action(() => {
    certsCmd();
  });

cli
  .command('setup')
  .arguments('<token>')
  .description('Setup review configuration options.')
  .action((token) => {
    setupCmd(token);
  });

cli
  .command('assign')
  .arguments('<ids...>')
  .option('--push <accessToken>', 'Get push notifications using <accessToken>.')
  .option('--feedbacks', 'Get notified on new feedbacks.')
  .option('--silent', 'Skip the helptext.')
  .description('Place requests in the queue.')
  .action((ids, options) => {
    assignCmd(ids, options);
  });

cli
  .command('revenue')
  .arguments('[periods...]')
  .option('--from <date>', 'select from <date>.')
  .option('--to <date>', 'select to <date>.')
  .description('Lets you know how much you\'ve earned in a given period.')
  .action((periods, options) => {
    revenueCmd(periods, options);
  });

cli
  .command('money')
  .arguments('[args]')
  .description('This command is deprecated. It will be removed in future releases. Use the "revenue" command instead.')
  .action(() => {
    console.log('The money command has deprecated and will be removed in future releases.');
    console.log('    Use the "revenue" command instead.');
    process.exit(0);
  });

export default cli;
