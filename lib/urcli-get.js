const cli = require('commander')
const apiCall = require('./apiCall')

cli.parse(process.argv)

let id = cli.args[0] ? cli.args[0] : ''
let command = id ? 'getById' : 'get'

apiCall(command, id)
.then(res => {
  let submissionRequest = res.body[0]
  console.log(submissionRequest.id)
  console.log(submissionRequest.submission_request_projects)
})
