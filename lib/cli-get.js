const cli = require('commander')
const config = require('../apiConfig')
const apiCall = require('./apiCall')

cli.parse(process.argv)

apiCall('get', getId())
  .then(res => {
    console.log('Gotten..')
  })

function getId () {
  return cli.args.length ? cli.args[0] : ''
}
