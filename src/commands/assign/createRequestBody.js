import env from './assignConfig';
import {config} from '../../utils';

const createRequestBody = () => ({
  projects: env.ids
    .reduce((acc, id) => acc
        .concat(config.languages
          .map(language => ({project_id: id, language}))), []),
});

export default createRequestBody;
