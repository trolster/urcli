const api = require('./api')
const config = require('../apiConfig')

let {token, body} = config
let command = process.argv[2]

if (command === 'create') {
  api.submissionRequestCall(token, 'createSubmissionRequests','' , body)
    .then(res => {
      console.log(res.body)
    })
}

if (command === 'delete') {
  api.submissionRequestCall(token, 'getSubmissionRequests')
    .then(res => {
      console.log(res.body)
      let id = res.body[0].id
      api.submissionRequestCall(token, 'deleteSubmissionRequests', id)
        .then(res => {
          console.log(res.body)
        })
    })
}

if (command === 'get') {
  if (process.argv[3]) {
    let id = process.argv[3]
    api.submissionRequestCall(token, 'getSubmissionRequestsById', id)
      .then(res => {
        console.log(res.body)
      })
  } else {
    api.submissionRequestCall(token, 'getSubmissionRequests')
      .then(res => {
        console.log(res.body)
      })
  }
}

if (command === 'pos') {
  api.submissionRequestCall(token, 'getSubmissionRequests')
    .then(res => {
      console.log(res.body)
      let id = res.body[0].id
      api.submissionRequestCall(token, 'positionInQueue', id)
        .then(res => {
          console.log(res.body)
        })
    })
}

if (command === 'update') {
  api.submissionRequestCall(token, 'getSubmissionRequests')
    .then(res => {
      console.log(res.body)
      let id = res.body[0].id
      api.submissionRequestCall(token, 'updateSubmissionRequests', id, body)
        .then(res => {
          console.log(res.body)
        })
    })
}
