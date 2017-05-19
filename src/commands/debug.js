// npm modules
import ora from 'ora';
// our modules
import {api} from '../utils';

async function debugCmd() {
  const debugSpinner = ora('Information on the current request...').start();
  const submissionRequest = await api({task: 'get'});

  debugSpinner.succeed(`submission_request:\n${JSON.stringify(submissionRequest.body, null, 2)}\n`);
  process.exit(0);
}

export default debugCmd;
