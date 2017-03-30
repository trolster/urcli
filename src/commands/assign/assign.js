// npm modules
import ora from 'ora';
// our modules
import env from './assignConfig';
import {api, config} from '../../utils';
import handleKeypress from './handleKeypress';

// TODO: Add --push flag

const validateIds = (ids) => {
  if (ids[0] === 'all') {
    env.ids = Object.keys(config.certs);
  } else {
    const invalid = ids.filter(id => !Object.keys(config.certs).includes(id));
    if (invalid.length) {
      throw new Error(`Error: You are not certified for project(s): ${[...invalid].join(', ')}`);
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

const createOrUpdateSubmissionRequest = async () => {
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
  const positionResponse = await api({
    task: 'position',
    id: env.submission_request.id,
  });
  env.positions = positionResponse.body.error ? [] : positionResponse.body;
};

export async function assignCmd(ids, options) {
  const spinner = ora('Initializing...').start();
  validateIds(ids);
  registerOptions(options);
  env.submission_request.body = createRequestBody();
  handleKeypress();
  await createOrUpdateSubmissionRequest();
  spinner.succeed('Ready...');
  console.log(env);
  process.exit(0);
}
