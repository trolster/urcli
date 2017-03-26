// node modules
import readline from 'readline';
// our modules
import env from './assignEnvironment';
import exit from './exit';
import openOnKeypress from './openOnKeypress';

export default function setEventListeners() {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on('keypress', (str, key) => {
    /* eslint-disable eqeqeq */
    env.key = key.sequence;
    if (env.key == '\u001b' || env.key == '\u0003') {
      exit();
    } else if (['0', '1', '2'].includes(env.key)) {
      openOnKeypress(parseInt(env.key, 10), env.assigned);
    }
  });
}
