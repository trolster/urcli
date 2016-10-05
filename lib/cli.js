#!/usr/bin/env node

const cli = require('commander')
const pkg = require('../package')

cli.name('ur-cli')

cli
  .version(pkg.version).usage('<command> <args> [options]')
  .command('create [projectIds]', 'Make a request to queue up for project submissions.')
  .command('get [id]', 'Get assignment requests.')
  .command('update [projectIds]', 'Update an assignment request.')
  .command('delete', 'Delete an assignment request.')
  .command('refresh', 'Refresh the current assignment request.')
  .command('position', 'Get your position in the queues.')
  .command('assign', 'Place requests in the queue.')
  .command('assign2 <ids...>', 'Place requests in the queue.')
  .command('token <token>', 'Save a token.')
  .command('certs', 'Save certifications.')
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
