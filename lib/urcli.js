#!/usr/bin/env node

const cli = require('commander')
const pkg = require('../package')

cli.name('ur-cli')

cli
  .version(pkg.version)
  .usage('<command> <args> [options]')
  .command('pushonce <accessToken>', 'Test the pushbullet notifications.')
  .command('setup <token>', 'Setup review configuration options.')
  .command('get [id]', 'Get assignment requests.')
  .command('update [projectIds]', 'Update an assignment request.')
  .command('delete', 'Delete an assignment request.')
  .command('refresh', 'Refresh the current assignment request.')
  .command('position', 'Get your position in the queues.')
  .command('assign', 'Place requests in the queue.')
  .command('token <token>', 'Save a token.')
  .command('certs', 'Save certifications.')
  .command('money [months...]', "Lets you know how much you've earned in a given interval")
  .parse(process.argv)

// Help if no command was input:
if (!cli.args.length) {
  cli.parse([process.argv[0], process.argv[1], '-h'])
  process.exit(0)
}

process.on('uncaughtException', function (e) {
  console.error('CLI Error:', e, e.stack)
  process.exit(0)
})
