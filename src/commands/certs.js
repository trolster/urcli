// our modules
import {api, config} from '../utils';

export const certsCmd = async () => {
  const token = config.token;
  const task = 'certifications';

  const certsResponse = await api({token, task});
  const certs = certsResponse.body
    .filter(cert => cert.status === 'certified')
    .reduce((acc, cert) => {
      /* eslint-disable no-param-reassign */
      acc[cert.project.id] = {
        name: cert.project.name,
        price: cert.project.price,
      };
      return acc;
    }, {});
  config.save({certs});
};
