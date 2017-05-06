import moment from 'moment';

export default {
  tick: 0,
  tickrate: 3000, // How often submissionAssigner is called, in ms.
  checkInfoInterval: 1, // Becomes n * tickrate ms.
  refreshInterval: 300000, // (60 seconds * 5 minutes) * 1000 for ms
  flags: {
    push: false,
    feedbacks: false,
    silent: false,
    debug: false,
    helptext: false,
  },
  submission_request: {
    id: 0,
    body: {},
    closed_at: '',
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
