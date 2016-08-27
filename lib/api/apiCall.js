#!/usr/bin/env node

const request = require('request')

/**
* Concatenate the parts of an endpoint url from a task and an id.
* @param {string} task The name of the task to be requested
* @param {string} id The id of either a project or a submission
* @return {string} The endpoint URL
*/
function api (task, id) {
  let base = 'https://review-api.udacity.com/api/v1'
  return {
    'certifications': [`${base}/me/certifications/`, 'GET'],
    'assigned': [`${base}/me/submissions/assigned/`, 'GET'],
    'assignedCount': [`${base}/me/submissions/assigned_count/`, 'GET'],
    'submissions': [`${base}/me/submissions/`, 'GET'],
    'feedbacks': [`${base}/me/student_feedbacks/`, 'GET'],
    'stats': [`${base}/me/student_feedbacks_stats/`, 'GET'],
    'completed': [`${base}/me/submissions/completed/`, 'GET'],
    'assign': [`${base}/projects/${id}/submissions/assign`, 'POST'],
    'unassign': [`${base}/submissions/${id}/unassign`, 'PUT']
  }[task]
}

/**
* Calls an endpoint and returns a promise.
* @param {string} token The token string for authorization.
* @param {string} task The task to be requested.
* @param {string} id The id of the project or the submission.
* @return {object} Promise with the response.
*/
module.exports = (token, task, id = '') => {
  let [url, method] = api(task, id)
  let options = {
    url: url,
    method: method,
    headers: {
      Authorization: token
    },
    json: true
  }
  return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
