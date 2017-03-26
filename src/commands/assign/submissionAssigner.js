import {prompt, check, createSubmissionRequest} from './';

async function submissionAssigner() {
  const cmd = process.env.CMD;
  const tickrate = 3000;
  const infoRate = 1;
  try {
    // Call API to check how many submissions are currently assigned.
    const count = await cmd.api.call({task: 'count'});
    if (cmd.assigned.length !== count.body.assigned_count) {
      check.assigned();
    }
    // If then the assigned.length is less than the maximum number of assignments
    // allowed, we go through checking the submission_request.
    if (cmd.assigned.length < 2) {
      const getResponse = await cmd.api.call({task: 'get'});
      const submissionRequestObject = getResponse.body[0];
      // If there is no current submission_request we create a new one.
      if (!submissionRequestObject) {
        createSubmissionRequest();
      } else {
        cmd.submission_request.id = submissionRequestObject.id;
        // Refresh the submission_request if it's is about to expire.
        const closingIn = Date.parse(submissionRequestObject.closed_at) - Date.now();
        // If it expires in less than 5 minutes we refresh.
        if (closingIn < 300000) {
          cmd.api.call({task: 'refresh', id: cmd.submission_request.id});
        }
        // Check the queue positions and for new feedbacks.
        if (cmd.tick % infoRate === 0) {
          check.positions();
          if (cmd.options.feedbacks) {
            check.feedbacks();
          }
        }
      }
    }
  } catch (e) {
    cmd.error = e.error.code;
  }
  prompt();
  setTimeout(() => {
    cmd.tick += 1;
    submissionAssigner();
  }, tickrate);
}

export default submissionAssigner;
