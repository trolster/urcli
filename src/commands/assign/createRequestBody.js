import env from './assignEnvironment';
import {config} from '../../utils';

export default function createRequestBody() {
  env.submission_request.body = {
    projects: env.ids
      .reduce((acc, id) => acc
          .concat(config.languages
            .map(language => ({project_id: id, language}))), []),
  };
}
