import moment from 'moment';

const assignEnvironment = {
  tick: 0,
  flags: {
    silent: false,
    assignment: false,
    feedbacks: false,
    helptext: false,
  },
  submission_request: {
    id: 0,
    body: {},
  },
  startTime: moment(),
  error: '',
  key: '',
  assignedTotal: 0,
  ids: [],
  assigned: [],
  positions: [],
  unreadFeedbacks: [],
};

export default assignEnvironment;
