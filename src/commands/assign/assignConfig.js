import moment from 'moment';

export default {
  tick: 0,
  update: true,
  updateInterval: 30, // 30 seconds.
  updateInfo: true,
  updateInfoInterval: 300, // 5 minutes.
  refreshInterval: 300, // 5 minutes.
  flags: {
    push: false,
    feedbacks: false,
    silent: false,
    verbose: false,
    helptext: false,
    infotext: false,
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
