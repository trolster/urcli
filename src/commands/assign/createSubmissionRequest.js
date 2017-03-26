// our modules
import env from './assignEnvironment';
import check from './check';
import {api} from '../../utils';

export async function createSubmissionRequest() {
  const response = await api({
    task: 'create',
    id: env.submission_request.id,
    body: env.submission_request.body,
  });
  env.submission_request.id = response.body.id;
  check.positions();
  // Reset tick to reset the timers.
  env.tick = 0;
}
