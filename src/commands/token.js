// npm modules
import moment from 'moment';
// our modules
import {config} from '../utils';

export const tokenCmd = (newToken) => {
  config.token = newToken;
  config.tokenAge = moment().add(28, 'd');
  config.save();
  console.log('Token saved.');
  process.exit(0);
};
