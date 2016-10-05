const cli = require('commander')
const apiCall = require('./apiCall')
const config = require('../apiConfig')

cli.parse(process.argv)

let ids = cli.args
let projects = {
  projects: ids.map(id => {
    return {
      project_id: id,
      language: config.language
    }
  })
}
// TODO: Validation...
apiCall('get')
.then(res => {
  let id = res.body[0].id
  apiCall('update', id, projects)
  .then(res => {
    let submissionRequest = res.body[0]
    console.log(submissionRequest.id)
    console.log(submissionRequest.submission_request_projects)
  })
})
