// npm modules
import notifier from 'node-notifier';
import PushBullet from 'pushbullet';
import moment from 'moment';
// our modules
import {api} from '../../utils';
import env from './assignConfig';
import setPrompt from './prompt';

const checkAssigned = async () => {
  const assignedResponse = await api({task: 'assigned'});
  // There are edge-cases where someone completes a reviews within the update
  // window, and also gets one assigned. This happens. So we have to always
  // check the actual reviews that are assigned. We can't just check if the
  // number of reviews has increased or decreased.
  if (assignedResponse.body.length) {
    const oldAssignedIds = env.assigned.map(s => s.id);
    const newlyAssigned = assignedResponse.body
      .filter(s => !oldAssignedIds.includes(s.id));

    if (newlyAssigned.length) {
      newlyAssigned.forEach((s) => {
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
        if (env.flags.push) {
          const pusher = new PushBullet(env.config.pushbulletToken);
          pusher.note({}, title, `${message}\n\n${open}`, (err) => {
            if (err) throw new Error(`Pushbullet error: ${err}`);
          });
        }
      });
    }
  }
  env.assigned = assignedResponse.body;
};

const checkPositions = async () => {
  const positionResponse = await api({
    task: 'position',
    id: env.submission_request.id});
  env.positions = positionResponse.body;
};

const checkFeedbacks = async () => {
  const stats = await api({task: 'stats'});
  const diff = stats.body.unread_count - env.unreadFeedbacks.length;

  if (diff > 0) {
    const feedbacksResponse = await api({task: 'feedbacks'});
    env.unreadFeedbacks = feedbacksResponse.body.filter(fb => fb.read_at === null);
    // Notify the user of the new feedbacks.
    if (env.flags.feedbacks) {
      env.unreadFeedbacks.slice(-diff).forEach((fb) => {
        notifier.notify({
          title: `New ${fb.rating}-star Feedback!`,
          message: `Project: ${fb.project.name}`,
          sound: 'Pop',
          open: `https://review.udacity.com/#!/reviews/${fb.submission_id}`,
        });
      });
    }
  } else if (stats.body.unread_count === 0) {
    env.unreadFeedbacks = [];
  }
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

async function mainLoop() {
  if (env.update) {
    try {
      // Since assigned projects only get counted towards the total number of
      // assigned projects, if it's been assigned in this session, it can be used
      // as a realiable check to see if a new review was assigned since the last
      // iteration of the loop.
      const assignedTotal = env.assignedTotal;
      checkAssigned();
      if (env.assigned.length < 2) {
        // If a new review was assigned we create a new request.
        if (assignedTotal < env.assignedTotal) {
          createNewSubmissionRequest();
        }
        // Check if the request needs to be refreshed.
        const timeSinceLastRefresh = Date.now() - Date.parse(env.submission_request.updated_at);
        if (timeSinceLastRefresh > env.refreshInterval) { // Refreshes every 5 minutes
          api({
            task: 'refresh',
            id: env.submission_request.id,
          });
        }
        // Check if the info needs to update
        if (env.updateInfo) {
          if (env.flags.feedbacks) {
            checkFeedbacks();
          }
          checkPositions();
        }
      }
      setPrompt();
    } catch (e) {
      env.error = e.error.code;
    }
  }
  // Set/reset to the default update intervals. This allows you to force an
  // update by the user, by setting either value to true. It also avoids the
  // problem where the env.updateInfoInterval has to be divisible by
  // env.updateInterval for the info to get updated.
  env.update = env.tick % env.updateInterval === 0;
  env.updateInfo = env.tick % env.updateInfoInterval === 0;
  // Run the loop every second
  setTimeout(() => {
    env.tick += 1;
    mainLoop();
  }, 1000);
}

export default mainLoop;
