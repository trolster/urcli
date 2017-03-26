// npm modules
import ora from 'ora';
// our modules
import env from './assignEnvironment';
import check from './check';
import {api} from '../../utils';

export default async function updateSubmissionRequest() {
  const spinner = ora('Checking if we need to update..').start();
  const getResponse = await api({task: 'get'});
  if (getResponse.body[0].status === 'available') {
    env.submission_request.id = getResponse.body[0].id;
    await api({
      task: 'update',
      id: env.submission_request.id,
      body: env.submission_request.body,
    });
  } else {
    const response = await api({
      task: 'create',
      id: env.submission_request.id,
      body: env.submission_request.body,
    });
    env.submission_request.id = response.body.id;
  }
  await check.positions();
  // Reset tick to reset the timers.
  env.tick = 0;
  spinner.succeed('Update complete..');
}
