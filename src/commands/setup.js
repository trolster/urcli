// npm modules
import moment from 'moment';
import inquirer from 'inquirer';
import PushBullet from 'pushbullet';
import Table from 'cli-table2';
import ora from 'ora';
// our modules
import {Api, Config} from '../utils';

const config = new Config();
let api;

async function getUserInfoFromApi() {
  const startDateSpinner = ora('Getting startDate...').start();
  const completedReviews = await api.call({
    task: 'completed',
    body: {
      start_date: moment('2014-01-01').format('YYYY-MM-DDTHH:mm:ss.SSS'),
      end_date: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
    },
  });
  const startDate = completedReviews.body
    .map(review => moment(review.assigned_at)) // returns date of review
    .map(date => date.valueOf()) // returns date in Unix Time (milliseconds from 1970)
    .reduce((acc, val) => { // returns the smallest number
      if (acc < val) {
        return acc;
      }
      return val;
    });
  config.startDate = moment(startDate).format('YYYY-MM-DD');
  startDateSpinner.succeed(`Startdate is ${config.startDate}`);

  const certSpinner = ora('Getting certifications...').start();
  const certifications = await api.call({
    task: 'certifications',
  });
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

  // Create a new table for certifications
  const certsDetails = new Table({
    head: [
      {hAlign: 'center', content: 'id'},
      {hAlign: 'left', content: 'project name'},
      {hAlign: 'center', content: 'price'}],
    colWidths: [5, 40, 7],
  });

  Object.keys(config.certs)
    .sort((a, b) => a - b)
    .forEach((id) => {
      const {name, price} = config.certs[id];
      certsDetails.push([
        {hAlign: 'center', content: id},
        {hAlign: 'left', content: name},
        {hAlign: 'center', content: price},
      ]);
    });
  certSpinner.succeed(`Your certifications:\n${certsDetails.toString()}`);

  const configSpinner = ora('Saving configs...').start();
  config.save();
  configSpinner.succeed('Configs successfully save.');
  process.exit(0);
}

const accessToken = () => {
  inquirer.prompt([{
    type: 'input',
    name: 'pushbulletToken',
    message: 'Input your PushBullet access token:',
    validate(pushbulletToken) {
      const pusher = new PushBullet(pushbulletToken);
      return new Promise((resolve, reject) => {
        pusher.devices((err) => {
          if (err) reject(err);
          resolve(true);
        });
      });
    },
  }]).then((pushbulletToken) => {
    Object.assign(config, pushbulletToken);
    getUserInfoFromApi();
  });
};

const pushbullet = () => {
  inquirer.prompt([{
    type: 'confirm',
    name: 'pushbullet',
    message: 'Do you wish to use PushBullet?',
    default: false,
  }]).then((confirm) => {
    if (confirm.pushbullet) {
      accessToken();
    } else {
      getUserInfoFromApi();
    }
  });
};

const languages = () => {
  inquirer.prompt([{
    type: 'checkbox',
    message: 'Select Language(s) that you are certified for:\n',
    name: 'languages',
    choices: ['en-us', 'pt-br', 'zh-cn'],
    validate: (langs) => {
      if (langs.length < 1) {
        return 'You must choose at least one language.';
      }
      return true;
    },
  }]).then((langs) => {
    Object.assign(config, langs);
    pushbullet();
  });
};

const tokenInput = () => {
  inquirer.prompt([{
    type: 'input',
    name: 'token',
    message: 'Input your token:',
    validate(token) {
      api = new Api(token);
      return api.call({task: 'count'}).then((res) => {
        /* eslint-disable eqeqeq */
        if (res.statusCode == '200') {
          return true;
        }
        return 'The token was invalid, try again.';
      });
    },
  }]).then((token) => {
    Object.assign(config, token);
    config.tokenAge = moment().add(28, 'd');
    languages();
  });
};

export const setupCmd = () => {
  tokenInput();
};
