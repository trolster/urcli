// npm modules
import notifier from 'node-notifier';
import PushBullet from 'pushbullet';
import moment from 'moment';
// our modules
import {api} from '../../utils';
import env from './assignConfig';
import prompt from './prompt';

const checkAssigned = async () => {
  const assignedResponse = await api({task: 'assigned'});
  const oldAssignedIds = env.assigned.map(s => s.id);
  const newAssigned = assignedResponse.body
    .filter(s => !oldAssignedIds.includes(s.id));

  if (newAssigned.length) {
    env.assigned = assignedResponse.body;
    newAssigned.forEach((s) => {
      // Only add it to the total number of assigned if it's been assigned
      // after the command was initiated.
      if (Date.parse(s.assigned_at) > Date.parse(env.startTime)) {
        env.assignedTotal += 1;
      }
      // Notify the user
      const {name, id} = s.project;
      const title = `New Review Assigned! (${env.assigned.length})`;
      const message = `${moment().format('HH:mm')} - ${name} (${id})`;
      const sound = 'Ping';
      const open = `https://review.udacity.com/#!/submissions/${s.id}`;
      // Desktop notifications
      notifier.notify({title, message, sound, open});
      // PushBullet notifications
      if (env.options.push) {
        const pusher = new PushBullet(env.config.pushbulletToken);
        pusher.note({}, title, `${message}\n\n${open}`, (err) => {
          if (err) throw new Error(`Pushbullet error: ${err}`);
        });
      }
    });
  }
};

const checkPositions = async () => {
  const positionResponse = await api({
    task: 'position',
    id: env.submission_request.id});
  env.positions = positionResponse.body.error ? [] : positionResponse.body;
};

const checkFeedbacks = async () => {
  const stats = await api({task: 'stats'});
  const diff = stats.body.unread_count - env.unreadFeedbacks.length;

  if (diff > 0) {
    const feedbacksResponse = await api({task: 'feedbacks'});
    env.unreadFeedbacks = feedbacksResponse.body.filter(fb => fb.read_at === null);
    // Notify the user of the new feedbacks.
    if (env.options.feedbacks) {
      env.unreadFeedbacks.slice(-diff).forEach((fb) => {
        notifier.notify({
          title: `New ${fb.rating}-star Feedback!`,
          message: `Project: ${fb.project.name}`,
          sound: 'Pop',
          open: `https://review.udacity.com/#!/reviews/${fb.submission_id}`,
        });
      });
    }
  }
  env.unreadFeedbacks = [];
};

const createNewSubmissionRequest = async () => {
  const createResponse = await api({
    task: 'create',
    body: env.submission_request.body,
  });
  Object.assign(env.submission_request, createResponse.body);
  checkPositions();
  env.tick = 0;
};

const refreshSubmissionRequest = async () => {
  const closingIn = Date.parse(env.submission_request.closed_at) - Date.now();
  if (closingIn < 300000) { // Less than 5 minutes
    api({task: 'refresh', id: env.submission_request.id});
  }
};

const refreshInfo = () => {
  if (env.tick % env.checkInfoInterval === 0) {
    if (env.flags.feedbacks) {
      checkFeedbacks();
    }
    checkPositions();
  }
};

const submissionAssigner = async () => {
  try {
    checkAssigned();
    if (env.assigned.length < 2) {
      const getResponse = await api({task: 'get'});
      if (getResponse.body[0]) {
        refreshSubmissionRequest();
        refreshInfo();
      } else {
        createNewSubmissionRequest();
      }
    }
  } catch (e) {
    env.error = e.error.code;
  }
  prompt();
  setTimeout(() => {
    env.tick += 1;
    submissionAssigner();
  }, env.tickrate);
};

export default submissionAssigner;
