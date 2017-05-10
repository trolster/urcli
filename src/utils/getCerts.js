// our modules
import {config, api} from './';

async function getCerts() {
  const certifications = await api({task: 'certifications'});

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
}

export default getCerts;
