// npm modules
import moment from 'moment';
import inquirer from 'inquirer';
import PushBullet from 'pushbullet';
// our modules
import {Api, Config} from '../utils';

// TODO
// Have a nice spinner

const config = new Config();
let api;

function getUserInfoFromApi() {
  const firstReviewDate = api.call({
    task: 'completed',
    body: {
      start_date: moment('2014-01-01').format('YYYY-MM-DDTHH:mm:ss.SSS'),
      end_date: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
    },
  }).then((reviews) => {
    const startDate = reviews.body
      .map(review => moment(review.assigned_at)) // returns date of review
      .map(date => date.valueOf()) // returns date in Unix Time (milliseconds from 1970)
      .reduce((acc, val) => { // returns the smallest number
        if (acc < val) {
          return acc;
        }
        return val;
      });
    config.startDate = moment(startDate).format('YYYY-MM-DD');
    return Promise.resolve();
  });
  const certifications = api.call({
    task: 'certifications',
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
    process.exit(0);
  });
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
    languages();
  });
};

export const setupCmd = () => {
  tokenInput();
};
