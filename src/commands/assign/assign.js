// npm modules
import ora from 'ora';
// our modules
import env from './assignConfig';
import {api, config} from '../../utils';
import handleKeypressEvents from './handleKeypressEvents';
import mainLoop from './gradingAssigner';
import createRequestBody from './createRequestBody';
import checkAssigned from './checkAssigned';

const validateIds = (ids, spinner) => {
  if (ids[0] === 'all') {
    env.ids = Object.keys(config.certs);
  } else {
    const invalid = ids.filter(id => !Object.keys(config.certs).includes(id));
    if (invalid.length) {
      spinner.fail(`Error: You are not certified for project(s): ${[...invalid].join(', ')}`);
      process.exit(1);
    }
    env.ids = ids;
  }
};

const registerOptions = (options) => {
  Object.keys(env.flags).forEach((flag) => {
    if (options[flag]) env.flags[flag] = true;
  });
};

// When the command is run we either update the submission_request or create a
// new one.
const createOrUpdateSubmissionRequest = async () => {
  try {
    let submissionRequest = await api({task: 'get'});
    env.submission_request = submissionRequest.body[0];
    if (submissionRequest.body[0]) {
      await api({
        task: 'update',
        id: env.submission_request.id,
        body: createRequestBody(),
      });
      // Since update doesn't refresh we have to call the refresh endpoint.
      submissionRequest = await api({
        task: 'refresh',
        id: env.submission_request.id,
      });
      env.submission_request = submissionRequest.body;
    } else {
      submissionRequest = await api({
        task: 'create',
        body: createRequestBody(),
      });
      env.submission_request = submissionRequest.body[0];
    }
    env.requestIds.push(env.submission_request.id);
    // Get positions once the submission_request is finalized.
    const positionResponse = await api({
      task: 'position',
      id: env.submission_request.id,
    });
    env.positions = positionResponse.body;
  } catch (e) {
    if (e.res.body) {
      console.error(e.res.body);
    } else {
      console.error(e);
    }
    process.exit(1);
  }
};

export async function assignCmd(ids, options) {
  const spinner = ora('Registering the request...').start();
  validateIds(ids, spinner);
  registerOptions(options);
  await createOrUpdateSubmissionRequest();
  await checkAssigned();
  handleKeypressEvents();
  spinner.succeed('Environment ready. Starting main submission request loop.');
  env.timerID = setInterval(() => {
    mainLoop();
  }, 1000);
}
