const cli = require('commander')
const apiCall = require('./apiCall')

cli.parse(process.argv)

let id = cli.args[0]

if (id) {
  apiCall('getById', id)
} else {
  apiCall('get')
}
