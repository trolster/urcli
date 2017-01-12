const cli = require('commander')
const apiCall = require('./apiCall')

cli.parse(process.argv)

apiCall('get')
  .then(res => {
    let id = res.body[0].id
    apiCall('position', id)
      .then(res => {
        console.log('Waits..')
      })
  })
