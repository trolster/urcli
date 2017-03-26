import env from './assignEnvironment';
import {config} from '../../utils';

export default function validateIds(ids) {
  if (ids[0] === 'all') {
    env.ids = Object.keys(config.certs);
  } else {
    // Validate ids
    const invalid = ids.filter(id => !Object.keys(config.certs).includes(id));
    if (invalid.length) {
      throw new Error(`Error: You are not certified for project(s): ${[...invalid].join(', ')}`);
    }
    env.ids = ids;
  }
}
