// npm modules
import request from 'request';

function endpoint(task, id) {
  const base = 'https://review-api.udacity.com/api/v1';
  return {
    certifications: [`${base}/me/certifications/`, 'GET'],
    assigned: [`${base}/me/submissions/assigned/`, 'GET'],
    count: [`${base}/me/submissions/assigned_count/`, 'GET'],
    submissions: [`${base}/me/submissions/`, 'GET'],
    feedbacks: [`${base}/me/student_feedbacks/`, 'GET'],
    stats: [`${base}/me/student_feedbacks/stats/`, 'GET'],
    completed: [`${base}/me/submissions/completed/`, 'GET'],
    assign: [`${base}/projects/${id}/submissions/assign`, 'POST'],
    unassign: [`${base}/submissions/${id}/unassign`, 'PUT'],
    // submission_request endpoints
    get: [`${base}/me/submission_requests/`, 'GET'],
    getById: [`${base}/submission_requests/${id}`, 'GET'],
    create: [`${base}/submission_requests/`, 'POST'],
    delete: [`${base}/submission_requests/${id}`, 'DELETE'],
    update: [`${base}/submission_requests/${id}`, 'PUT'],
    refresh: [`${base}/submission_requests/${id}/refresh/`, 'PUT'],
    position: [`${base}/submission_requests/${id}/waits`, 'GET'],
  }[task];
}

export class Api {
  constructor(token) {
    this.token = token;
  }
  call({task, id = '', body = ''}) {
    const [url, method] = endpoint(task, id);
    const headers = {Authorization: this.token};
    const json = true;
    const requestOptions = {url, method, headers, json, body};
    return new Promise((resolve, reject) => {
      request(requestOptions, (error, res) => {
        if (error) {
          reject({error, requestOptions, res});
        } else {
          resolve(res);
        }
      });
    });
  }
}
