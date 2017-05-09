import moment from 'moment';

export default {
  tick: 0,
  update: true,
  refresh: false,
  updatePositions: false,
  updateFeedbacks: true,
  updateInterval: 30, // 30 seconds.
  updatePositionsInterval: 300, // 5 minutes.
  refreshInterval: 300, // 5 minutes.
  updateFeedbacksInterval: 300, // 5 minutes
  flags: {
    push: false,
    feedbacks: false,
    silent: false,
    verbose: false,
    helptext: false,
    infotext: false,
  },
  requestIds: [],
  submission_request: {},
  startTime: moment(),
  error: '',
  key: '',
  assignedTotal: 0,
  ids: [],
  assigned: [],
  positions: [],
  unreadFeedbacks: [],
};
