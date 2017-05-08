// npm modules
import notifier from 'node-notifier';
// our modules
import {api} from '../../utils';
import env from './assignConfig';
import setPrompt from './prompt';
import createRequestBody from './createRequestBody';
import checkAssigned from './checkAssigned';

const checkPositions = async () => {
  const positionResponse = await api({
    task: 'position',
    id: env.submission_request.id});
  env.positions = positionResponse.body;
};

const checkFeedbacks = async () => {
  const stats = await api({task: 'stats'});
  const diff = stats.body.unread_count - env.unreadFeedbacks.length;

  if (diff > 0) {
    const feedbacksResponse = await api({task: 'feedbacks'});
    env.unreadFeedbacks = feedbacksResponse.body.filter(fb => fb.read_at === null);
    // Notify the user of the new feedbacks.
    if (env.flags.feedbacks) {
      env.unreadFeedbacks.slice(-diff).forEach((fb) => {
        notifier.notify({
          title: `New ${fb.rating}-star Feedback!`,
          message: `Project: ${fb.project.name}`,
          sound: 'Pop',
          open: `https://review.udacity.com/#!/reviews/${fb.submission_id}`,
        });
      });
    }
  } else if (stats.body.unread_count === 0) {
    env.unreadFeedbacks = [];
  }
};

const createNewSubmissionRequest = async () => {
  const res = await api({
    task: 'create',
    body: createRequestBody(),
  });
  env.submission_request = res.body;
  env.requestIds.push(env.submission_request.id);
  checkPositions();
  env.tick = 0;
};

const refreshSubmissionRequest = async () => {
  const submissionRequest = await api({
    task: 'refresh',
    id: env.submission_request.id,
  });
  env.submission_request = submissionRequest.body;
};

async function mainLoop() {
  if (env.update) {
    try {
      // We have to check for new assignments every time, to account for edge
      // cases where, for instance, a review is completed and a new one is
      // assigned, all between updates.
      await checkAssigned();
      // We only need to deal with the submission request and the queue if we
      // haven't got max number of submissions assigned.
      if (env.assigned.length < 2) {
        const res = await api({task: 'get'});
        const submissionRequest = res.body[0];
        // If a submission_request exists, we save it and check if it should be
        // refreshed.
        if (submissionRequest) {
          env.submission_request = submissionRequest;
          if (env.refresh) {
            await refreshSubmissionRequest();
          }
        } else {
          await createNewSubmissionRequest();
        }
        if (env.updatePositions) {
          await checkPositions();
        }
      }
      // Check if the info needs to update
      if (env.updateFeedbacks && env.flags.feedbacks) {
        checkFeedbacks();
      }
      setPrompt();
    } catch (e) {
      env.error = e;
    }
  }
  // Set/reset to the default update intervals.
  env.update = env.tick % env.updateInterval === 0;
  env.refresh = env.tick % env.refreshInterval === 0;
  env.updatePositions = env.tick % env.updatePositionsInterval === 0;
  env.updateFeedbacks = env.tick % env.updateFeedbacksInterval === 0;
  env.tick += 1;
  setTimeout(async () => {
    await mainLoop();
  }, 1000);
}

export default mainLoop;
