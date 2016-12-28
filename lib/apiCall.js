const request = require('request')
const config = require('../apiConfig')

function endpoint (task, id) {
  const base = 'https://review-api.udacity.com/api/v1'
  return {
    'certifications': [`${base}/me/certifications/`, 'GET'],
    'assigned': [`${base}/me/submissions/assigned/`, 'GET'],
    'count': [`${base}/me/submissions/assigned_count/`, 'GET'],
    'submissions': [`${base}/me/submissions/`, 'GET'],
    'feedbacks': [`${base}/me/student_feedbacks/`, 'GET'],
    'stats': [`${base}/me/student_feedbacks/stats/`, 'GET'],
    'completed': [`${base}/me/submissions/completed/`, 'GET'],
    'assign': [`${base}/projects/${id}/submissions/assign`, 'POST'],
    'unassign': [`${base}/submissions/${id}/unassign`, 'PUT'],
    // NEW ENDPOINTS
    'get': [`${base}/me/submission_requests/`, 'GET'],
    'getById': [`${base}/submission_requests/${id}`, 'GET'],
    'create': [`${base}/submission_requests/`, 'POST'],
    'delete': [`${base}/submission_requests/${id}`, 'DELETE'],
    'update': [`${base}/submission_requests/${id}`, 'PUT'],
    'refresh': [`${base}/submission_requests/${id}/refresh/`, 'PUT'],
    'position': [`${base}/submission_requests/${id}/waits`, 'GET']
  }[task]
}

module.exports = (task, id = '', body) => {
  let [url, method] = endpoint(task, id)
  let options = {
    url: url,
    method: method,
    headers: {
      Authorization: config.token
    },
    json: true,
    timeout: 9000
  }
  if (body) {
    options.body = body
  }
  if (process.env.NODE_ENV === 'testing') {
    console.log('REQUEST:')
    console.log(options)
  }
  return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if (err) {
        reject(err)
      } else {
        if (process.env.NODE_ENV === 'testing') {
          console.log('RESPONSE:')
          console.log(res.body)
        }
        resolve(res)
      }
    })
  })
}

