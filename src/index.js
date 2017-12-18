#!/usr/bin/env node

import cli from './cli';

cli.parse(process.argv);

if (!cli.args.length) cli.help();

// output all uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('uncaught exception:', err);
});
// output all uncaught promise rejections
process.on('unhandledRejection', (err) => {
  console.error('unhandled rejection:', err);
});
