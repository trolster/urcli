// project dependencies
import moment from 'moment';
import cli from 'commander';
// our modules
import config from './config';

cli.parse(process.argv);

config.token = cli.args[0];
config.tokenAge = moment().add(28, 'd');
config.save();
