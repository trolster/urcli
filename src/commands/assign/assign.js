// our modules
import env from './assignEnvironment';
import createRequestBody from './createRequestBody';
// import setEventListeners from './setEventListeners';
import validateIds from './validateIds';
import updateSubmissionRequest from './updateSubmissionRequest';

export async function assignCmd(ids, options) {
  validateIds(ids);
  Object.keys(env.flags).forEach((flag) => {
    if (options[flag]) env.flags[flag] = true;
  });
  createRequestBody();
  // setEventListeners();
  await updateSubmissionRequest();
  console.log(env);
  process.exit(0);
}
