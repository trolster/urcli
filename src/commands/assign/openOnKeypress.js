// npm modules
import opn from 'opn';
// our modules
import env from './assignEnvironment';

export default function openOnKeypress() {
  const baseReviewURL = 'https://review.udacity.com/#!/submissions/';
  if (env.key === '0') opn(`${baseReviewURL}dashboard`);
  if (env.key === '1' && env.assigned[0]) opn(`${baseReviewURL}${env.assigned[0].id}`);
  if (env.key === '2' && env.assigned[1]) opn(`${baseReviewURL}${env.assigned[1].id}`);
}
