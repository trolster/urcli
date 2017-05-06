// npm modules
import ora from 'ora';
// our modules
import env from './assignConfig';
import {api, config} from '../../utils';
import handleKeypress from './handleKeypress';
import mainLoop from './gradingAssigner';

// TODO: Add --push flag

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

const createRequestBody = () => ({
  projects: env.ids
    .reduce((acc, id) => acc
        .concat(config.languages
          .map(language => ({project_id: id, language}))), []),
});

// When the command is run we either update the submission_request or create a
// new one.
const createOrUpdateSubmissionRequest = async () => {
  env.submission_request.body = createRequestBody();
  const getResponse = await api({task: 'get'});
  if (getResponse.body[0]) {
    Object.assign(env.submission_request, getResponse.body[0]);
    await api({
      task: 'update',
      id: env.submission_request.id,
      body: env.submission_request.body,
    });
  } else {
    const createResponse = await api({
      task: 'create',
      body: env.submission_request.body,
    });
    Object.assign(env.submission_request, createResponse.body);
  }
  // Get positions once the submission_request is finalized.
  const positionResponse = await api({
    task: 'position',
    id: env.submission_request.id,
  });
  env.positions = positionResponse.body;
};

export async function assignCmd(ids, options) {
  const spinner = ora('Registering the request...').start();
  validateIds(ids, spinner);
  registerOptions(options);
  await createOrUpdateSubmissionRequest();
  handleKeypress();
  spinner.succeed('Environment ready:');
  console.log(env);
  // mainLoop();
  process.exit(0);
}
