// npm modules
import moment from 'moment';
// our modules
import {config} from '../utils';

export const tokenCmd = (newToken) => {
  const token = newToken;
  const tokenAge = moment().add(28, 'd');
  config.save({token, tokenAge});
};
