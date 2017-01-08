const fs = require('fs')
const path = require('path')
const moment = require('moment')
const cli = require('commander')
const config = require('../apiConfig')

cli.parse(process.argv)

config.token = cli.args[0]
config.tokenAge = moment().add(28, 'd')

fs.writeFileSync(
  path.resolve('./apiConfig.json'), JSON.stringify(config, null, 2))
