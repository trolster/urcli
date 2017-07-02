// npm modules
import chalk from 'chalk';
import inquirer from 'inquirer';
import moment from 'moment';
import ora from 'ora';
import PushBullet from 'pushbullet';
import Table from 'cli-table2';
// our modules
import {api, config} from '../utils';

async function getUserInfoFromApi() {
  const startDateSpinner = ora('Getting startDate...').start();
  const completedReviews = await api({
    task: 'completed',
    body: {
      start_date: moment('2014-01-01').format('YYYY-MM-DDTHH:mm:ss.SSS'),
      end_date: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
    },
  });
  // Check if user has a startDate. If s/he is a new reviewer, there will be no
  // startDate, so we set it to the present day.
  let startDate;
  if (completedReviews.body.length) {
    startDate = completedReviews.body
      .map(review => moment(review.assigned_at)) // returns date of review
      .map(date => date.valueOf()) // returns date in Unix Time (milliseconds from 1970)
      .reduce((acc, val) => { // returns the smallest number
        if (acc < val) {
          return acc;
        }
        return val;
      });
  } else {
    startDate = moment.utc();
  }
  config.startDate = moment(startDate).format('YYYY-MM-DD');
  startDateSpinner.succeed(`Startdate is ${config.startDate}`);

  const certSpinner = ora('Getting certifications...').start();
  const certifications = await api({
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

const pushbulletTokenInput = () => {
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

const pushbulletChoice = () => {
  inquirer.prompt([{
    type: 'confirm',
    name: 'pushbullet',
    message: 'Do you wish to use PushBullet?',
    default: false,
  }]).then((confirm) => {
    if (confirm.pushbullet) {
      pushbulletTokenInput();
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
    pushbulletChoice();
  });
};

const tokenInput = () => {
  inquirer.prompt([{
    type: 'input',
    name: 'token',
    message: 'Input your token:',
    validate(token) {
      config.token = token;
      return api({task: 'count'})
        .then((res) => {
          /* eslint-disable eqeqeq */
          if (res.statusCode == '200') {
            return true;
          }
          return 'The token was invalid, try again.';
        })
        .catch((err) => {
          console.log('There was an error validating the token.');
          console.log('Make sure you entered the token correctly and that you are not having connectivity issues.');
          console.log(`
            ${chalk.red('The API request returned with the following error:')}\n\n${JSON.stringify(err, null, 4)}`);
          process.exit(1);
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
