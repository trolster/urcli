// project dependencies
const moment = require('moment')
const cli = require('commander')
// our modules
const config = require('./config')

cli.parse(process.argv)

config.token = cli.args[0]
config.tokenAge = moment().add(28, 'd')
config.save()
