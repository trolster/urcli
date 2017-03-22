// node modules
import readline from 'readline';
// npm modules
import moment from 'moment';
import inquirer from 'inquirer';
import chalk from 'chalk';
// our modules
import {Api, Config} from '../utils';

const config = new Config();
let api;

function getUserInfo() {
  /* SET FIRST REVIEW DATE */
  const firstReviewDate = api.call({
    task: 'completed',
    body: {
      start_date: moment('2017-03-21').format('YYYY-MM-DDTHH:mm:ss.SSS'),
      end_date: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
    },
  }).then((res) => {
     // returns the smallest number
    const firstDate = res.body
      .map(review => moment(review.assigned_at)) // returns date of review
      .map(date => date.valueOf()) // returns date in Unix Time (milliseconds from 1970)
      .reduce((acc, val) => {
        if (acc < val) {
          return acc;
        }
        return val;
      });
    config.startDate = moment(firstDate).format('YYYY-MM-DD');
    return Promise.resolve();
  });

  /* SET THE CERTIFICATIONS */
  const certifications = api.call({
    task: 'certifications'
  }).then((res) => {
    const certs = res.body
      .filter(cert => cert.status === 'certified')
      .reduce((acc, cert) => {
        /* eslint-disable no-param-reassign */
        acc[cert.project.id] = {
          name: cert.project.name,
          price: cert.project.price,
        };
        return acc;
      }, {});
    config.certs = certs;
    return Promise.resolve();
  });

  Promise.all([firstReviewDate, certifications]).then(() => {
    config.save();
    console.log(config);
    process.exit(0);
  })
}

const accessToken = () => {
  inquirer.prompt([{
    type: 'input',
    name: 'accessToken',
    message: 'Input your access token:'
  }]).then((answer) => {
    Object.assign(config, answer);
    getUserInfo();
  })
}

const pushbullet = () => {
  inquirer.prompt([{
    type: 'confirm',
    name: 'pushbullet',
    message: 'Do you wish to use PushBullet?',
    default: false
  }]).then((answer) => {
    if (answer.pushbullet) {
      accessToken();
    } else {
      getUserInfo();
    }
  })
}

const languages = () => {
  inquirer.prompt([{
    type: 'checkbox',
    message: 'Select Language(s) that you are certified for:\n',
    name: 'languages',
    choices: ['en-us','pt-br','zh-cn','es-es'],
    validate: function (answer) {
      if (answer.length < 1) {
        return 'You must choose at least one language.';
      }
      return true;
    }
  }]).then((answers) => {
    Object.assign(config, answers);
    pushbullet();
  })
}

export const setupCmd = () => {
  inquirer.prompt([{
    type: 'input',
    name: 'token',
    message: 'Input your token:',
    validate(answer) {
      api = new Api(answer);
      return api.call({task: 'count'}).then((res) => {
        if (res.statusCode == '200') {
          return true
        }
        return 'The token was invalid, try again.';
      })
    }
  }]).then((answer) => {
    config.token = answer;
    languages();
  })
}
