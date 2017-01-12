const cli = require('commander')
const apiCall = require('./apiCall')

cli.parse(process.argv)

apiCall('get')
.then(res => {
  let requestId = res.body[0].id
  if (!res.body[0]) {
    console.log('There is currently no submission_request to refresh.')
  } else {
    apiCall('refresh', requestId)
  }
})
