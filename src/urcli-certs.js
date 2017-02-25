// project dependencies
const cli = require('commander');
// our modules
const apiCall = require('./apiCall');
const config = require('./config');

cli.parse(process.argv);

config.certs = {};
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
