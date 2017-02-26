#!/usr/bin/env node

// project dependencies
import cli from 'commander';
// our modules
import pkg from '../package.json';

cli.name('urcli');

cli
  .version(pkg.version)
  .usage('<command> <args> [options]')
  .command('pushonce <accessToken>', 'Test the pushbullet notifications.')
  .command('setup <token>', 'Setup review configuration options.')
  .command('assign', 'Place requests in the queue.')
  .command('token <token>', 'Save a token.')
  .command('certs', 'Save certifications.')
  .command('money [months...]', "Lets you know how much you've earned in a given interval")
  .parse(process.argv);

// Help if no command was input
if (!cli.args.length) {
  cli.parse([process.argv[0], process.argv[1], '-h']);
  process.exit(0);
}

// output all uncaught exceptions
process.on('uncaughtException', err => console.error('uncaught exception:', err));
// output all uncaught promise rejections
process.on('unhandledRejection', err => console.error('unhandled rejection:', err));
