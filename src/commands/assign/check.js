// npm modules
import notifier from 'node-notifier';
import PushBullet from 'pushbullet';
import moment from 'moment';
// our modules
import env from './assignEnvironment';
import {api} from '../../utils';

const check = {
  async positions() {
    const positionResponse = await api({
      task: 'position',
      id: env.submission_request.id});
    env.positions = positionResponse.body.error ? [] : positionResponse.body;
  },

  async assigned() {
    const oldAssignedIds = env.assigned.map(s => s.id);
    const assignedResponse = await api({task: 'assigned'});
    env.assigned = assignedResponse.body;

    if (assignedResponse.body.length) {
      env.assigned
        .filter(s => !oldAssignedIds.includes(s.id))
        .forEach((s) => {
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

          notifier.notify({title, message, sound, open});

          if (env.options.push) {
            const pusher = new PushBullet(env.config.pushbulletToken);
            pusher.note({}, title, `${message}\n\n${open}`, (err) => {
              if (err) throw new Error(`Pushbullet error: ${err}`);
            });
          }
        });
    }
  },

  async feedbacks() {
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
  },
};

export default check;
