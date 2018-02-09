// our modules
import {api} from '../../utils';
import env from './assignConfig';
import setPrompt from './prompt';
import createRequestBody from './createRequestBody';
import checkAssigned from './checkAssigned';
import checkFeedbacks from './checkFeedbacks';

const checkPositions = async () => {
  const positions = await api({
    task: 'position',
    id: env.submission_request.id,
  });
  env.positions = positions.body;
};

const createNewSubmissionRequest = async () => {
  const submissionRequest = await api({
    task: 'create',
    body: createRequestBody(),
  });
  env.submission_request = submissionRequest.body;
  env.requestIds.push(env.submission_request.id);
  env.tick = 0;
};

const refreshSubmissionRequest = async () => {
  const submissionRequest = await api({
    task: 'refresh',
    id: env.submission_request.id,
  });
  env.submission_request = submissionRequest.body;
};

async function requestLoop() {
  if (env.update) {
    try {
      // We have to check for new assignments every time, to account for edge
      // cases where, for instance, a review is completed and a new one is
      // assigned, all between updates.
      await checkAssigned();
      // We only need to deal with the submission request and the queue if we
      // haven't got max number of submissions assigned.
      if (env.assigned.length < 5) {
        const res = await api({task: 'get'});
        const submissionRequest = res.body[0];
        // If a submission_request exists, we save it and check if it should be
        // refreshed.
        if (submissionRequest) {
          env.submission_request = submissionRequest;
          if (env.refresh && env.tick !== 0) {
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
      if (env.flags.ui) {
        setPrompt();
      }
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
    await requestLoop();
  }, 1000);
}

export default requestLoop;
