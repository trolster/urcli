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
    'getSubmissionRequests': [`${base}/me/submission_requests/`, 'GET'],
    'getSubmissionRequestsById': [`${base}/submission_requests/${id}`, 'GET'],
    'createSubmissionRequests': [`${base}/submission_requests/`, 'POST'],
    'deleteSubmissionRequests': [`${base}/submission_requests/${id}`, 'DELETE'],
    'updateSubmissionRequests': [`${base}/submission_requests/${id}`, 'PUT'],
    'positionInQueue': [`${base}/submission_requests/${id}/waits`, 'GET'],
  }[task]
}

/**
* Calls an endpoint and returns a promise.
* @param {string} token The token string for authorization.
* @param {string} task The task to be requested.
* @param {string} id The id of the project or the submission.
* @return {object} Promise with the response.
*/
module.exports = (token, task, id = '', body) => {
  let [url, method] = api(task, id)
  let options = {
    url: url,
    method: method,
    headers: {
      Authorization: token
    },
    json: true
  }
  if (body) {
    options.body = body
  }
  console.log(options)
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
