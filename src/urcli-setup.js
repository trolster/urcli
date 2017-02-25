// node modules
const readline = require('readline');
// project dependencies
const moment = require('moment');
const cli = require('commander');
// our modules
const apiCall = require('./apiCall');
const config = require('./config');

cli.parse(process.argv);

if (!cli.args[0]) {
  throw new Error('You must enter a token (use quotes)');
}

config.token = cli.args[0];
config.tokenAge = moment().add(28, 'd');
config.certs = {};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Certified language > ',
});

console.log('You can now add all the languages that you are certified for.');
console.log('Simply type in each language code and separate them with a space.');
console.log('Example: "en-us pt-br"');
console.log('Type "done" when you are done.');
rl.prompt();

rl.on('line', (line) => {
  // Because readline uses dangling underscores we have to do the following:
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
}).on('close', () => {
  // Get current certifications from the API
  apiCall({
    token: config.token,
    task: 'certifications',
  }).then((res) => {
    config.certs = res.body
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
});
