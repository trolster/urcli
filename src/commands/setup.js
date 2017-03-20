// node modules
import readline from 'readline';
// npm modules
import moment from 'moment';
import chalk from 'chalk';
// our modules
import {Api, Config} from '../utils';

const config = new Config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Certified language > ',
});

export const setupCmd = (token) => {
  config.token = token;
  config.tokenAge = moment().add(28, 'd');
  const api = new Api(token);

  console.log('You can now add all the languages that you are certified for.');
  console.log('Simply type in each language code and separate them with a space.');
  console.log('Example: "en-us pt-br"');
  rl.prompt();

  rl.on('line', (line) => {
    /* eslint-disable no-underscore-dangle */
    line.trim();
    line.toLowerCase();
    if (line === 'y') {
      rl.close();
      return;
    }
    const lang = line.match(/[a-z]{2}-[a-z]{2}/gi);
    if (lang === null) {
      rl._prompt = line === 'n' ? 'Try again (ex: "en-us pt-br") > ' :
                                  'Invalid language code(s). Try again (ex: "en-us pt-br") > ';
      rl.prompt();
    } else {
      config.languages = lang;
      console.log('You have entered the following language(s): ', lang);
      rl._prompt = 'Was this correct? (y/n) > ';
      rl.prompt();
    }
  });

  rl.on('close', async () => {
    const task = 'certifications';
    const certifications = await api({token, task});
    if (certifications.statusCode !== 200) {
      console.error(chalk.red('The script encountered an error:'));
      console.error(chalk.red(`statusCode: ${certifications.statusCode}`));
      console.error(chalk.red(`This is the token you passed in as an argument: ${token}`));
      throw new Error();
    }
    config.certs = certifications.body
      .filter(cert => cert.status === 'certified')
      .reduce((acc, cert) => {
        /* eslint-disable no-param-reassign */
        acc[cert.project.id] = {
          name: cert.project.name,
          price: cert.project.price,
        };
        return acc;
      }, {});
    config.save();
  });
};
